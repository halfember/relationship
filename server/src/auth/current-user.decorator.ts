import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number => {
    const request = context.switchToHttp().getRequest<{ userId: number }>();
    return request.userId;
  },
);
