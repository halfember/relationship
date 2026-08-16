import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { UpdateRelationshipDto } from './dto/update-relationship.dto';
import { normalizeRelationshipType } from './relationship-type';
import { UploadStorageService } from '../upload/upload-storage';
import { ReminderService } from '../reminder/reminder.service';

@Injectable()
export class RelationshipService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly storage?: UploadStorageService,
    @Optional() private readonly reminderService?: ReminderService,
  ) {}

  /** 创建关系 */
  async create(dto: CreateRelationshipDto, userId: number = dto.userId) {
    const relationship = await this.prisma.$transaction(async (tx) => {
      const relationship = await tx.relationship.create({
        data: {
          userId,
          name: dto.name.trim(),
          type: normalizeRelationshipType(dto.type),
          avatar: dto.avatar,
          birthday: dto.birthday ? new Date(dto.birthday) : undefined,
          tags: dto.tags,
          remark: dto.remark,
        },
      });
      if (dto.birthday) {
        await tx.event.create({
          data: {
            relationshipId: relationship.id,
            title: '生日',
            eventDate: new Date(dto.birthday),
            repeatType: '每年',
            remindDays: [7, 1, 0],
          },
        });
      }
      return relationship;
    });
    if (this.reminderService && userId !== undefined) await this.reminderService.generateUpcoming(userId);
    return relationship;
  }

  /** 查询用户的所有关系 */
  async findByUserId(userId: number) {
    return this.prisma.relationship.findMany({
      where: { userId },
      include: {
        _count: {
          select: { events: true, memories: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** 查询单个关系详情 */
  async findById(id: number, userId?: number) {
    const relationship = await this.prisma.relationship.findUnique({
      where: { id, ...(userId !== undefined ? { userId } : {}) },
      include: {
        events: { orderBy: { eventDate: 'asc' } },
        memories: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!relationship) throw new NotFoundException('关系不存在');
    return relationship;
  }

  /** 更新关系 */
  async update(id: number, dto: UpdateRelationshipDto, userId?: number) {
    const previous = await this.findById(id, userId);
    const relationship = await this.prisma.$transaction(async (tx) => {
      const relationship = await tx.relationship.update({
        where: { id },
        data: {
          ...dto,
          ...(dto.name ? { name: dto.name.trim() } : {}),
          ...(dto.type ? { type: normalizeRelationshipType(dto.type) } : {}),
          birthday: dto.birthday ? new Date(dto.birthday) : undefined,
          tags: dto.tags,
        },
      });
      if (dto.birthday) {
        const birthdayEvent = await tx.event.findFirst({
          where: { relationshipId: id, title: '生日', repeatType: '每年' },
        });
        if (birthdayEvent) {
          await tx.event.update({
            where: { id: birthdayEvent.id },
            data: { eventDate: new Date(dto.birthday), remindDays: [7, 1, 0] },
          });
          await tx.reminder.deleteMany({ where: { sourceType: 'RELATIONSHIP', eventId: birthdayEvent.id } });
        } else {
          await tx.event.create({
            data: {
              relationshipId: id,
              title: '生日',
              eventDate: new Date(dto.birthday),
              repeatType: '每年',
              remindDays: [7, 1, 0],
            },
          });
        }
      }
      return relationship;
    });
    if (this.reminderService && userId !== undefined) await this.reminderService.generateUpcoming(userId);
    if (dto.avatar !== undefined && dto.avatar !== previous.avatar) {
      await this.storage?.deleteByUrl(previous.avatar);
    }
    return relationship;
  }

  /** 删除关系（级联删除事件和记忆） */
  async delete(id: number, userId?: number) {
    const deletedRelationship = await this.prisma.$transaction(async (tx) => {
      const relationship = await tx.relationship.findFirst({
        where: { id, ...(userId !== undefined ? { userId } : {}) },
        include: { memories: { select: { imageUrl: true } } },
      });
      if (!relationship) throw new NotFoundException('关系不存在');

      const connections = await tx.contactConnection.findMany({
        where: {
          OR: [{ relationshipAId: id }, { relationshipBId: id }],
        },
        include: { sharedSpace: { select: { status: true } } },
      });
      const hasLiveSpace = connections.some((item) =>
        item.sharedSpace && ['ACTIVE', 'PENDING'].includes(item.sharedSpace.status));
      if (hasLiveSpace) throw new BadRequestException('请先退出或解散共同空间，再删除联系人');

      await tx.contactConnection.updateMany({
        where: { OR: [{ relationshipAId: id }, { relationshipBId: id }] },
        data: { status: 'DISCONNECTED', disconnectedAt: new Date(), sharedSpaceId: null },
      });
      await tx.reminder.deleteMany({ where: { sourceType: 'RELATIONSHIP', relationshipId: id } });
      await tx.relationship.delete({ where: { id } });
      return relationship;
    });
    await this.storage?.deleteManyByUrls([
      deletedRelationship.avatar,
      ...(deletedRelationship.memories || []).map((memory) => memory.imageUrl),
    ]);
    return { id, deleted: true };
  }
}
