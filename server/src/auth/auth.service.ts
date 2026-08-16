import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

type AccessTokenPayload = { sub: number; exp: number };

@Injectable()
export class AuthService {
  private readonly secret: string;

  constructor() {
    const configuredSecret = process.env.AUTH_SECRET || '';
    if (process.env.NODE_ENV === 'production' && configuredSecret.length < 32) {
      throw new Error('AUTH_SECRET must contain at least 32 characters in production');
    }
    this.secret = configuredSecret || 'development-only-auth-secret-change-me';
  }

  issueAccessToken(userId: number): string {
    const payload: AccessTokenPayload = {
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${encoded}.${this.sign(encoded)}`;
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const [encoded, signature, extra] = token.split('.');
    if (!encoded || !signature || extra) {
      throw new UnauthorizedException('登录状态无效，请重新登录');
    }
    const expected = Buffer.from(this.sign(encoded));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      throw new UnauthorizedException('登录状态无效，请重新登录');
    }
    try {
      const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as AccessTokenPayload;
      if (!Number.isInteger(payload.sub) || payload.sub <= 0 || payload.exp <= Date.now() / 1000) {
        throw new Error('invalid token payload');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
  }

  private sign(value: string): string {
    return createHmac('sha256', this.secret).update(value).digest('base64url');
  }
}
