import { Module } from '@nestjs/common';
import { RelationshipController } from './relationship.controller';
import { RelationshipService } from './relationship.service';
import { UploadModule } from '../upload/upload.module';
import { ReminderModule } from '../reminder/reminder.module';

@Module({
  imports: [UploadModule, ReminderModule],
  controllers: [RelationshipController],
  providers: [RelationshipService],
  exports: [RelationshipService],
})
export class RelationshipModule {}
