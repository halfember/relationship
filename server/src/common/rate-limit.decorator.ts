import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';
export type RateLimitOptions = { limit: number; windowMs: number };

export const RateLimit = (limit: number, windowMs = 60_000) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, windowMs } satisfies RateLimitOptions);
