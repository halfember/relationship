import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { ReminderModule } from '../reminder/reminder.module';

@Module({
  imports: [ReminderModule],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
