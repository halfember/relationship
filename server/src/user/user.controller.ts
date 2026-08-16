import { Controller, Post, Get, Put, Delete, Body, Param, ParseIntPipe, HttpCode } from '@nestjs/common';
import { UserService } from './user.service';
import { WechatService } from '../wechat/wechat.service';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from '../auth/auth.service';
import { CurrentUserId } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { RateLimit } from '../common/rate-limit.decorator';
import { DesktopLoginDto } from './dto/desktop-login.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly wechatService: WechatService,
    private readonly authService: AuthService,
  ) {}

  /**
   * POST /api/user/login
   * 微信 code 换取 openid，自动登录/注册
   */
  @Post('login')
  @Public()
  @RateLimit(10)
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const { openid } = await this.wechatService.code2Session(dto.code);
    const user = await this.userService.login(openid, dto.nickname, dto.avatar);
    return {
      code: 0,
      data: { ...user, accessToken: this.authService.issueAccessToken(user.id) },
      message: '登录成功',
    };
  }

  @Post('desktop-code')
  @RateLimit(6)
  async desktopCode(@CurrentUserId() userId: number) {
    const data = await this.userService.createDesktopLoginCode(userId);
    return { code: 0, data, message: '连接码已生成' };
  }

  @Post('desktop-login')
  @Public()
  @RateLimit(10)
  @HttpCode(200)
  async desktopLogin(@Body() dto: DesktopLoginDto) {
    const user = await this.userService.consumeDesktopLoginCode(dto.code);
    return {
      code: 0,
      data: { ...user, accessToken: this.authService.issueAccessToken(user.id) },
      message: '连接成功',
    };
  }

  /**
   * GET /api/user/:id
   * 获取用户详情
   */
  @Get(':id')
  async profile(@Param('id', ParseIntPipe) _id: number, @CurrentUserId() userId: number) {
    const user = await this.userService.findById(userId);
    return { code: 0, data: user, message: 'ok' };
  }

  /**
   * PUT /api/user/:id
   * 更新用户信息
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) _id: number,
    @CurrentUserId() userId: number,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.userService.update(userId, dto);
    return { code: 0, data: user, message: '更新成功' };
  }

  /**
   * GET /api/user/:id/stats
   * 获取用户统计信息
   */
  @Get(':id/stats')
  async stats(@Param('id', ParseIntPipe) _id: number, @CurrentUserId() userId: number) {
    const stats = await this.userService.getStats(userId);
    return { code: 0, data: stats, message: 'ok' };
  }

  @Delete('me/account')
  async deleteAccount(@CurrentUserId() userId: number) {
    await this.userService.deleteAccount(userId);
    return { code: 0, data: null, message: '账号已注销' };
  }
}
