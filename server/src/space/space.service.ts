import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeRelationshipType } from '../relationship/relationship-type';
import { computeNextOccurrence } from '../reminder/reminder-date';
import { UploadStorageService } from '../upload/upload-storage';
import { ReminderService } from '../reminder/reminder.service';
import {
  AcceptSpaceInviteDto,
  CreateFamilySpaceDto,
  CreatePairInviteDto,
  CreateSharedEventDto,
  CreateSharedMemoryDto,
  CreateSpaceInviteDto,
  CreateSpaceMemberDto,
  UpdateSpaceDto,
  UpdateSpaceMemberDto,
} from './dto/space.dto';
import {
  canDeleteSharedContent,
  canManageSpace,
  canRemoveSpaceMember,
  generateSpaceInviteToken,
  getInviteState,
} from './space-policy';

const ACTIVE = 'ACTIVE';
const PENDING = 'PENDING';

@Injectable()
export class SpaceService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly storage?: UploadStorageService,
    @Optional() private readonly reminderService?: ReminderService,
  ) {}

  async listForUser(userId: number) {
    await this.expirePendingPairSpaces();
    const memberships = await this.prisma.spaceMember.findMany({
      where: { userId, status: ACTIVE, space: { status: { in: [ACTIVE, PENDING] } } },
      include: {
        space: {
          include: {
            members: {
              where: { status: ACTIVE },
              select: { id: true, userId: true, displayName: true, avatar: true, role: true },
            },
            invites: {
              where: { status: PENDING },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { id: true, token: true, expiresAt: true, status: true },
            },
            _count: { select: { events: true, memories: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return memberships.map(({ space, ...membership }) => ({
      ...space,
      currentMember: membership,
    }));
  }

  async getSpace(spaceId: number, userId: number) {
    const currentMember = await this.assertMember(spaceId, userId);
    const space = await this.prisma.sharedSpace.findUnique({
      where: { id: spaceId },
      include: {
        members: {
          where: { status: ACTIVE },
          include: { user: { select: { id: true, nickname: true, avatar: true } } },
          orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
        },
        events: {
          orderBy: { eventDate: 'asc' },
          include: { createdBy: { select: { id: true, nickname: true, avatar: true } } },
        },
        memories: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { createdBy: { select: { id: true, nickname: true, avatar: true } } },
        },
        _count: { select: { events: true, memories: true } },
      },
    });
    if (!space) throw new NotFoundException('共同空间不存在');
    return { ...space, events: this.withNextOccurrence(space.events).slice(0, 20), currentMember };
  }

  async createPairInvite(userId: number, dto: CreatePairInviteDto) {
    await this.expirePendingPairSpaces();
    const [user, relationship] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      dto.relationshipId
        ? this.prisma.relationship.findFirst({ where: { id: dto.relationshipId, userId } })
        : Promise.resolve(null),
    ]);
    if (!user) throw new NotFoundException('用户不存在');
    if (dto.relationshipId && !relationship) throw new NotFoundException('关系不存在');
    const selectedRelationship = relationship;
    if (selectedRelationship?.sharedSpaceId) throw new ConflictException('该关系已经关联共同空间');

    const token = generateSpaceInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = await this.prisma.$transaction(async (tx) => {
      const space = await tx.sharedSpace.create({
        data: { type: 'PAIR', status: PENDING, name: dto.spaceName.trim(), createdById: userId },
      });
      await tx.spaceMember.create({
        data: {
          spaceId: space.id,
          userId,
          displayName: user.nickname || '我',
          avatar: user.avatar,
          role: 'OWNER',
          status: ACTIVE,
          generation: 'PEER',
          joinedAt: new Date(),
        },
      });
      if (selectedRelationship) {
        await tx.relationship.update({ where: { id: selectedRelationship.id }, data: { sharedSpaceId: space.id } });
      } else {
        await tx.relationship.create({
          data: {
            userId,
            name: dto.displayName.trim(),
            type: normalizeRelationshipType(dto.relationshipType),
            sharedSpaceId: space.id,
          },
        });
      }
      if (dto.anniversaryDate) {
        await tx.sharedEvent.create({
          data: {
            spaceId: space.id,
            title: '我们的纪念日',
            eventDate: new Date(dto.anniversaryDate),
            repeatType: '每年',
            remindDays: [7, 1, 0],
            createdById: userId,
          },
        });
      }
      const invite = await tx.spaceInvite.create({
        data: { spaceId: space.id, inviterId: userId, token, expiresAt },
      });
      return { space, invite };
    });

    return this.inviteResponse(result.invite, result.space, user);
  }

  async createFamilySpace(userId: number, dto: CreateFamilySpaceDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    const space = await this.prisma.$transaction(async (tx) => {
      const created = await tx.sharedSpace.create({
        data: { type: 'FAMILY', status: ACTIVE, name: dto.name.trim(), avatar: dto.avatar, createdById: userId },
      });
      await tx.spaceMember.create({
        data: {
          spaceId: created.id,
          userId,
          displayName: user.nickname || '我',
          avatar: user.avatar,
          role: 'OWNER',
          status: ACTIVE,
          relationLabel: '我',
          generation: 'PEER',
          joinedAt: new Date(),
        },
      });
      return created;
    });
    return this.getSpace(space.id, userId);
  }

  async updateSpace(spaceId: number, userId: number, dto: UpdateSpaceDto) {
    const member = await this.assertMember(spaceId, userId);
    if (member.space.type === 'FAMILY' && !canManageSpace(member.role)) {
      throw new ForbiddenException('只有家庭空间创建者或管理员可以修改资料');
    }
    return this.prisma.sharedSpace.update({
      where: { id: spaceId },
      data: { ...(dto.name ? { name: dto.name.trim() } : {}), ...(dto.avatar !== undefined ? { avatar: dto.avatar } : {}) },
    });
  }

  async createInvite(spaceId: number, userId: number, dto: CreateSpaceInviteDto) {
    const member = await this.assertMember(spaceId, userId);
    if (member.space.type === 'PAIR') {
      const memberCount = await this.prisma.spaceMember.count({ where: { spaceId, status: ACTIVE } });
      if (memberCount >= 2) throw new ConflictException('双人空间已经有两位成员');
      await this.prisma.spaceInvite.updateMany({
        where: { spaceId, status: PENDING },
        data: { status: 'REVOKED' },
      });
    }

    let targetMember: any = null;
    if (dto.targetMemberId) {
      targetMember = await this.prisma.spaceMember.findFirst({
        where: { id: dto.targetMemberId, spaceId, status: ACTIVE },
      });
      if (!targetMember) throw new NotFoundException('家庭成员档案不存在');
      if (targetMember.userId) throw new ConflictException('该成员已经绑定账号');
    }

    const invite = await this.prisma.spaceInvite.create({
      data: {
        spaceId,
        inviterId: userId,
        targetMemberId: targetMember?.id,
        token: generateSpaceInviteToken(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    const inviter = await this.prisma.user.findUnique({ where: { id: userId } });
    return this.inviteResponse(invite, member.space, inviter, targetMember);
  }

  async getInvitePreview(rawToken: string) {
    const token = rawToken.trim().toUpperCase();
    const invite = await this.prisma.spaceInvite.findUnique({
      where: { token },
      include: {
        space: { select: { id: true, type: true, name: true, avatar: true, status: true } },
        inviter: { select: { id: true, nickname: true, avatar: true } },
        targetMember: { select: { id: true, displayName: true, avatar: true, relationLabel: true } },
      },
    });
    if (!invite) throw new NotFoundException('邀请不存在');
    return {
      token: invite.token,
      state: getInviteState(invite.status, invite.expiresAt),
      expiresAt: invite.expiresAt,
      space: invite.space,
      inviter: invite.inviter,
      targetMember: invite.targetMember,
    };
  }

  async acceptInvite(userId: number, dto: AcceptSpaceInviteDto) {
    const token = dto.token.trim().toUpperCase();
    const invite = await this.prisma.spaceInvite.findUnique({
      where: { token },
      include: { space: true, inviter: true, targetMember: true },
    });
    if (!invite) throw new NotFoundException('邀请不存在');
    const state = getInviteState(invite.status, invite.expiresAt);
    if (state === 'EXPIRED') {
      await this.prisma.spaceInvite.update({ where: { id: invite.id }, data: { status: 'EXPIRED' } });
      throw new BadRequestException('邀请已过期');
    }
    if (state !== PENDING) throw new BadRequestException('邀请已失效');
    if (invite.inviterId === userId) throw new BadRequestException('不能接受自己的邀请');

    const acceptingUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!acceptingUser) throw new NotFoundException('用户不存在');

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.spaceInvite.updateMany({
        where: { id: invite.id, status: PENDING, expiresAt: { gt: new Date() } },
        data: { status: 'PROCESSING' },
      });
      if (claimed.count !== 1) throw new ConflictException('邀请正在被处理或已经失效');

      const existingMembership = await tx.spaceMember.findFirst({ where: { spaceId: invite.spaceId, userId } });
      if (existingMembership?.status === ACTIVE) throw new ConflictException('你已经加入该空间');

      if (invite.space.type === 'PAIR') {
        const duplicate = await tx.sharedSpace.findFirst({
          where: {
            id: { not: invite.spaceId },
            type: 'PAIR',
            status: ACTIVE,
            AND: [
              { members: { some: { userId: invite.inviterId, status: ACTIVE } } },
              { members: { some: { userId, status: ACTIVE } } },
            ],
          },
        });
        if (duplicate) throw new ConflictException('你们已经有一个共同空间');
      }

      if (invite.targetMemberId) {
        if (existingMembership) {
          throw new ConflictException('你在该空间已有成员记录，无法绑定其他档案');
        }
        const bound = await tx.spaceMember.updateMany({
          where: {
            id: invite.targetMemberId,
            spaceId: invite.spaceId,
            userId: null,
            status: ACTIVE,
          },
          data: {
            userId,
            displayName: dto.displayName || invite.targetMember?.displayName || acceptingUser.nickname || '成员',
            avatar: acceptingUser.avatar || invite.targetMember?.avatar,
            joinedAt: new Date(),
          },
        });
        if (bound.count !== 1) throw new ConflictException('家庭成员档案已被绑定或不存在');
      } else if (existingMembership) {
        await tx.spaceMember.update({
          where: { id: existingMembership.id },
          data: { status: ACTIVE, joinedAt: new Date(), displayName: dto.displayName || acceptingUser.nickname || '成员' },
        });
      } else {
        await tx.spaceMember.create({
          data: {
            spaceId: invite.spaceId,
            userId,
            displayName: dto.displayName || acceptingUser.nickname || '成员',
            avatar: acceptingUser.avatar,
            role: 'MEMBER',
            status: ACTIVE,
            generation: invite.space.type === 'PAIR' ? 'PEER' : undefined,
            joinedAt: new Date(),
          },
        });
      }

      if (invite.space.type === 'PAIR') {
        await tx.sharedSpace.update({ where: { id: invite.spaceId }, data: { status: ACTIVE } });
        const contactConnection = await tx.contactConnection.findFirst({
          where: {
            status: 'ACTIVE',
            OR: [
              { userAId: invite.inviterId, userBId: userId },
              { userAId: userId, userBId: invite.inviterId },
            ],
          },
        });
        let personalRelationship = contactConnection
          ? await tx.relationship.findUnique({
              where: { id: contactConnection.userAId === userId ? contactConnection.relationshipAId || -1 : contactConnection.relationshipBId || -1 },
            })
          : null;
        if (!personalRelationship) {
          personalRelationship = await tx.relationship.findFirst({ where: { userId, sharedSpaceId: invite.spaceId } });
        }
        if (personalRelationship && !personalRelationship.sharedSpaceId) {
          personalRelationship = await tx.relationship.update({ where: { id: personalRelationship.id }, data: { sharedSpaceId: invite.spaceId } });
        }
        if (!personalRelationship) {
          personalRelationship = await tx.relationship.create({
            data: {
              userId,
              name: dto.relationshipName?.trim() || invite.inviter.nickname || '对方',
              type: normalizeRelationshipType(dto.relationshipType),
              avatar: invite.inviter.avatar,
              sharedSpaceId: invite.spaceId,
            },
          });
        }
        if (contactConnection) {
          await tx.contactConnection.update({
            where: { id: contactConnection.id },
            data: {
              sharedSpaceId: invite.spaceId,
              ...(contactConnection.userAId === userId
                ? { relationshipAId: personalRelationship.id }
                : { relationshipBId: personalRelationship.id }),
            },
          });
        }
      }

      await tx.spaceInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED', acceptedById: userId, acceptedAt: new Date() },
      });
    });

    return this.getSpace(invite.spaceId, userId);
  }

  async revokeInvite(spaceId: number, inviteId: number, userId: number) {
    const member = await this.assertMember(spaceId, userId);
    const invite = await this.prisma.spaceInvite.findFirst({ where: { id: inviteId, spaceId } });
    if (!invite) throw new NotFoundException('邀请不存在');
    if (invite.inviterId !== userId && !canManageSpace(member.role)) throw new ForbiddenException('无权撤回邀请');
    if (invite.status !== PENDING) throw new BadRequestException('邀请已无法撤回');
    if (member.space.type === 'PAIR') {
      const [revoked] = await this.prisma.$transaction([
        this.prisma.spaceInvite.update({ where: { id: invite.id }, data: { status: 'REVOKED' } }),
        this.prisma.sharedSpace.update({ where: { id: spaceId }, data: { status: 'ARCHIVED' } }),
        this.prisma.spaceMember.updateMany({ where: { spaceId }, data: { status: 'REMOVED' } }),
        this.prisma.relationship.updateMany({ where: { sharedSpaceId: spaceId }, data: { sharedSpaceId: null } }),
        this.prisma.contactConnection.updateMany({ where: { sharedSpaceId: spaceId }, data: { sharedSpaceId: null } }),
      ]);
      return revoked;
    }
    return this.prisma.spaceInvite.update({ where: { id: invite.id }, data: { status: 'REVOKED' } });
  }

  async listMembers(spaceId: number, userId: number) {
    await this.assertMember(spaceId, userId);
    return this.prisma.spaceMember.findMany({
      where: { spaceId, status: ACTIVE },
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
      orderBy: [{ generation: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async addFamilyProfile(spaceId: number, userId: number, dto: CreateSpaceMemberDto) {
    const member = await this.assertMember(spaceId, userId);
    if (member.space.type !== 'FAMILY') throw new BadRequestException('只有家庭空间可以添加成员档案');
    return this.prisma.spaceMember.create({
      data: {
        spaceId,
        displayName: dto.displayName.trim(),
        avatar: dto.avatar,
        role: 'MEMBER',
        status: ACTIVE,
        relationLabel: dto.relationLabel.trim(),
        generation: dto.generation,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
      },
    });
  }

  async updateMember(spaceId: number, memberId: number, userId: number, dto: UpdateSpaceMemberDto) {
    const currentMember = await this.assertMember(spaceId, userId);
    const target = await this.prisma.spaceMember.findFirst({ where: { id: memberId, spaceId, status: ACTIVE } });
    if (!target) throw new NotFoundException('成员不存在');
    if (target.userId !== userId && !canManageSpace(currentMember.role)) throw new ForbiddenException('无权修改该成员');
    return this.prisma.spaceMember.update({
      where: { id: memberId },
      data: {
        ...(dto.displayName ? { displayName: dto.displayName.trim() } : {}),
        ...(dto.avatar !== undefined ? { avatar: dto.avatar } : {}),
        ...(dto.relationLabel ? { relationLabel: dto.relationLabel.trim() } : {}),
        ...(dto.generation ? { generation: dto.generation } : {}),
        ...(dto.birthday ? { birthday: new Date(dto.birthday) } : {}),
      },
    });
  }

  async removeMember(spaceId: number, memberId: number, userId: number) {
    const currentMember = await this.assertMember(spaceId, userId);
    if (!canManageSpace(currentMember.role)) throw new ForbiddenException('无权移除成员');
    const target = await this.prisma.spaceMember.findFirst({ where: { id: memberId, spaceId, status: ACTIVE } });
    if (!target) throw new NotFoundException('成员不存在');
    if (!canRemoveSpaceMember(currentMember.space.type, target.role)) {
      throw new BadRequestException(
        currentMember.space.type === 'PAIR' ? '双人空间成员请使用退出或解散空间' : '不能移除空间创建者',
      );
    }
    const [removed] = await this.prisma.$transaction([
      this.prisma.spaceMember.update({ where: { id: memberId }, data: { status: 'REMOVED' } }),
      this.prisma.reminder.deleteMany({
        where: { sharedSpaceId: spaceId, userId: target.userId ?? -1 },
      }),
    ]);
    return removed;
  }

  async listEvents(spaceId: number, userId: number) {
    await this.assertMember(spaceId, userId);
    const events = await this.prisma.sharedEvent.findMany({
      where: { spaceId },
      include: { createdBy: { select: { id: true, nickname: true, avatar: true } } },
      orderBy: { eventDate: 'asc' },
    });
    return this.withNextOccurrence(events);
  }

  async createEvent(spaceId: number, userId: number, dto: CreateSharedEventDto) {
    await this.assertMember(spaceId, userId);
    const event = await this.prisma.sharedEvent.create({
      data: {
        spaceId,
        title: dto.title.trim(),
        eventDate: new Date(dto.eventDate),
        repeatType: dto.repeatType,
        remindDays: dto.remindDays,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, nickname: true, avatar: true } } },
    });
    if (this.reminderService) await this.reminderService.generateUpcoming();
    return event;
  }

  async deleteEvent(spaceId: number, eventId: number, userId: number) {
    const member = await this.assertMember(spaceId, userId);
    const event = await this.prisma.sharedEvent.findFirst({ where: { id: eventId, spaceId } });
    if (!event) throw new NotFoundException('共同纪念日不存在');
    if (!canDeleteSharedContent(member.role, event.createdById, userId)) throw new ForbiddenException('无权删除该纪念日');
    await this.prisma.$transaction([
      this.prisma.reminder.deleteMany({ where: { sharedEventId: event.id } }),
      this.prisma.sharedEvent.delete({ where: { id: event.id } }),
    ]);
    return { id: event.id, deleted: true };
  }

  async listMemories(spaceId: number, userId: number) {
    await this.assertMember(spaceId, userId);
    return this.prisma.sharedMemory.findMany({
      where: { spaceId },
      include: { createdBy: { select: { id: true, nickname: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMemory(spaceId: number, userId: number, dto: CreateSharedMemoryDto) {
    await this.assertMember(spaceId, userId);
    if (!dto.imageUrl && !dto.content?.trim()) throw new BadRequestException('请添加照片或文字内容');
    return this.prisma.sharedMemory.create({
      data: {
        spaceId,
        imageUrl: dto.imageUrl,
        content: dto.content?.trim(),
        memoryDate: dto.memoryDate ? new Date(dto.memoryDate) : undefined,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, nickname: true, avatar: true } } },
    });
  }

  async deleteMemory(spaceId: number, memoryId: number, userId: number) {
    const member = await this.assertMember(spaceId, userId);
    const memory = await this.prisma.sharedMemory.findFirst({ where: { id: memoryId, spaceId } });
    if (!memory) throw new NotFoundException('共同回忆不存在');
    if (!canDeleteSharedContent(member.role, memory.createdById, userId)) throw new ForbiddenException('无权删除该回忆');
    await this.prisma.sharedMemory.delete({ where: { id: memory.id } });
    await this.storage?.deleteByUrl(memory.imageUrl);
    return { id: memory.id, deleted: true };
  }

  async leaveSpace(spaceId: number, userId: number) {
    const member = await this.assertMember(spaceId, userId);
    if (member.space.type === 'FAMILY' && member.role === 'OWNER') {
      throw new BadRequestException('请先转让创建者或解散家庭空间');
    }
    await this.prisma.$transaction(async (tx) => {
      if (member.space.type === 'PAIR') {
        await tx.sharedSpace.update({ where: { id: spaceId }, data: { status: 'ARCHIVED' } });
        await tx.spaceMember.updateMany({ where: { spaceId, status: ACTIVE }, data: { status: 'LEFT' } });
        await tx.relationship.updateMany({ where: { sharedSpaceId: spaceId }, data: { sharedSpaceId: null } });
        await tx.contactConnection.updateMany({ where: { sharedSpaceId: spaceId }, data: { sharedSpaceId: null } });
        await tx.reminder.deleteMany({ where: { sharedSpaceId: spaceId } });
      } else {
        await tx.spaceMember.update({ where: { id: member.id }, data: { status: 'LEFT' } });
        await tx.reminder.deleteMany({ where: { sharedSpaceId: spaceId, userId } });
      }
      await tx.spaceInvite.updateMany({ where: { spaceId, status: PENDING }, data: { status: 'REVOKED' } });
    });
    return { id: spaceId, left: true };
  }

  async dissolveSpace(spaceId: number, userId: number) {
    const member = await this.assertMember(spaceId, userId);
    if (member.role !== 'OWNER') throw new ForbiddenException('只有创建者可以解散空间');
    await this.prisma.$transaction([
      this.prisma.sharedSpace.update({ where: { id: spaceId }, data: { status: 'ARCHIVED' } }),
      this.prisma.spaceMember.updateMany({ where: { spaceId, status: ACTIVE }, data: { status: 'REMOVED' } }),
      this.prisma.relationship.updateMany({ where: { sharedSpaceId: spaceId }, data: { sharedSpaceId: null } }),
      this.prisma.contactConnection.updateMany({ where: { sharedSpaceId: spaceId }, data: { sharedSpaceId: null } }),
      this.prisma.spaceInvite.updateMany({ where: { spaceId, status: PENDING }, data: { status: 'REVOKED' } }),
      this.prisma.reminder.deleteMany({ where: { sharedSpaceId: spaceId } }),
    ]);
    return { id: spaceId, dissolved: true };
  }

  private async assertMember(spaceId: number, userId: number) {
    const member = await this.prisma.spaceMember.findFirst({
      where: { spaceId, userId, status: ACTIVE },
      include: { space: true },
    });
    if (!member || member.space.status === 'ARCHIVED') throw new NotFoundException('共同空间不存在或无访问权限');
    return member;
  }

  private async expirePendingPairSpaces() {
    const expired = await this.prisma.spaceInvite.findMany({
      where: {
        status: PENDING,
        expiresAt: { lte: new Date() },
        space: { type: 'PAIR', status: PENDING },
      },
      select: { spaceId: true },
    });
    const spaceIds = [...new Set(expired.map((item) => item.spaceId))];
    if (spaceIds.length === 0) return;
    await this.prisma.$transaction([
      this.prisma.spaceInvite.updateMany({
        where: { spaceId: { in: spaceIds }, status: PENDING },
        data: { status: 'EXPIRED' },
      }),
      this.prisma.sharedSpace.updateMany({
        where: { id: { in: spaceIds }, status: PENDING },
        data: { status: 'ARCHIVED' },
      }),
      this.prisma.spaceMember.updateMany({
        where: { spaceId: { in: spaceIds }, status: ACTIVE },
        data: { status: 'REMOVED' },
      }),
      this.prisma.relationship.updateMany({
        where: { sharedSpaceId: { in: spaceIds } },
        data: { sharedSpaceId: null },
      }),
      this.prisma.contactConnection.updateMany({
        where: { sharedSpaceId: { in: spaceIds } },
        data: { sharedSpaceId: null },
      }),
    ]);
  }

  private withNextOccurrence(events: any[]) {
    return events
      .map((event) => ({
        ...event,
        nextOccurrence: computeNextOccurrence(event.eventDate, event.repeatType),
      }))
      .sort((left, right) => {
        const leftTime = left.nextOccurrence?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const rightTime = right.nextOccurrence?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return leftTime - rightTime || left.eventDate.getTime() - right.eventDate.getTime();
      });
  }

  private inviteResponse(invite: any, space: any, inviter: any, targetMember?: any) {
    return {
      id: invite.id,
      token: invite.token,
      status: invite.status,
      expiresAt: invite.expiresAt,
      space: { id: space.id, type: space.type, name: space.name, avatar: space.avatar },
      inviter: inviter ? { id: inviter.id, nickname: inviter.nickname, avatar: inviter.avatar } : null,
      targetMember: targetMember
        ? { id: targetMember.id, displayName: targetMember.displayName, avatar: targetMember.avatar }
        : null,
      path: `/pages/space/invite-accept?token=${invite.token}`,
    };
  }
}
