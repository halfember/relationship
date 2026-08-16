import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeRelationshipType } from '../relationship/relationship-type';
import { AcceptContactInviteDto, CreateContactInviteDto } from './dto/contact.dto';
import { randomInt } from 'crypto';

function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 8; i += 1) token += chars[randomInt(chars.length)];
  return token;
}

function orderedUsers(left: number, right: number) {
  return left < right ? { userAId: left, userBId: right } : { userAId: right, userBId: left };
}

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvite(userId: number, dto: CreateContactInviteDto) {
    const type = normalizeRelationshipType(dto.relationshipType);
    const name = (dto.relationshipName || dto.displayName).trim();
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, nickname: true, avatar: true } });
    if (!user) throw new NotFoundException('用户不存在');

    const relationship = await this.prisma.relationship.findFirst({ where: { userId, name } });
    const ownRelationship = relationship || (await this.prisma.relationship.create({
      data: { userId, name, type },
    }));
    const token = generateToken();
    const invite = await this.prisma.contactInvite.create({
      data: {
        inviterId: userId,
        inviterRelationshipId: ownRelationship.id,
        token,
        displayName: dto.displayName.trim(),
        relationshipType: type,
        message: dto.message?.trim() || undefined,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return this.inviteResponse(invite, user);
  }

  async previewInvite(rawToken: string) {
    const token = rawToken.trim().toUpperCase();
    const invite = await this.prisma.contactInvite.findUnique({
      where: { token },
      include: { inviter: { select: { id: true, nickname: true, avatar: true } } },
    });
    if (!invite) throw new NotFoundException('联系人邀请不存在');
    const state = this.inviteState(invite.status, invite.expiresAt);
    return {
      token: invite.token,
      state,
      expiresAt: invite.expiresAt,
      message: invite.message,
      inviter: invite.inviter,
    };
  }

  async listSentInvites(userId: number) {
    await this.prisma.contactInvite.updateMany({
      where: { inviterId: userId, status: 'PENDING', expiresAt: { lte: new Date() } },
      data: { status: 'EXPIRED' },
    });
    const invites = await this.prisma.contactInvite.findMany({
      where: { inviterId: userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    return invites.map((invite) => this.inviteResponse(invite, { id: userId }));
  }

  async revokeInvite(id: number, userId: number) {
    const revoked = await this.prisma.contactInvite.updateMany({
      where: { id, inviterId: userId, status: 'PENDING' },
      data: { status: 'REVOKED' },
    });
    if (revoked.count !== 1) throw new BadRequestException('邀请不存在或已无法撤回');
    return { id, status: 'REVOKED' };
  }

  async rejectInvite(userId: number, dto: AcceptContactInviteDto) {
    const token = dto.token.trim().toUpperCase();
    const invite = await this.prisma.contactInvite.findUnique({ where: { token } });
    if (!invite) throw new NotFoundException('联系人邀请不存在');
    if (invite.inviterId === userId) throw new BadRequestException('不能拒绝自己的邀请');
    if (this.inviteState(invite.status, invite.expiresAt) !== 'PENDING') {
      throw new BadRequestException('邀请已失效');
    }
    const rejected = await this.prisma.contactInvite.updateMany({
      where: { id: invite.id, status: 'PENDING', expiresAt: { gt: new Date() } },
      data: { status: 'REJECTED', acceptedById: userId, acceptedAt: new Date() },
    });
    if (rejected.count !== 1) throw new ConflictException('邀请正在被处理或已经失效');
    return { id: invite.id, status: 'REJECTED' };
  }

  async acceptInvite(userId: number, dto: AcceptContactInviteDto) {
    const token = dto.token.trim().toUpperCase();
    const invite = await this.prisma.contactInvite.findUnique({
      where: { token },
      include: { inviter: true, inviterRelationship: true },
    });
    if (!invite) throw new NotFoundException('联系人邀请不存在');
    const state = this.inviteState(invite.status, invite.expiresAt);
    if (state === 'EXPIRED') {
      await this.prisma.contactInvite.update({ where: { id: invite.id }, data: { status: 'EXPIRED' } });
      throw new BadRequestException('邀请已过期');
    }
    if (state !== 'PENDING') throw new BadRequestException('邀请已失效');
    if (invite.inviterId === userId) throw new BadRequestException('不能接受自己的邀请');

    const { userAId, userBId } = orderedUsers(invite.inviterId, userId);
    const displayName = (dto.displayName || invite.inviter.nickname || '对方').trim();
    const relationshipType = normalizeRelationshipType(dto.relationshipType || '朋友');
    const result = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.contactInvite.updateMany({
        where: { id: invite.id, status: 'PENDING', expiresAt: { gt: new Date() } },
        data: { status: 'PROCESSING' },
      });
      if (claimed.count !== 1) throw new ConflictException('邀请正在被处理或已经失效');
      const existing = await tx.contactConnection.findUnique({ where: { userAId_userBId: { userAId, userBId } } });
      if (existing?.status === 'ACTIVE') throw new ConflictException('你们已经是联系人');
      if (existing?.sharedSpaceId) throw new ConflictException('该联系人已有共同空间');
      const currentRelationship = await tx.relationship.findFirst({ where: { userId, name: displayName } });
      const recipientRelationship = currentRelationship || (await tx.relationship.create({
        data: { userId, name: displayName, type: relationshipType },
      }));
      const relationshipAId = invite.inviterId === userAId ? invite.inviterRelationshipId : recipientRelationship.id;
      const relationshipBId = invite.inviterId === userBId ? invite.inviterRelationshipId : recipientRelationship.id;
      const connection = existing
        ? await tx.contactConnection.update({
            where: { id: existing.id },
            data: {
              relationshipAId,
              relationshipBId,
              status: 'ACTIVE',
              createdById: invite.inviterId,
              disconnectedAt: null,
            },
          })
        : await tx.contactConnection.create({
            data: { userAId, userBId, relationshipAId, relationshipBId, createdById: invite.inviterId },
          });
      await tx.contactInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED', acceptedById: userId, acceptedAt: new Date() },
      });
      return { connection, relationship: recipientRelationship };
    });
    return {
      id: result.connection.id,
      status: result.connection.status,
      relationship: result.relationship,
      inviter: { id: invite.inviter.id, nickname: invite.inviter.nickname, avatar: invite.inviter.avatar },
    };
  }

  async listConnections(userId: number) {
    const connections = await this.prisma.contactConnection.findMany({
      where: { status: 'ACTIVE', OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { select: { id: true, nickname: true, avatar: true } },
        userB: { select: { id: true, nickname: true, avatar: true } },
        relationshipA: { select: { id: true, userId: true, name: true, type: true, avatar: true, sharedSpaceId: true } },
        relationshipB: { select: { id: true, userId: true, name: true, type: true, avatar: true, sharedSpaceId: true } },
        sharedSpace: { select: { id: true, name: true, type: true, status: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return connections.map((connection) => ({
      id: connection.id,
      status: connection.status,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
      sharedSpace: connection.sharedSpace,
      otherUser: connection.userAId === userId ? connection.userB : connection.userA,
      relationship: connection.userAId === userId ? connection.relationshipA : connection.relationshipB,
    }));
  }

  async getConnection(id: number, userId: number) {
    const connection = await this.prisma.contactConnection.findFirst({
      where: { id, status: 'ACTIVE', OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { select: { id: true, nickname: true, avatar: true } },
        userB: { select: { id: true, nickname: true, avatar: true } },
        relationshipA: { select: { id: true, userId: true, name: true, type: true, avatar: true, sharedSpaceId: true, _count: { select: { events: true, memories: true } } } },
        relationshipB: { select: { id: true, userId: true, name: true, type: true, avatar: true, sharedSpaceId: true, _count: { select: { events: true, memories: true } } } },
        sharedSpace: { select: { id: true, name: true, type: true, status: true } },
      },
    });
    if (!connection) throw new NotFoundException('联系人连接不存在');
    return {
      id: connection.id,
      status: connection.status,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
      sharedSpace: connection.sharedSpace,
      otherUser: connection.userAId === userId ? connection.userB : connection.userA,
      relationship: connection.userAId === userId ? connection.relationshipA : connection.relationshipB,
    };
  }

  async disconnect(id: number, userId: number) {
    const connection = await this.prisma.contactConnection.findFirst({
      where: { id, status: 'ACTIVE', OR: [{ userAId: userId }, { userBId: userId }] },
    });
    if (!connection) throw new NotFoundException('联系人连接不存在');
    if (connection.sharedSpaceId) throw new BadRequestException('请先退出共同空间，再解除联系人连接');
    return this.prisma.contactConnection.update({
      where: { id },
      data: { status: 'DISCONNECTED', disconnectedAt: new Date() },
    });
  }

  private inviteState(status: string, expiresAt: Date) {
    if (status === 'PENDING' && expiresAt <= new Date()) return 'EXPIRED';
    return status;
  }

  private inviteResponse(invite: any, inviter: any) {
    return {
      id: invite.id,
      token: invite.token,
      status: invite.status,
      expiresAt: invite.expiresAt,
      displayName: invite.displayName,
      relationshipType: invite.relationshipType,
      inviter: { id: inviter.id, nickname: inviter.nickname, avatar: inviter.avatar },
      path: `/pages/contact/invite-accept?token=${invite.token}`,
    };
  }
}
