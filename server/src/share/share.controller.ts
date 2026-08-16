import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ShareService } from './share.service';
import { CurrentUserId } from '../auth/current-user.decorator';

@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  /**
   * POST /api/share/invite
   * 生成分享邀请码
   */
  @Post('invite')
  async invite(@Body('userId', ParseIntPipe) _userId: number, @Body('relationshipId', ParseIntPipe) relationshipId: number, @CurrentUserId() userId: number) {
    const data = await this.shareService.generateInvite(userId, relationshipId);
    return { code: 0, data, message: '分享码已生成' };
  }

  /**
   * POST /api/share/accept
   * 接受邀请
   */
  @Post('accept')
  async accept(@Body('userId', ParseIntPipe) _userId: number, @Body('token') token: string, @CurrentUserId() userId: number) {
    const data = await this.shareService.acceptInvite(userId, token);
    return { code: 0, data, message: '已接受共享' };
  }

  /**
   * GET /api/share/shared-with-me?userId=1
   * 分享给我的
   */
  @Get('shared-with-me')
  async sharedWithMe(@Query('userId', ParseIntPipe) _userId: number, @CurrentUserId() userId: number) {
    const data = await this.shareService.sharedWithMe(userId);
    return { code: 0, data };
  }

  /**
   * GET /api/share/shared-by-me?userId=1
   * 我分享的
   */
  @Get('shared-by-me')
  async sharedByMe(@Query('userId', ParseIntPipe) _userId: number, @CurrentUserId() userId: number) {
    const data = await this.shareService.sharedByMe(userId);
    return { code: 0, data };
  }

  /**
   * DELETE /api/share/:id/remove
   * 移除共享（分享者）
   */
  @Delete(':id/remove')
  async remove(@Param('id', ParseIntPipe) id: number, @Body('userId', ParseIntPipe) _userId: number, @CurrentUserId() userId: number) {
    const data = await this.shareService.removeAccess(userId, id);
    return { code: 0, data, message: '已移除共享' };
  }

  /**
   * DELETE /api/share/:id/leave
   * 退出共享（被分享者）
   */
  @Delete(':id/leave')
  async leave(@Param('id', ParseIntPipe) id: number, @Body('userId', ParseIntPipe) _userId: number, @CurrentUserId() userId: number) {
    const data = await this.shareService.leaveAccess(userId, id);
    return { code: 0, data, message: '已退出共享' };
  }

  /**
   * GET /api/share/:id/detail
   * 查看共享关系详情
   */
  @Get(':id/detail')
  async detail(@Param('id', ParseIntPipe) id: number, @Query('userId', ParseIntPipe) _userId: number, @CurrentUserId() userId: number) {
    const data = await this.shareService.getSharedRelationDetail(id, userId);
    return { code: 0, data };
  }
}
