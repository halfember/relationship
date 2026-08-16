import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '与你AI V1.4 API 服务运行中';
  }
}
