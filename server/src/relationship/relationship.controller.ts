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
import { RelationshipService } from './relationship.service';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { UpdateRelationshipDto } from './dto/update-relationship.dto';
import { CurrentUserId } from '../auth/current-user.decorator';

@Controller('relationship')
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  /**
   * POST /api/relationship/create
   * 添加关系
   */
  @Post('create')
  async create(@Body() dto: CreateRelationshipDto, @CurrentUserId() userId: number) {
    const relationship = await this.relationshipService.create(dto, userId);
    return { code: 0, data: relationship, message: '添加成功' };
  }

  /**
   * GET /api/relationship/list?userId=1
   * 查询用户的所有关系
   */
  @Get('list')
  async list(@Query('userId', ParseIntPipe) _userId: number, @CurrentUserId() userId: number) {
    const list = await this.relationshipService.findByUserId(userId);
    return { code: 0, data: list, message: 'ok' };
  }

  /**
   * GET /api/relationship/:id
   * 查询单个关系详情
   */
  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number, @CurrentUserId() userId: number) {
    const detail = await this.relationshipService.findById(id, userId);
    return { code: 0, data: detail, message: 'ok' };
  }

  /**
   * PUT /api/relationship/:id
   * 更新关系
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRelationshipDto,
    @CurrentUserId() userId: number,
  ) {
    const relationship = await this.relationshipService.update(id, dto, userId);
    return { code: 0, data: relationship, message: '更新成功' };
  }

  /**
   * DELETE /api/relationship/:id
   * 删除关系
   */
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUserId() userId: number) {
    const result = await this.relationshipService.delete(id, userId);
    return { code: 0, data: result, message: '删除成功' };
  }
}
