import { INestApplication, Logger } from '@nestjs/common';

/**
 * 优雅关闭处理
 * 捕获 SIGTERM / SIGINT，关闭前清理资源
 */
export function enableGracefulShutdown(app: INestApplication): void {
  const logger = new Logger('Shutdown');
  const signals = ['SIGTERM', 'SIGINT'];

  for (const signal of signals) {
    process.on(signal, async () => {
      logger.log(`收到 ${signal} 信号，开始优雅关闭...`);

      // 停止接受新请求
      await app.close();
      logger.log('HTTP 服务已关闭');

      // 给异步任务 3 秒缓冲
      setTimeout(() => {
        logger.log('进程退出');
        process.exit(0);
      }, 3000);
    });
  }

  // 未捕获的异常
  process.on('uncaughtException', (err) => {
    logger.error('未捕获异常:', err.stack);
    setTimeout(() => process.exit(1), 1000);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('未处理的 Promise 拒绝:', reason);
  });
}
