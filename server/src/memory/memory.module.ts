import { Module } from '@nestjs/common';
import { MemoryController } from './memory.controller';
import { MemoryService } from './memory.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [MemoryController],
  providers: [MemoryService],
  exports: [MemoryService],
})
export class MemoryModule {}
