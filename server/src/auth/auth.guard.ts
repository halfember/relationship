import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;
    const request = context.switchToHttp().getRequest();
    const [scheme, token] = String(request.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('请先登录');
    const payload = this.authService.verifyAccessToken(token);
    request.userId = payload.sub;
    const claimedUserId = request.body?.userId ?? request.query?.userId ?? request.headers['x-user-id'];
    if (claimedUserId !== undefined && String(claimedUserId) !== String(payload.sub)) {
      throw new ForbiddenException('无权以其他用户身份操作');
    }
    return true;
  }
}
