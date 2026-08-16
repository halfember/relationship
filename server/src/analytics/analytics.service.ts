import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { groupDatesByMonthWeek } from './analytics-period';
import { deduplicateReminderOccurrences } from '../reminder/reminder-dedupe';
import { BadRequestException } from '@nestjs/common';
import { TrackEventDto } from './dto/track-event.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackEvent(userId: number, dto: TrackEventDto) {
    if (dto.metadata && JSON.stringify(dto.metadata).length > 2048) {
      throw new BadRequestException('事件属性过多');
    }
    await this.prisma.productEvent.create({
      data: {
        userId,
        eventName: dto.eventName,
        page: dto.page,
        sessionId: dto.sessionId,
        metadata: dto.metadata,
      },
    });
    return { accepted: true };
  }

  /** 获取用户数据总览 */
  async getDashboard(userId: number) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const [
      totalRelationships,
      totalEvents,
      totalMemories,
      totalAiRecords,
      totalReminders,
      relationships,
      monthReminders,
    ] = await Promise.all([
      this.prisma.relationship.count({ where: { userId } }),
      this.prisma.relationship
        .findMany({ where: { userId }, select: { _count: { select: { events: true } } } })
        .then((list) => list.reduce((sum, r) => sum + r._count.events, 0)),
      this.prisma.relationship
        .findMany({ where: { userId }, select: { _count: { select: { memories: true } } } })
        .then((list) => list.reduce((sum, r) => sum + r._count.memories, 0)),
      this.prisma.aiRecord.count({ where: { userId } }),
      this.prisma.reminder.count({ where: { userId } }),
      this.prisma.relationship.findMany({
        where: { userId },
        include: { _count: { select: { events: true, memories: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reminder.findMany({
        where: {
          userId,
          remindDate: { gte: monthStart, lt: monthEnd },
          sent: false,
          acknowledged: false,
          deliveryStatus: { in: ['PENDING', 'SENDING', 'RETRY'] },
        },
        orderBy: { remindDate: 'asc' },
      }),
    ]);

    const pendingOccurrences = deduplicateReminderOccurrences(monthReminders);

    return {
      overview: {
        totalRelationships,
        totalEvents,
        totalMemories,
        totalAiRecords,
        totalReminders,
        monthPendingReminders: pendingOccurrences.length,
      },
      weeklyReminderTrend: groupDatesByMonthWeek(pendingOccurrences.map((item) => item.remindDate)),
      byType: this.aggregateByType(relationships),
      topRelationships: relationships.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        eventCount: r._count.events,
        memoryCount: r._count.memories,
      })),
      graph: {
        center: '我',
        nodes: relationships.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          eventCount: r._count.events,
          memoryCount: r._count.memories,
        })),
      },
    };
  }

  /** 获取月活跃度数据（最近 6 个月） */
  async getMonthlyActivity(userId: number) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // 获取该用户所有关系 ID
    const relationships = await this.prisma.relationship.findMany({
      where: { userId },
      select: { id: true },
    });
    const relIds = relationships.map((r) => r.id);

    if (relIds.length === 0) return [];

    const [events, memories] = await Promise.all([
      this.prisma.event.findMany({
        where: { relationshipId: { in: relIds }, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
      this.prisma.memory.findMany({
        where: { relationshipId: { in: relIds }, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
    ]);

    // 构建月份数组
    const months: string[] = [];
    const cursor = new Date(sixMonthsAgo);
    while (cursor <= new Date()) {
      months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // 按月聚合
    const countByMonth = (items: { createdAt: Date }[]) => {
      const map: Record<string, number> = {};
      months.forEach((m) => (map[m] = 0));
      items.forEach((item) => {
        const d = new Date(item.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (map[key] !== undefined) map[key]++;
      });
      return map;
    };

    const eventMap = countByMonth(events);
    const memoryMap = countByMonth(memories);

    return months.map((month) => ({
      month,
      label: month.substring(5) + '月',
      events: eventMap[month],
      memories: memoryMap[month],
    }));
  }

  /** 按关系类型聚合统计 */
  private aggregateByType(relationships: any[]) {
    const map: Record<string, number> = {};
    relationships.forEach((r) => {
      map[r.type] = (map[r.type] || 0) + 1;
    });
    return Object.entries(map).map(([type, count]) => ({ type, count }));
  }
}
