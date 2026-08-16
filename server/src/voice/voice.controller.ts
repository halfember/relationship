import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { VoiceService } from './voice.service';
import { CurrentUserId } from '../auth/current-user.decorator';
import { RateLimit } from '../common/rate-limit.decorator';

const AUDIO_TYPES = new Set(['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/webm', 'audio/ogg']);

@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  /**
   * POST /api/voice/transcribe
   * 语音转文字
   */
  @Post('transcribe')
  @RateLimit(10)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async transcribe(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUserId() userId: number,
  ) {
    if (!file?.buffer?.length) throw new BadRequestException('未上传音频文件');
    if (!AUDIO_TYPES.has(file.mimetype)) throw new BadRequestException('不支持的音频格式');

    const result = await this.voiceService.transcribe(file, userId);
    return { code: 0, data: result, message: '识别成功' };
  }
}
