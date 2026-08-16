import { Controller, Post, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { ReminderQueryDto } from './dto/reminder-query.dto';
import { CurrentUserId } from '../auth/current-user.decorator';

@Controller('reminder')
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  /**
   * GET /api/reminder/upcoming?userId=1&days=7
   * 获取未来 N 天的提醒
   */
  @Get('upcoming')
  async upcoming(@Query() query: ReminderQueryDto, @CurrentUserId() userId: number) {
    const data = await this.reminderService.getUpcoming(userId, query.days);
    return { code: 0, data, message: 'ok' };
  }

  /**
   * GET /api/reminder/today?userId=1
   * 获取今日提醒
   */
  @Get('today')
  async today(@Query('userId', ParseIntPipe) _userId: number, @CurrentUserId() userId: number) {
    const data = await this.reminderService.getToday(userId);
    return { code: 0, data, message: 'ok' };
  }

  /**
   * POST /api/reminder/generate
   * 手动触发提醒生成（开发/调试用）
   */
  @Post('generate')
  async generate(@CurrentUserId() userId: number) {
    await this.reminderService.generateUpcoming(userId);
    return { code: 0, data: null, message: '提醒已生成' };
  }

  /** 用户确认已处理；微信送达状态只能由服务端发送任务更新。 */
  @Post(':id/acknowledge')
  async acknowledge(@Param('id', ParseIntPipe) id: number, @CurrentUserId() userId: number) {
    await this.reminderService.acknowledge(id, userId);
    return { code: 0, data: null, message: 'ok' };
  }
}
