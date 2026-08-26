import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ContentSafetyService } from './content-safety.service';

@Injectable()
export class ContentSafetyInterceptor implements NestInterceptor {
  constructor(private readonly contentSafety: ContentSafetyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(String(request.method).toUpperCase())) {
      this.contentSafety.assertBodyAllowed(request.body);
    }
    return next.handle();
  }
}
