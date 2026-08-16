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
  DefaultValuePipe,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CurrentUserId } from '../auth/current-user.decorator';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  /** 日历事实来源：直接按事件计算未来发生日，不依赖提醒投递记录。 */
  @Get('upcoming')
  async upcoming(
    @Query('days', new DefaultValuePipe(90), ParseIntPipe) days: number,
    @CurrentUserId() userId: number,
  ) {
    const data = await this.eventService.findUpcomingForUser(userId, days);
    return { code: 0, data, message: 'ok' };
  }

  /**
   * POST /api/event/create
   * 添加纪念日
   */
  @Post('create')
  async create(@Body() dto: CreateEventDto, @CurrentUserId() userId: number) {
    const event = await this.eventService.create(dto, userId);
    return { code: 0, data: event, message: '添加成功' };
  }

  /**
   * GET /api/event/list?relationshipId=1
   * 查询关系下的所有事件
   */
  @Get('list')
  async list(@Query('relationshipId', ParseIntPipe) relationshipId: number, @CurrentUserId() userId: number) {
    const list = await this.eventService.findByRelationshipId(relationshipId, userId);
    return { code: 0, data: list, message: 'ok' };
  }

  @Get('all')
  async all(@CurrentUserId() userId: number) {
    const data = await this.eventService.findAllForUser(userId);
    return { code: 0, data, message: 'ok' };
  }

  /**
   * GET /api/event/:id
   * 查询单个事件
   */
  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number, @CurrentUserId() userId: number) {
    const event = await this.eventService.findById(id, userId);
    return { code: 0, data: event, message: 'ok' };
  }

  /**
   * PUT /api/event/:id
   * 更新事件
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @CurrentUserId() userId: number,
  ) {
    const event = await this.eventService.update(id, dto, userId);
    return { code: 0, data: event, message: '更新成功' };
  }

  /**
   * DELETE /api/event/:id
   * 删除事件
   */
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUserId() userId: number) {
    const result = await this.eventService.delete(id, userId);
    return { code: 0, data: result, message: '删除成功' };
  }
}
