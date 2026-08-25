import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadStorageService } from '../upload/upload-storage';
import { createHash, randomInt } from 'crypto';

const DESKTOP_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly storage?: UploadStorageService,
  ) {}

  /** 通过 openid 查找用户 */
  async findByOpenid(openid: string) {
    return this.prisma.user.findUnique({ where: { openid } });
  }

  /** 通过 ID 查找用户 */
  async findById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  /** 创建用户 */
  async create(openid: string, nickname?: string, avatar?: string) {
    return this.prisma.user.create({
      data: { openid, nickname, avatar },
    });
  }

  /** 登录：查不到则自动注册 */
  async login(openid: string, nickname?: string, avatar?: string) {
    let user = await this.findByOpenid(openid);

    if (user) {
      // 更新登录信息
      if (nickname || avatar) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            ...(nickname && { nickname }),
            ...(avatar && { avatar }),
          },
        });
      }
    } else {
      // 新用户注册
      user = await this.create(openid, nickname, avatar);
    }

    return user;
  }

  /** 更新用户信息 */
  async update(id: number, data: { nickname?: string; avatar?: string }) {
    const user = await this.findById(id);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data,
    });
    if (data.avatar !== undefined && data.avatar !== user.avatar) {
      await this.storage?.deleteByUrl(user.avatar);
    }
    return updated;
  }

  /** 获取用户统计信息 */
  async getStats(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { relationships: true },
        },
      },
    });

    if (!user) throw new NotFoundException('用户不存在');

    return {
      userId: user.id,
      nickname: user.nickname,
      vipLevel: user.vipLevel,
      relationshipCount: user._count.relationships,
    };
  }

  async createDesktopLoginCode(userId: number) {
    await this.findById(userId);
    await this.prisma.desktopLoginCode.deleteMany({ where: { userId } });
    const code = Array.from({ length: 8 }, () => DESKTOP_CODE_CHARS[randomInt(DESKTOP_CODE_CHARS.length)]).join('');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await this.prisma.desktopLoginCode.create({
      data: { userId, codeHash: this.hashDesktopCode(code), expiresAt },
    });
    return { code, expiresAt };
  }

  async consumeDesktopLoginCode(rawCode: string) {
    const codeHash = this.hashDesktopCode(rawCode.trim().toUpperCase());
    const record = await this.prisma.desktopLoginCode.findUnique({ where: { codeHash } });
    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      throw new BadRequestException('连接码无效或已过期');
    }
    const claimed = await this.prisma.desktopLoginCode.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) throw new BadRequestException('连接码已被使用');
    return this.findById(record.userId);
  }

  private hashDesktopCode(code: string) {
    return createHash('sha256').update(code).digest('hex');
  }

  async deleteAccount(userId: number) {
    const user = await this.findById(userId);
    const ownedSpaces = await this.prisma.sharedSpace.count({
      where: { createdById: userId, status: { in: ['ACTIVE', 'PENDING'] } },
    });
    if (ownedSpaces > 0) {
      throw new BadRequestException({
        message: '请先解散你创建的共同空间，再注销账号',
        errorCode: 'ACCOUNT_HAS_OWNED_SPACES',
      });
    }
    const activePairMemberships = await this.prisma.spaceMember.count({
      where: {
        userId,
        status: 'ACTIVE',
        space: { type: 'PAIR', status: { in: ['ACTIVE', 'PENDING'] } },
      },
    });
    if (activePairMemberships > 0) {
      throw new BadRequestException({
        message: '请先退出双人共同空间，再注销账号',
        errorCode: 'ACCOUNT_HAS_ACTIVE_PAIR_SPACE',
      });
    }
    const [authoredSharedEvents, archivedOwnedSpaces, relationships, authoredSharedMemories] = await Promise.all([
      this.prisma.sharedEvent.findMany({ where: { createdById: userId }, select: { id: true } }),
      this.prisma.sharedSpace.findMany({
        where: { createdById: userId, status: 'ARCHIVED' },
        select: { id: true, memories: { select: { imageUrl: true } } },
      }),
      this.prisma.relationship.findMany({
        where: { userId },
        select: { avatar: true, memories: { select: { imageUrl: true } } },
      }),
      this.prisma.sharedMemory.findMany({ where: { createdById: userId }, select: { imageUrl: true } }),
    ]);
    const fileUrls = [
      user.avatar,
      ...relationships.flatMap((relationship) => [
        relationship.avatar,
        ...relationship.memories.map((memory) => memory.imageUrl),
      ]),
      ...authoredSharedMemories.map((memory) => memory.imageUrl),
      ...archivedOwnedSpaces.flatMap((space) => space.memories.map((memory) => memory.imageUrl)),
    ];
    await this.prisma.$transaction([
      this.prisma.reminder.deleteMany({
        where: {
          OR: [
            { userId },
            { sharedEventId: { in: authoredSharedEvents.map((event) => event.id) } },
            { sharedSpaceId: { in: archivedOwnedSpaces.map((space) => space.id) } },
          ],
        },
      }),
      this.prisma.sharedSpace.deleteMany({ where: { createdById: userId, status: 'ARCHIVED' } }),
      this.prisma.sharedEvent.deleteMany({ where: { createdById: userId } }),
      this.prisma.sharedMemory.deleteMany({ where: { createdById: userId } }),
      this.prisma.contactConnection.deleteMany({
        where: { OR: [{ userAId: userId }, { userBId: userId }, { createdById: userId }] },
      }),
      this.prisma.contactInvite.deleteMany({
        where: { OR: [{ inviterId: userId }, { acceptedById: userId }] },
      }),
      this.prisma.spaceInvite.deleteMany({
        where: { OR: [{ inviterId: userId }, { acceptedById: userId }] },
      }),
      this.prisma.spaceMember.deleteMany({ where: { userId } }),
      this.prisma.sharedAccess.deleteMany({ where: { OR: [{ ownerId: userId }, { viewerId: userId }] } }),
      this.prisma.shareToken.deleteMany({ where: { userId } }),
      this.prisma.aiRecord.deleteMany({ where: { userId } }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);
    await this.storage?.deleteManyByUrls(fileUrls);
  }
}
