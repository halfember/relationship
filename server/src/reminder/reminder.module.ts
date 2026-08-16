import { Module } from '@nestjs/common';
import { ReminderController } from './reminder.controller';
import { ReminderService } from './reminder.service';
import { WechatModule } from '../wechat/wechat.module';

@Module({
  imports: [WechatModule],
  controllers: [ReminderController],
  providers: [ReminderService],
  exports: [ReminderService],
})
export class ReminderModule {}
