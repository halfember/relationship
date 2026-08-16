import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, RateLimitOptions } from './rate-limit.decorator';

type Bucket = { count: number; resetsAt: number };

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();
  private lastSweep = 0;

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!options) return true;

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const identity = request.userId ? `user:${request.userId}` : `ip:${request.ip || 'unknown'}`;
    const route = `${context.getClass().name}.${context.getHandler().name}`;
    const key = `${route}:${identity}`;
    const now = Date.now();
    this.sweepExpired(now);

    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetsAt <= now) {
      bucket = { count: 0, resetsAt: now + options.windowMs };
      this.buckets.set(key, bucket);
    }
    bucket.count += 1;
    response?.setHeader?.('X-RateLimit-Limit', String(options.limit));
    response?.setHeader?.('X-RateLimit-Remaining', String(Math.max(0, options.limit - bucket.count)));
    response?.setHeader?.('X-RateLimit-Reset', String(Math.ceil(bucket.resetsAt / 1000)));
    if (bucket.count > options.limit) {
      throw new HttpException('请求过于频繁，请稍后再试', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }

  private sweepExpired(now: number) {
    if (this.buckets.size < 10_000 && now - this.lastSweep < 60_000) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetsAt <= now) this.buckets.delete(key);
    }
    this.lastSweep = now;
  }
}
