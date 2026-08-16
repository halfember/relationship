import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadStorageService } from './upload-storage';

@Module({ controllers: [UploadController], providers: [UploadStorageService], exports: [UploadStorageService] })
export class UploadModule {}
