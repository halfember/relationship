import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { computeNextOccurrence, daysUntilDate } from './reminder-date';
import { deduplicateReminderOccurrences } from './reminder-dedupe';
import { WechatService } from '../wechat/wechat.service';

const DEFAULT_REMINDER_TEMPLATE_ID = 'TNDeCEq2sRHrJrbw_ZloWQfqlRNOyjXBfuwsWEySDp8';
const TEMPORARY_WECHAT_ERRORS = new Set([-1, 40001, 40014, 42001, 45009]);

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly wechat?: WechatService,
  ) {}

  // ==================== 公开方法 ====================

  /** 获取用户未来 N 天的提醒 */
  async getUpcoming(userId: number, days: number = 7) {
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const reminders = await this.prisma.reminder.findMany({
      where: {
        userId,
        remindDate: {
          gte: now,
          lte: endDate,
        },
      },
      orderBy: { remindDate: 'asc' },
    });
    return deduplicateReminderOccurrences(reminders).map((item) => ({
      ...item,
      daysUntilEvent: daysUntilDate(item.eventDate, now),
    }));
  }

  /** 获取用户今天的提醒 */
  async getToday(userId: number) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const reminders = await this.prisma.reminder.findMany({
      where: {
        userId,
        remindDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      orderBy: { remindDate: 'asc' },
    });
    return deduplicateReminderOccurrences(reminders).map((item) => ({
      ...item,
      daysUntilEvent: daysUntilDate(item.eventDate, today),
    }));
  }

  /** 标记用户已处理；微信送达状态只能由发送任务更新。 */
  async acknowledge(id: number, userId: number) {
    const reminder = await this.prisma.reminder.findFirst({ where: { id, userId } });
    if (!reminder) throw new NotFoundException('提醒不存在');
    return this.prisma.reminder.update({
      where: { id: reminder.id },
      data: { acknowledged: true, acknowledgedAt: new Date() },
    });
  }

  @Cron('0 */10 9-20 * * *', { timeZone: 'Asia/Shanghai' })
  async dispatchReminderDeliveries() {
    return this.dispatchDueReminders();
  }

  async dispatchDueReminders(now = new Date()) {
    if (!this.wechat) {
      this.logger.error('微信消息服务未注入，跳过提醒发送');
      return { sent: 0, noPermission: 0, retry: 0, failed: 0 };
    }

    const staleBefore = new Date(now.getTime() - 15 * 60 * 1000);
    const staleDeliveryWhere = {
      deliveryStatus: 'SENDING',
      lastAttemptAt: { lt: staleBefore },
      sent: false,
    };
    await this.prisma.reminder.updateMany({
      where: { ...staleDeliveryWhere, attemptCount: { lt: 5 } },
      data: { deliveryStatus: 'RETRY', nextAttemptAt: now },
    });
    await this.prisma.reminder.updateMany({
      where: { ...staleDeliveryWhere, attemptCount: { gte: 5 } },
      data: {
        deliveryStatus: 'FAILED',
        nextAttemptAt: null,
        failureCode: 'DELIVERY_TIMEOUT',
        failureMessage: '发送进程中断，结果无法确认',
      },
    });

    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const reminders = await this.prisma.reminder.findMany({
      where: {
        sent: false,
        remindDate: { gte: dayStart, lt: dayEnd },
        deliveryStatus: { in: ['PENDING', 'RETRY'] },
        attemptCount: { lt: 5 },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
      include: { user: { select: { openid: true } } },
      orderBy: { id: 'asc' },
      take: 100,
    });

    const summary = { sent: 0, noPermission: 0, retry: 0, failed: 0 };
    for (const reminder of reminders) {
      const claimed = await this.prisma.reminder.updateMany({
        where: {
          id: reminder.id,
          sent: false,
          deliveryStatus: { in: ['PENDING', 'RETRY'] },
          attemptCount: reminder.attemptCount,
        },
        data: {
          deliveryStatus: 'SENDING',
          attemptCount: { increment: 1 },
          lastAttemptAt: now,
          nextAttemptAt: null,
          failureCode: null,
          failureMessage: null,
        },
      });
      if (claimed.count !== 1) continue;

      const attempt = reminder.attemptCount + 1;
      try {
        const result = await this.wechat.sendSubscribeMessage({
          openid: reminder.user.openid,
          templateId: this.reminderTemplateId(),
          page: this.reminderPage(reminder),
          data: {
            thing1: { value: this.truncateWechatValue(reminder.eventTitle, 20) },
            time2: { value: this.formatWechatDate(reminder.eventDate) },
            thing4: { value: this.reminderDescription(reminder) },
          },
        });
        if (result.errcode === 0) {
          await this.prisma.reminder.update({
            where: { id: reminder.id },
            data: { deliveryStatus: 'SENT', sent: true, sentAt: new Date(), failureCode: null, failureMessage: null },
          });
          summary.sent += 1;
        } else if (result.errcode === 43101) {
          await this.prisma.reminder.update({
            where: { id: reminder.id },
            data: { deliveryStatus: 'NO_PERMISSION', failureCode: String(result.errcode), failureMessage: '用户未授权或授权次数已用完' },
          });
          summary.noPermission += 1;
        } else {
          const status = TEMPORARY_WECHAT_ERRORS.has(result.errcode) && attempt < 5 ? 'RETRY' : 'FAILED';
          await this.prisma.reminder.update({
            where: { id: reminder.id },
            data: {
              deliveryStatus: status,
              nextAttemptAt: status === 'RETRY' ? this.nextRetryAt(now, attempt) : null,
              failureCode: String(result.errcode),
              failureMessage: this.truncateWechatValue(result.errmsg || '微信发送失败', 200),
            },
          });
          summary[status === 'RETRY' ? 'retry' : 'failed'] += 1;
        }
      } catch {
        const status = attempt < 5 ? 'RETRY' : 'FAILED';
        await this.prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            deliveryStatus: status,
            nextAttemptAt: status === 'RETRY' ? this.nextRetryAt(now, attempt) : null,
            failureCode: 'NETWORK',
            failureMessage: '微信消息服务暂不可用',
          },
        });
        summary[status === 'RETRY' ? 'retry' : 'failed'] += 1;
      }
    }
    if (reminders.length > 0) this.logger.log(`提醒发送完成: ${JSON.stringify(summary)}`);
    return summary;
  }

  // ==================== 定时任务 ====================

  /**
   * 每天凌晨 1:00 自动生成未来 30 天的提醒记录
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async generateUpcoming(userId?: number) {
    this.logger.log('🕐 开始生成未来提醒记录...');

    try {
      const now = new Date();
      const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      // 1. 清除已过期的提醒
      const deletedCount = await this.prisma.reminder.deleteMany({
        where: {
          remindDate: { lt: windowStart },
          ...(userId !== undefined ? { userId } : {}),
        },
      });
      this.logger.log(`  清理 ${deletedCount.count} 条过期提醒`);

      const activeMemberWhere: any = {
        status: 'ACTIVE',
        userId: userId !== undefined ? userId : { not: null },
      };
      const [events, sharedEvents] = await Promise.all([
        this.prisma.event.findMany({
          where: {
            remindDays: { not: null as any },
            ...(userId !== undefined ? { relationship: { userId } } : {}),
          },
          include: { relationship: { select: { userId: true, name: true } } },
        }),
        this.prisma.sharedEvent.findMany({
          where: {
            remindDays: { not: null as any },
            space: {
              status: 'ACTIVE',
              members: { some: activeMemberWhere },
            },
          },
          include: {
            space: {
              select: {
                id: true,
                name: true,
                members: { where: activeMemberWhere, select: { userId: true } },
              },
            },
          },
        }),
      ]);

      if (events.length === 0 && sharedEvents.length === 0) {
        this.logger.log('  没有需要生成提醒的事件');
        return;
      }

      const windowEnd = new Date(windowStart.getTime() + 30 * 24 * 60 * 60 * 1000);
      let createdCount = 0;

      for (const event of events) {
        const nextDate = computeNextOccurrence(event.eventDate, event.repeatType);
        if (!nextDate || nextDate > windowEnd) continue;

        const remindDays: number[] = (event.remindDays as number[]) || [0];
        for (const daysBefore of remindDays) {
          createdCount += await this.createReminder({
            sourceType: 'RELATIONSHIP',
            userId: event.relationship.userId,
            relationshipId: event.relationshipId,
            eventId: event.id,
            eventTitle: event.title,
            relationshipName: event.relationship.name,
            eventDate: nextDate,
            daysBefore,
            windowStart,
            windowEnd,
          });
        }
      }

      for (const event of sharedEvents) {
        const nextDate = computeNextOccurrence(event.eventDate, event.repeatType);
        if (!nextDate || nextDate > windowEnd) continue;

        const remindDays: number[] = (event.remindDays as number[]) || [0];
        for (const member of event.space.members) {
          if (member.userId === null) continue;
          for (const daysBefore of remindDays) {
            createdCount += await this.createReminder({
              sourceType: 'SPACE',
              userId: member.userId,
              sharedSpaceId: event.spaceId,
              sharedEventId: event.id,
              eventTitle: event.title,
              relationshipName: event.space.name,
              eventDate: nextDate,
              daysBefore,
              windowStart,
              windowEnd,
            });
          }
        }
      }

      this.logger.log(`✅ 提醒生成完成， 新增 ${createdCount} 条`);
    } catch (err) {
      this.logger.error('提醒生成失败:', err);
      throw err;
    }
  }

  private async createReminder(input: {
    sourceType: 'RELATIONSHIP' | 'SPACE';
    userId: number;
    relationshipId?: number;
    eventId?: number;
    sharedSpaceId?: number;
    sharedEventId?: number;
    eventTitle: string;
    relationshipName: string;
    eventDate: Date;
    daysBefore: number;
    windowStart: Date;
    windowEnd: Date;
  }): Promise<number> {
    const remindDate = new Date(input.eventDate.getTime() - input.daysBefore * 24 * 60 * 60 * 1000);
    if (remindDate < input.windowStart || remindDate > input.windowEnd) return 0;

    const existing = await this.prisma.reminder.findFirst({
      where: {
        userId: input.userId,
        sourceType: input.sourceType,
        relationshipId: input.relationshipId,
        eventId: input.eventId,
        sharedSpaceId: input.sharedSpaceId,
        sharedEventId: input.sharedEventId,
        remindDate,
      },
    });
    if (existing) return 0;

    try {
      await this.prisma.reminder.create({
        data: {
          userId: input.userId,
          sourceType: input.sourceType,
          relationshipId: input.relationshipId,
          eventId: input.eventId,
          sharedSpaceId: input.sharedSpaceId,
          sharedEventId: input.sharedEventId,
          eventTitle: input.eventTitle,
          relationshipName: input.relationshipName,
          eventDate: input.eventDate,
          remindDate,
          daysUntil: input.daysBefore,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return 0;
      throw error;
    }
    return 1;
  }

  private reminderPage(reminder: any) {
    return reminder.sourceType === 'SPACE' && reminder.sharedSpaceId
      ? `pages/space/detail?id=${reminder.sharedSpaceId}`
      : `pages/relationship/detail?id=${reminder.relationshipId || ''}`;
  }

  private reminderTemplateId() {
    return process.env.WECHAT_REMINDER_TEMPLATE_ID || DEFAULT_REMINDER_TEMPLATE_ID;
  }

  private reminderDescription(reminder: any) {
    const timing = reminder.daysUntil === 0 ? '今天' : `提前${reminder.daysUntil}天`;
    return this.truncateWechatValue(`${reminder.relationshipName} · ${timing}`, 20);
  }

  private formatWechatDate(value: Date) {
    const date = new Date(value);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }

  private truncateWechatValue(value: string, length: number) {
    return Array.from(String(value || '')).slice(0, length).join('');
  }

  private nextRetryAt(now: Date, attempt: number) {
    const delayMinutes = Math.min(60, 5 * 2 ** attempt);
    return new Date(now.getTime() + delayMinutes * 60 * 1000);
  }
}
