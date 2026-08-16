import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { MemoryService } from './memory.service';
import { CreateMemoryDto } from './dto/create-memory.dto';
import { UpdateMemoryDto } from './dto/update-memory.dto';
import { CurrentUserId } from '../auth/current-user.decorator';

@Controller('memory')
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  /**
   * POST /api/memory/create
   * 添加回忆
   */
  @Post('create')
  async create(@Body() dto: CreateMemoryDto, @CurrentUserId() userId: number) {
    const memory = await this.memoryService.create(dto, userId);
    return { code: 0, data: memory, message: '添加成功' };
  }

  /**
   * GET /api/memory/list?relationshipId=1
   * 查询关系下的所有回忆
   */
  @Get('list')
  async list(@Query('relationshipId', ParseIntPipe) relationshipId: number, @CurrentUserId() userId: number) {
    const list = await this.memoryService.findByRelationshipId(relationshipId, userId);
    return { code: 0, data: list, message: 'ok' };
  }

  @Get('all')
  async all(@CurrentUserId() userId: number) {
    const data = await this.memoryService.findAllForUser(userId);
    return { code: 0, data, message: 'ok' };
  }

  /**
   * GET /api/memory/:id
   * 查询单个记忆
   */
  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number, @CurrentUserId() userId: number) {
    const memory = await this.memoryService.findById(id, userId);
    return { code: 0, data: memory, message: 'ok' };
  }

  /**
   * PUT /api/memory/:id
   * 更新回忆
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemoryDto,
    @CurrentUserId() userId: number,
  ) {
    const memory = await this.memoryService.update(id, dto, userId);
    return { code: 0, data: memory, message: '更新成功' };
  }

  /**
   * DELETE /api/memory/:id
   * 删除回忆
   */
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUserId() userId: number) {
    const result = await this.memoryService.delete(id, userId);
    return { code: 0, data: result, message: '删除成功' };
  }
}
