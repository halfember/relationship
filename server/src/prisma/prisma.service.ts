import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Prisma 数据库连接成功');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
