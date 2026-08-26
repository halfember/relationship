import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ContentSafetyModule } from '../content-safety/content-safety.module';

@Module({
  imports: [ContentSafetyModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
