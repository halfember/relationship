import { Controller, Get, Res } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import * as os from 'os';
import { Public } from './auth/public.decorator';
import { Response } from 'express';

/**
 * 健康检查 + 运行状态
 */
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  rootInfo() {
    return {
      service: '与你AI V1.4',
      docs: '/api/health',
      env: process.env.NODE_ENV || 'development',
      time: new Date().toISOString(),
    };
  }

  @Get('health')
  @Public()
  async healthCheck(@Res({ passthrough: true }) response: Response) {
    let dbStatus = 'unknown';
    let dbLatency = 0;

    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
      dbStatus = 'ok';
    } catch {
      dbStatus = 'error';
      response.status(503);
    }

    const uptime = Math.floor(process.uptime());
    const memUsage = process.memoryUsage();

    return {
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
      version: '1.4.3',
      node: process.version,
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatency,
        },
        memory: {
          rssMB: Math.round(memUsage.rss / 1024 / 1024),
          heapMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        },
        cpu: {
          cores: os.cpus().length,
          loadAvg: os.loadavg().map((v) => +v.toFixed(2)),
        },
      },
    };
  }
}
