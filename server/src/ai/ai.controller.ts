import {
  BadGatewayException,
  BadRequestException,
  Controller,
  Post,
  Get,
  Body,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateDto } from './dto/generate.dto';
import { CurrentUserId } from '../auth/current-user.decorator';
import { parseGiftSuggestions } from './gift-suggestions';
import { RateLimit } from '../common/rate-limit.decorator';
import { ContentSafetyService } from '../content-safety/content-safety.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService, private readonly contentSafety: ContentSafetyService) {}

  /**
   * POST /api/ai/generate
   * AI 生成祝福语 / 纪念日文案 / 送礼建议
   *
   * type: 'blessing' | 'memory' | 'gift'
   */
  @Post('generate')
  @RateLimit(20)
  async generate(@Body() dto: GenerateDto, @CurrentUserId() userId: number) {
    const systemPrompts: Record<string, string> = {
      blessing: '你是克制、真诚的中文祝福语助手。只使用用户提供的资料，不得虚构共同经历、爱好、职业或事实。资料不足时写自然的通用表达，不要假装了解对方。只输出祝福正文，80字以内。',
      memory: '你是严谨的中文纪念文案助手。只使用用户明确提供的事实，不得补写未发生的地点、日期、对话或经历。只输出文案正文，120字以内。',
      gift: '你是严谨的送礼决策助手。必须严格满足预算、场景、偏好和避雷条件；未提供的爱好不得猜测，不得虚构品牌、型号、实时价格、库存、折扣或对方经历。只推荐礼物品类与挑选标准。只输出 JSON，不使用 Markdown，格式为 {"suggestions":[{"name":"礼物品类","reason":"基于已知条件的理由","priceRange":"预算内区间","priceMin":整数,"priceMax":整数}],"summary":"不超过60字的购买提示"}，必须正好3项。',
    };

    if (dto.type === 'gift' && (dto.budgetMin === undefined || dto.budgetMax === undefined || dto.budgetMin >= dto.budgetMax)) {
      throw new BadRequestException('请选择有效的预算范围');
    }

    const relationship = await this.aiService.getRelationshipContext(userId, dto.relationshipId);
    const systemPrompt = systemPrompts[dto.type] || systemPrompts.blessing;
    const userMessage = this.buildUserMessage(dto, relationship);
    const generationOptions = {
      blessing: { temperature: 0.45, maxTokens: 160 },
      memory: { temperature: 0.5, maxTokens: 220 },
      gift: { temperature: 0.2, maxTokens: 420 },
    }[dto.type];
    const result = await this.aiService.chat(systemPrompt, userMessage, generationOptions);
    this.contentSafety.assertTextAllowed(result, 'AI 生成内容');

    const giftData = dto.type === 'gift'
      ? parseGiftSuggestions(result, { min: dto.budgetMin!, max: dto.budgetMax! })
      : null;
    if (giftData && giftData.suggestions.length !== 3) {
      throw new BadGatewayException('AI 未能生成符合预算的礼物建议，请重试或调整条件');
    }

    // 记录写入不阻塞主响应；失败只记录日志，不向用户返回伪造内容。
    void this.aiService.saveRecord(userId, dto.type, dto.prompt, result).catch((error) => {
      console.error('保存 AI 记录失败:', error);
    });
    return {
      code: 0,
      data: {
        type: dto.type,
        result: giftData?.summary || result,
        ...(giftData ? { suggestions: giftData.suggestions } : {}),
      },
      message: 'ok',
    };
  }

  private buildUserMessage(dto: GenerateDto, relationship: any): string {
    const context = relationship ? [
      `称呼：${relationship.name}`,
      `关系：${relationship.type}`,
      relationship.birthday ? `生日：${relationship.birthday.toISOString().slice(0, 10)}` : '',
      relationship.tags ? `标签：${JSON.stringify(relationship.tags)}` : '',
      relationship.remark ? `备注：${String(relationship.remark).slice(0, 300)}` : '',
      relationship.events?.length
        ? `已记录的重要日：${relationship.events.map((item: any) => `${item.title}(${item.eventDate.toISOString().slice(0, 10)})`).join('、')}`
        : '',
      relationship.memories?.length
        ? `近期真实记录：${relationship.memories.map((item: any) => String(item.content || '').slice(0, 100)).filter(Boolean).join('；')}`
        : '',
    ].filter(Boolean).join('\n') : '没有可用的关系档案，只能使用本次输入，不得自行补充事实。';

    if (dto.type === 'gift') {
      return [
        '任务：生成送礼建议',
        `场景：${dto.scene || '未指定'}`,
        `预算硬约束：每项建议的最低价和最高价都必须在 ${dto.budgetMin}-${dto.budgetMax} 元内`,
        `明确偏好：${dto.preferences?.trim() || '未提供，不得猜测'}`,
        `明确避雷：${dto.avoid?.trim() || '未提供'}`,
        '关系档案（仅以下内容可当作事实）：',
        context,
      ].join('\n');
    }

    return [
      `任务：${dto.type === 'blessing' ? '生成祝福语' : '生成纪念文案'}`,
      dto.scene ? `场景：${dto.scene}` : '',
      dto.style ? `风格：${dto.style}` : '',
      '关系档案（仅以下内容可当作事实）：',
      context,
      `用户本次补充：${dto.prompt}`,
    ].filter(Boolean).join('\n');
  }

  /**
   * GET /api/ai/records?userId=1&page=1&pageSize=20
   * 查询用户 AI 调用记录（分页）
   */
  @Get('records')
  async records(
    @Query('userId', ParseIntPipe) _userId: number,
    @CurrentUserId() userId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    const data = await this.aiService.findByUserId(userId, page, pageSize);
    return { code: 0, data, message: 'ok' };
  }
}
