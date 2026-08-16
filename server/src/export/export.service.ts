import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeNextOccurrence } from '../reminder/reminder-date';

/**
 * 数据导出服务 - 聚合单条关系的完整数据，供前端生成分享卡片
 */
@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  /** 获取单条关系的完整导出数据 */
  async exportRelationship(relationshipId: number, userId: number) {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      include: {
        events: { orderBy: { eventDate: 'asc' } },
        memories: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!rel) throw new NotFoundException('关系不存在');
    if (rel.userId !== userId) throw new NotFoundException('无权访问');

    const now = new Date();

    // 统计
    const totalEvents = rel.events.length;
    const totalMemories = rel.memories.length;

    // 最近的纪念日（未来 3 个）
    const upcomingEvents = rel.events
      .map((event) => ({ event, nextOccurrence: computeNextOccurrence(event.eventDate, event.repeatType, now) }))
      .filter((item) => item.nextOccurrence !== null)
      .sort((left, right) => left.nextOccurrence!.getTime() - right.nextOccurrence!.getTime())
      .slice(0, 3)
      .map(({ event, nextOccurrence }) => ({
        id: event.id,
        title: event.title,
        eventDate: nextOccurrence,
        repeatType: event.repeatType,
        daysUntil: this.daysBetween(now, nextOccurrence!),
      }));

    // 如果没有未来的，取过去最近 3 个
    const recentPastEvents = upcomingEvents.length === 0
      ? rel.events.slice(-3).reverse().map((e) => ({
          id: e.id,
          title: e.title,
          eventDate: e.eventDate,
          repeatType: e.repeatType,
          daysUntil: this.daysBetween(now, new Date(e.eventDate)),
        }))
      : [];

    // 最近回忆摘要（前 5 条，截断过长的）
    const recentMemories = rel.memories.slice(0, 5).map((m) => ({
      id: m.id,
      content: m.content ? (m.content.length > 60 ? m.content.slice(0, 60) + '...' : m.content) : '',
      imageUrl: m.imageUrl,
      memoryDate: m.memoryDate || m.createdAt,
    }));

    // 关系存在天数（从创建日期到今天）
    const daysSinceCreate = this.daysBetween(new Date(rel.createdAt), now);

    return {
      relationship: {
        id: rel.id,
        name: rel.name,
        type: rel.type,
        emoji: this.typeEmoji(rel.type),
        birthday: rel.birthday,
        tags: rel.tags,
        remark: rel.remark,
        createdAt: rel.createdAt,
      },
      stats: {
        totalEvents,
        totalMemories,
        daysSinceCreate,
      },
      upcomingEvents,
      recentPastEvents,
      recentMemories,
    };
  }

  /** 获取用户所有关系的简要汇总（用于全局导出） */
  async exportAll(userId: number) {
    const rels = await this.prisma.relationship.findMany({
      where: { userId },
      include: {
        _count: { select: { events: true, memories: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    return rels.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      emoji: this.typeEmoji(r.type),
      events: r._count.events,
      memories: r._count.memories,
      daysSinceCreate: this.daysBetween(new Date(r.createdAt), now),
    }));
  }

  private typeEmoji(type: string): string {
    const map: Record<string, string> = {
      '家人': '👨‍👩‍👧',
      '朋友': '🤝',
      '恋人': '💑',
      '同事': '💼',
      '同学': '🎓',
    };
    return map[type] || '👤';
  }

  private daysBetween(a: Date, b: Date): number {
    return Math.floor((b.getTime() - a.getTime()) / 86400000);
  }
}
