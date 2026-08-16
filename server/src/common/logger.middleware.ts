import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * 请求日志中间件
 * 记录每个请求的方法、路径、耗时和状态码
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use = (req: Request, res: Response, next: NextFunction) => {
    const { method } = req;
    const safePath = this.safePath(req.originalUrl);
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const elapsed = Date.now() - start;
      const emoji = statusCode < 400 ? '✅' : '❌';

      this.logger.log(
        `${emoji} ${method} ${safePath} → ${statusCode} (${elapsed}ms)`,
      );

      // 耗时超过 1 秒的请求告警
      if (elapsed > 1000) {
        this.logger.warn(`⚠️ 慢查询: ${method} ${safePath} → ${elapsed}ms`);
      }
    });

    next();
  }

  private safePath(originalUrl: string) {
    return String(originalUrl || '').split('?')[0]
      .replace(/\/(contact|spaces)\/invites\/[^/]+/g, '/$1/invites/[redacted]')
      .replace(/\/upload\/image\/[^/]+/g, '/upload/image/[redacted]');
  }
}
