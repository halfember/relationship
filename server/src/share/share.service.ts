import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomInt } from 'crypto';

/** 生成 6 位大写字母数字分享码 */
function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[randomInt(chars.length)];
  }
  return result;
}

@Injectable()
export class ShareService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 生成分享邀请码
   */
  async generateInvite(userId: number, relationshipId: number) {
    const rel = await this.prisma.relationship.findFirst({
      where: { id: relationshipId, userId },
    });
    if (!rel) throw new BadRequestException('关系不存在或无权操作');

    const token = generateToken();
    await this.prisma.shareToken.create({
      data: {
        userId,
        relationshipId,
        token,
        // 7 天过期
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });

    return {
      token,
      relationshipName: rel.name,
      expiresIn: '7天',
    };
  }

  /**
   * 通过分享码接受邀请
   */
  async acceptInvite(viewerId: number, token: string) {
    const shareToken = await this.prisma.shareToken.findUnique({
      where: { token },
    });

    if (!shareToken) throw new BadRequestException('分享码无效');
    if (shareToken.used) throw new BadRequestException('分享码已被使用');
    if (shareToken.expiresAt && shareToken.expiresAt < new Date()) {
      throw new BadRequestException('分享码已过期');
    }
    if (shareToken.userId === viewerId) throw new BadRequestException('不能接受自己的分享');

    // 检查是否已有共享记录
    const existing = await this.prisma.sharedAccess.findUnique({
      where: {
        ownerId_viewerId_relationshipId: {
          ownerId: shareToken.userId,
          viewerId,
          relationshipId: shareToken.relationshipId,
        },
      },
    });
    if (existing) throw new BadRequestException('已接受过此共享');

    // 查询关联信息
    const rel = await this.prisma.relationship.findUnique({
      where: { id: shareToken.relationshipId },
    });

    // 创建共享访问 + 标记令牌
    const [access] = await this.prisma.$transaction([
      this.prisma.sharedAccess.create({
        data: {
          ownerId: shareToken.userId,
          viewerId,
          relationshipId: shareToken.relationshipId,
          permission: 'view',
        },
      }),
      this.prisma.shareToken.update({
        where: { id: shareToken.id },
        data: { used: true },
      }),
    ]);

    return {
      id: access.id,
      relationshipName: rel?.name || '',
    };
  }

  /**
   * 查询分享给我的关系列表
   */
  async sharedWithMe(viewerId: number) {
    const accesses = await this.prisma.sharedAccess.findMany({
      where: { viewerId },
      orderBy: { createdAt: 'desc' },
    });

    if (accesses.length === 0) return [];

    // 批量查 owner 和 relationship
    const ownerIds = [...new Set(accesses.map((a) => a.ownerId))];
    const relIds = [...new Set(accesses.map((a) => a.relationshipId))];

    const [owners, rels] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: ownerIds } },
        select: { id: true, nickname: true, avatar: true },
      }),
      this.prisma.relationship.findMany({
        where: { id: { in: relIds } },
        include: {
          _count: { select: { events: true, memories: true } },
        },
      }),
    ]);

    const ownerMap = new Map(owners.map((o) => [o.id, o]));
    const relMap = new Map(rels.map((r) => [r.id, r]));

    return accesses.map((a) => ({
      id: a.id,
      permission: a.permission,
      acceptedAt: a.acceptedAt,
      owner: ownerMap.get(a.ownerId),
      relationship: relMap.get(a.relationshipId),
    }));
  }

  /**
   * 查询我分享给他人的列表
   */
  async sharedByMe(ownerId: number) {
    const accesses = await this.prisma.sharedAccess.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });

    if (accesses.length === 0) return [];

    const viewerIds = [...new Set(accesses.map((a) => a.viewerId))];
    const relIds = [...new Set(accesses.map((a) => a.relationshipId))];

    const [viewers, rels] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: viewerIds } },
        select: { id: true, nickname: true, avatar: true },
      }),
      this.prisma.relationship.findMany({
        where: { id: { in: relIds } },
        select: { id: true, name: true, type: true },
      }),
    ]);

    const viewerMap = new Map(viewers.map((v) => [v.id, v]));
    const relMap = new Map(rels.map((r) => [r.id, r]));

    return accesses.map((a) => ({
      id: a.id,
      permission: a.permission,
      acceptedAt: a.acceptedAt,
      viewer: viewerMap.get(a.viewerId),
      relationship: relMap.get(a.relationshipId),
    }));
  }

  /**
   * 移除共享访问
   */
  async removeAccess(ownerId: number, accessId: number) {
    const access = await this.prisma.sharedAccess.findUnique({
      where: { id: accessId },
    });
    if (!access) throw new NotFoundException('共享记录不存在');
    if (access.ownerId !== ownerId) throw new BadRequestException('无权删除');

    await this.prisma.sharedAccess.delete({ where: { id: accessId } });
    return { id: accessId, deleted: true };
  }

  /**
   * 退出共享（被分享者主动退出）
   */
  async leaveAccess(viewerId: number, accessId: number) {
    const access = await this.prisma.sharedAccess.findUnique({
      where: { id: accessId },
    });
    if (!access) throw new NotFoundException('共享记录不存在');
    if (access.viewerId !== viewerId) throw new BadRequestException('无权操作');

    await this.prisma.sharedAccess.delete({ where: { id: accessId } });
    return { id: accessId, deleted: true };
  }

  /**
   * 查询关系详情（含共享权限检查）
   */
  async getSharedRelationDetail(accessId: number, viewerId: number) {
    const access = await this.prisma.sharedAccess.findUnique({
      where: { id: accessId },
    });
    if (!access || access.viewerId !== viewerId) {
      throw new NotFoundException('无访问权限');
    }

    return this.prisma.relationship.findUnique({
      where: { id: access.relationshipId },
      include: {
        events: { orderBy: { eventDate: 'asc' } },
        memories: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }
}
