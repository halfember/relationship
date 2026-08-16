import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ExportService } from './export.service';
import { CurrentUserId } from '../auth/current-user.decorator';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * GET /api/export/relationship/:id?userId=1
   * 导出单条关系的完整数据（供生成卡片用）
   */
  @Get('relationship/:id')
  async exportRelationship(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
  ) {
    const data = await this.exportService.exportRelationship(id, userId);
    return { code: 0, data, message: 'ok' };
  }

  /**
   * GET /api/export/all
   * 导出用户所有关系的简要汇总
   */
  @Get('all')
  async exportAll(@CurrentUserId() userId: number) {
    const data = await this.exportService.exportAll(userId);
    return { code: 0, data, message: 'ok' };
  }
}
