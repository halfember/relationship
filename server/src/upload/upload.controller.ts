import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { Public } from '../auth/public.decorator';
import { IMAGE_TYPES, UploadStorageService } from './upload-storage';
import { RateLimit } from '../common/rate-limit.decorator';

@Controller('upload')
export class UploadController {
  constructor(private readonly storage: UploadStorageService) {}

  @Post('image')
  @RateLimit(20)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file || !IMAGE_TYPES[file.mimetype]) {
      throw new BadRequestException('仅支持 5MB 以内的 JPG、PNG 或 WebP 图片');
    }
    const filename = await this.storage.saveImage(file.buffer, file.mimetype);
    const baseUrl = String(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
    return { url: `${baseUrl}/api/upload/image/${filename}` };
  }

  @Get('image/:filename')
  @Public()
  @RateLimit(240)
  async getImage(@Param('filename') filename: string, @Res() response: Response) {
    const imagePath = this.storage.imagePath(filename);
    if (!imagePath) throw new NotFoundException('图片不存在');
    response.setHeader('Cache-Control', 'private, max-age=3600');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.sendFile(imagePath, (error) => {
      if (error && !response.headersSent) response.status(404).json({ code: 404, data: null, message: '图片不存在' });
    });
  }
}
