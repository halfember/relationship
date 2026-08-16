import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/response.interceptor';
import { AllExceptionFilter } from './common/all-exception.filter';
import { LoggerMiddleware } from './common/logger.middleware';
import { enableGracefulShutdown } from './common/graceful-shutdown';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().set('trust proxy', 'loopback');

  // 全局前缀
  app.setGlobalPrefix('api');

  // CORS：未配置时保持开发环境兼容；生产环境应显式设置允许的来源。
  const corsOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors(corsOrigins.length > 0 ? { origin: corsOrigins } : undefined);

  // 全局请求日志中间件
  const loggerMiddleware = new LoggerMiddleware();
  app.use(loggerMiddleware.use.bind(loggerMiddleware));

  // 全局数据验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 全局响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 全局异常过滤器
  app.useGlobalFilters(new AllExceptionFilter());

  // 优雅关闭
  enableGracefulShutdown(app);

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`✅ 与你AI服务已启动：http://localhost:${port}`);
  console.log(`   环境：${process.env.NODE_ENV || 'development'}`);
  console.log(`   健康检查：http://localhost:${port}/api/health`);
}

bootstrap();
