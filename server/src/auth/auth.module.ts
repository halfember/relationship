import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { RateLimitGuard } from '../common/rate-limit.guard';

@Module({
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
