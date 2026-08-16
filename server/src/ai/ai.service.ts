import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * AI 大模型对接服务
 * 兼容 OpenAI / 百度文心 / 阿里通义 等 API
 */
@Injectable()
export class AiService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(private readonly prisma: PrismaService) {
    this.apiUrl = process.env.AI_API_URL || 'https://api.openai.com/v1';
    this.apiKey = process.env.AI_API_KEY || '';
    this.model = process.env.AI_MODEL || 'gpt-3.5-turbo';
    const configuredTimeout = Number(process.env.AI_TIMEOUT_MS || 12000);
    this.timeoutMs = Number.isFinite(configuredTimeout)
      ? Math.max(3000, Math.min(configuredTimeout, 30000))
      : 12000;
  }

  /** 保存 AI 调用记录 */
  async saveRecord(userId: number, type: string, prompt: string, result: string) {
    return this.prisma.aiRecord.create({
      data: { userId, type, prompt, result },
    });
  }

  /** 查询用户的 AI 记录（分页） */
  async findByUserId(userId: number, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      this.prisma.aiRecord.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.aiRecord.count({ where: { userId } }),
    ]);
    return { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getRelationshipContext(userId: number, relationshipId?: number) {
    if (!relationshipId) return null;
    const relationship = await this.prisma.relationship.findFirst({
      where: { id: relationshipId, userId },
      select: {
        id: true,
        name: true,
        type: true,
        birthday: true,
        tags: true,
        remark: true,
        events: {
          orderBy: { eventDate: 'desc' },
          take: 5,
          select: { title: true, eventDate: true },
        },
        memories: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: { content: true, memoryDate: true },
        },
      },
    });
    if (!relationship) throw new NotFoundException('关系不存在或无权访问');
    return relationship;
  }

  /** 调用大模型 */
  async chat(
    systemPrompt: string,
    userMessage: string,
    options: { temperature?: number; maxTokens?: number } = {},
  ): Promise<string> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('AI 服务尚未配置，请联系管理员');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: options.temperature ?? 0.45,
          max_tokens: options.maxTokens ?? 320,
        }),
        signal: controller.signal,
      });

      // Read raw text first to avoid JSON.parse errors on empty/non-JSON bodies
      const raw = await response.text();
      let data: any = null;

      if (!raw) {
        console.error('AI API returned empty response body');
        throw new BadGatewayException('AI 服务返回为空，请重试');
      }

      try {
        data = JSON.parse(raw);
      } catch (parseErr) {
        console.error('AI API returned non-JSON response:', raw);
        throw new BadGatewayException('AI 服务返回格式异常，请重试');
      }

      if (!response.ok) {
        console.error(`AI API HTTP ${response.status}:`, data || raw);
        throw new BadGatewayException('AI 服务暂时不可用，请稍后重试');
      }

      if (data.error) {
        console.error('AI API Error:', data.error);
        throw new BadGatewayException('AI 服务暂时不可用，请稍后重试');
      }

      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new BadGatewayException('AI 服务未生成有效内容，请重试');
      return content;
    } catch (error) {
      if (error instanceof ServiceUnavailableException || error instanceof BadGatewayException) throw error;
      if ((error as Error)?.name === 'AbortError') {
        throw new GatewayTimeoutException('AI 响应超时，请重试');
      }
      console.error('AI 调用失败:', error);
      throw new BadGatewayException('AI 服务连接失败，请稍后重试');
    } finally {
      clearTimeout(timeout);
    }
  }
}
