import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 全局响应拦截器
 * 统一封装返回格式: { code, data, message }
 * 并确保所有成功响应统一返回 HTTP 200
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        if (response && typeof response.status === 'function' && response.statusCode < 400) {
          response.status(200);
        }
        // 已经是标准格式则直接返回
        if (data && typeof data === 'object' && 'code' in data) {
          return data;
        }
        return {
          code: 0,
          data,
          message: 'ok',
        };
      }),
    );
  }
}
