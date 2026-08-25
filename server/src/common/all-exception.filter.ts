import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

/**
 * 全局异常过滤器
 * 统一返回格式: { code, data, message }
 * 开发环境下打印详细堆栈
 */
@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let errorCode: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as any;
        message = resObj.message || exception.message;
        if (typeof resObj.errorCode === 'string') errorCode = resObj.errorCode;
        if (Array.isArray(message)) {
          message = message[0];
        }
        // Prisma 已知错误提取友好消息
        if (resObj.error === 'PrismaClientKnownRequestError') {
          message = '数据库操作异常，请稍后重试';
        }
      }
    } else if (exception instanceof Error && process.env.NODE_ENV !== 'production') {
      message = exception.message;
    }

    // 开发环境打印完整错误
    if (process.env.NODE_ENV !== 'production') {
      this.logger.error(
        `❌ ${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : '',
      );
    } else {
      const errorType = exception instanceof Error ? exception.name : 'UnknownError';
      const safePath = String(request.url || '').split('?')[0]
        .replace(/\/(contact|spaces)\/invites\/[^/]+/g, '/$1/invites/[redacted]')
        .replace(/\/upload\/image\/[^/]+/g, '/upload/image/[redacted]');
      this.logger.error(`❌ ${request.method} ${safePath} → ${status}: ${errorType}`);
    }

    response.status(status).json({
      code: status,
      data: null,
      message,
      ...(errorCode ? { errorCode } : {}),
    });
  }
}
