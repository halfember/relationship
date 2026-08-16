import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemoryDto } from './dto/create-memory.dto';
import { UpdateMemoryDto } from './dto/update-memory.dto';
import { UploadStorageService } from '../upload/upload-storage';

@Injectable()
export class MemoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: UploadStorageService,
  ) {}

  /** 创建记忆 */
  async create(dto: CreateMemoryDto, userId?: number) {
    if (userId !== undefined) await this.assertRelationshipOwner(dto.relationshipId, userId);
    return this.prisma.memory.create({
      data: {
        relationshipId: dto.relationshipId,
        imageUrl: dto.imageUrl,
        content: dto.content,
        memoryDate: dto.memoryDate ? new Date(dto.memoryDate) : undefined,
      },
    });
  }

  /** 查询关系下的所有记忆 */
  async findByRelationshipId(relationshipId: number, userId?: number) {
    if (userId !== undefined) await this.assertRelationshipOwner(relationshipId, userId);
    return this.prisma.memory.findMany({
      where: { relationshipId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForUser(userId: number) {
    return this.prisma.memory.findMany({
      where: { relationship: { userId } },
      include: { relationship: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }).then((items) => items.map(({ relationship, ...memory }) => ({
      ...memory,
      relationshipName: relationship.name,
    })));
  }

  /** 查询单个记忆 */
  async findById(id: number, userId?: number) {
    const memory = await this.prisma.memory.findFirst({
      where: { id, ...(userId !== undefined ? { relationship: { userId } } : {}) },
    });
    if (!memory) throw new NotFoundException('记忆不存在');
    return memory;
  }

  /** 更新记忆 */
  async update(id: number, dto: UpdateMemoryDto, userId?: number) {
    const previous = await this.findById(id, userId);
    const memory = await this.prisma.memory.update({
      where: { id },
      data: {
        ...dto,
        memoryDate: dto.memoryDate ? new Date(dto.memoryDate) : undefined,
      },
    });
    if (dto.imageUrl !== undefined && dto.imageUrl !== previous.imageUrl) {
      await this.storage.deleteByUrl(previous.imageUrl);
    }
    return memory;
  }

  /** 删除记忆 */
  async delete(id: number, userId?: number) {
    const memory = await this.findById(id, userId);
    await this.prisma.memory.delete({ where: { id } });
    await this.storage.deleteByUrl(memory.imageUrl);
    return { id, deleted: true };
  }

  private async assertRelationshipOwner(relationshipId: number, userId: number) {
    const relationship = await this.prisma.relationship.findFirst({ where: { id: relationshipId, userId } });
    if (!relationship) throw new NotFoundException('关系不存在');
  }
}
