import { Module } from '@nestjs/common';
import { SpaceController } from './space.controller';
import { SpaceService } from './space.service';
import { UploadModule } from '../upload/upload.module';
import { ReminderModule } from '../reminder/reminder.module';

@Module({
  imports: [UploadModule, ReminderModule],
  controllers: [SpaceController],
  providers: [SpaceService],
  exports: [SpaceService],
})
export class SpaceModule {}
