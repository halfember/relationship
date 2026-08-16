import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { computeNextOccurrence, daysUntilDate } from '../reminder/reminder-date';
import { ReminderService } from '../reminder/reminder.service';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService, @Optional() private readonly reminderService?: ReminderService) {}

  async findUpcomingForUser(userId: number, requestedDays = 90) {
    if (requestedDays < 1 || requestedDays > 365) {
      throw new BadRequestException('查询范围应在 1 到 365 天之间');
    }
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const windowEnd = new Date(dayStart);
    windowEnd.setDate(windowEnd.getDate() + requestedDays);

    const [events, sharedEvents] = await Promise.all([
      this.prisma.event.findMany({
        where: { relationship: { userId } },
        include: { relationship: { select: { id: true, name: true } } },
      }),
      this.prisma.sharedEvent.findMany({
        where: {
          space: { status: 'ACTIVE', members: { some: { userId, status: 'ACTIVE' } } },
        },
        include: { space: { select: { id: true, name: true } } },
      }),
    ]);

    const occurrences = [
      ...events.map((event) => {
        const eventDate = computeNextOccurrence(event.eventDate, event.repeatType, dayStart);
        return eventDate ? {
          id: `relationship:${event.id}`,
          sourceType: 'RELATIONSHIP',
          relationshipId: event.relationshipId,
          eventId: event.id,
          sharedSpaceId: null,
          sharedEventId: null,
          eventTitle: event.title,
          relationshipName: event.relationship.name,
          eventDate,
          repeatType: event.repeatType,
          daysUntilEvent: daysUntilDate(eventDate, dayStart),
        } : null;
      }),
      ...sharedEvents.map((event) => {
        const eventDate = computeNextOccurrence(event.eventDate, event.repeatType, dayStart);
        return eventDate ? {
          id: `space:${event.id}`,
          sourceType: 'SPACE',
          relationshipId: null,
          eventId: null,
          sharedSpaceId: event.spaceId,
          sharedEventId: event.id,
          eventTitle: event.title,
          relationshipName: event.space.name,
          eventDate,
          repeatType: event.repeatType,
          daysUntilEvent: daysUntilDate(eventDate, dayStart),
        } : null;
      }),
    ];

    return occurrences
      .filter((item): item is NonNullable<typeof item> => Boolean(item && item.eventDate <= windowEnd))
      .sort((left, right) => left.eventDate.getTime() - right.eventDate.getTime());
  }

  /** 创建纪念日/事件 */
  async create(dto: CreateEventDto, userId?: number) {
    if (userId !== undefined) await this.assertRelationshipOwner(dto.relationshipId, userId);
    const event = await this.prisma.event.create({
      data: {
        relationshipId: dto.relationshipId,
        title: dto.title,
        eventDate: new Date(dto.eventDate),
        repeatType: dto.repeatType,
        remindDays: dto.remindDays,
      },
    });
    if (this.reminderService && userId !== undefined) await this.reminderService.generateUpcoming(userId);
    return event;
  }

  /** 查询关系下的所有事件 */
  async findByRelationshipId(relationshipId: number, userId?: number) {
    if (userId !== undefined) await this.assertRelationshipOwner(relationshipId, userId);
    return this.prisma.event.findMany({
      where: { relationshipId },
      orderBy: { eventDate: 'asc' },
    });
  }

  async findAllForUser(userId: number) {
    return this.prisma.event.findMany({
      where: { relationship: { userId } },
      include: { relationship: { select: { id: true, name: true } } },
      orderBy: { eventDate: 'asc' },
    }).then((items) => items.map(({ relationship, ...event }) => ({
      ...event,
      relationshipName: relationship.name,
    })));
  }

  /** 查询单个事件 */
  async findById(id: number, userId?: number) {
    const event = await this.prisma.event.findFirst({
      where: { id, ...(userId !== undefined ? { relationship: { userId } } : {}) },
    });
    if (!event) throw new NotFoundException('事件不存在');
    return event;
  }

  /** 更新事件 */
  async update(id: number, dto: UpdateEventDto, userId?: number) {
    await this.findById(id, userId);
    const [event] = await this.prisma.$transaction([
      this.prisma.event.update({
        where: { id },
        data: {
          ...dto,
          eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
          remindDays: dto.remindDays,
        },
      }),
      this.prisma.reminder.deleteMany({ where: { sourceType: 'RELATIONSHIP', eventId: id } }),
    ]);
    if (this.reminderService && userId !== undefined) await this.reminderService.generateUpcoming(userId);
    return event;
  }

  /** 删除事件 */
  async delete(id: number, userId?: number) {
    await this.findById(id, userId);
    await this.prisma.$transaction([
      this.prisma.reminder.deleteMany({ where: { sourceType: 'RELATIONSHIP', eventId: id } }),
      this.prisma.event.delete({ where: { id } }),
    ]);
    if (this.reminderService && userId !== undefined) await this.reminderService.generateUpcoming(userId);
    return { id, deleted: true };
  }

  private async assertRelationshipOwner(relationshipId: number, userId: number) {
    const relationship = await this.prisma.relationship.findFirst({ where: { id: relationshipId, userId } });
    if (!relationship) throw new NotFoundException('关系不存在');
  }
}
