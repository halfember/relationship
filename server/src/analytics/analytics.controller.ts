import { Body, Controller, Get, Post, Query, ParseIntPipe } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CurrentUserId } from '../auth/current-user.decorator';
import { TrackEventDto } from './dto/track-event.dto';
import { RateLimit } from '../common/rate-limit.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  @RateLimit(120)
  async track(@Body() dto: TrackEventDto, @CurrentUserId() userId: number) {
    const data = await this.analyticsService.trackEvent(userId, dto);
    return { code: 0, data, message: 'ok' };
  }

  /**
   * GET /api/analytics/dashboard?userId=1
   * 数据总览（含关系图谱）
   */
  @Get('dashboard')
  async dashboard(@Query('userId', ParseIntPipe) _userId: number, @CurrentUserId() userId: number) {
    const data = await this.analyticsService.getDashboard(userId);
    return { code: 0, data, message: 'ok' };
  }

  /**
   * GET /api/analytics/activity?userId=1
   * 月度活跃数据
   */
  @Get('activity')
  async activity(@Query('userId', ParseIntPipe) _userId: number, @CurrentUserId() userId: number) {
    const data = await this.analyticsService.getMonthlyActivity(userId);
    return { code: 0, data, message: 'ok' };
  }
}
