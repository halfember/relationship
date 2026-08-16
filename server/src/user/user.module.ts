import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { WechatModule } from '../wechat/wechat.module';
import { AuthModule } from '../auth/auth.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [WechatModule, AuthModule, UploadModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
