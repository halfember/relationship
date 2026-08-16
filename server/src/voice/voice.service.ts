import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 语音识别服务
 * 使用 OpenAI Whisper API（兼容多家大模型）
 */
@Injectable()
export class VoiceService {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly prisma: PrismaService) {
    this.apiUrl = process.env.AI_API_URL || 'https://api.openai.com/v1';
    this.apiKey = process.env.AI_API_KEY || '';
  }

  /** 语音转文字 */
  async transcribe(audioFile: Express.Multer.File, userId: number): Promise<{ text: string }> {
    const text = await this.callWhisper(audioFile);

    // 记录调用
    await this.prisma.aiRecord.create({
        data: {
          userId,
          type: 'voice_transcribe',
          prompt: `音频文件: ${audioFile.originalname} (${(audioFile.size / 1024).toFixed(1)}KB)`,
          result: text,
        },
    });

    return { text };
  }

  /** 调用 Whisper API */
  private async callWhisper(audioFile: Express.Multer.File): Promise<string> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('语音识别服务未配置');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      // 使用 fetch + FormData 发送给 Whisper API
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(audioFile.buffer)], { type: audioFile.mimetype || 'audio/mp3' });
      formData.append('file', blob, audioFile.originalname || 'recording.mp3');
      formData.append('model', 'whisper-1');
      formData.append('language', 'zh');

      const response = await fetch(`${this.apiUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null) as { text?: string; error?: unknown } | null;
      if (!response.ok || data?.error) throw new BadGatewayException('语音识别上游服务异常');
      const text = data?.text?.trim();
      if (!text) throw new BadGatewayException('语音识别未返回有效内容');
      return text;
    } catch (error: any) {
      if (error instanceof BadGatewayException) throw error;
      if (error?.name === 'AbortError') throw new GatewayTimeoutException('语音识别请求超时');
      console.error('语音识别调用失败:', error);
      throw new BadGatewayException('语音识别服务暂不可用');
    } finally {
      clearTimeout(timeout);
    }
  }
}
