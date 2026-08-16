import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common';

export type SubscribeMessageData = Record<string, { value: string }>;

export type SubscribeMessageResult = {
  errcode: number;
  errmsg: string;
};

/**
 * 微信小程序 API 对接服务
 * 负责 code → openid 交换
 */
@Injectable()
export class WechatService {
  private readonly appId: string;
  private readonly secret: string;
  private accessToken = '';
  private accessTokenExpiresAt = 0;

  constructor() {
    this.appId = process.env.WECHAT_APPID || '';
    this.secret = process.env.WECHAT_SECRET || '';
  }

  /**
   * 微信 code2Session 接口
   * 文档: https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/login/auth.code2Session.html
   */
  async code2Session(code: string): Promise<{
    openid: string;
    session_key: string;
    unionid?: string;
  }> {
    // 开发环境：支持测试 code 直接返回
    if (process.env.NODE_ENV !== 'production' && (code === 'dev_openid_test' || code.startsWith('dev_'))) {
      return {
        openid: code,
        session_key: 'dev_session_key',
        unionid: undefined,
      };
    }

    if (!this.appId || !this.secret) {
      throw new BadRequestException('微信 AppID / Secret 未配置，请检查 .env');
    }

    const url = 'https://api.weixin.qq.com/sns/jscode2session';
    const params = new URLSearchParams({
      appid: this.appId,
      secret: this.secret,
      js_code: code,
      grant_type: 'authorization_code',
    });

    try {
      const response = await fetch(`${url}?${params.toString()}`);
      const data = await response.json();

      if (data.errcode) {
        throw new BadRequestException(
          `微信登录失败: ${data.errmsg || '未知错误'} (errcode: ${data.errcode})`,
        );
      }

      return {
        openid: data.openid,
        session_key: data.session_key,
        unionid: data.unionid,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('微信服务请求失败，请稍后重试');
    }
  }

  async sendSubscribeMessage(input: {
    openid: string;
    templateId: string;
    page: string;
    data: SubscribeMessageData;
  }): Promise<SubscribeMessageResult> {
    if (!this.appId || !this.secret) {
      throw new ServiceUnavailableException('微信消息服务未配置');
    }

    let result = await this.postSubscribeMessage(input, await this.getAccessToken());
    if ([40001, 40014, 42001].includes(result.errcode)) {
      this.accessToken = '';
      this.accessTokenExpiresAt = 0;
      result = await this.postSubscribeMessage(input, await this.getAccessToken());
    }
    return result;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.accessTokenExpiresAt > Date.now() + 60_000) return this.accessToken;

    const params = new URLSearchParams({
      grant_type: 'client_credential',
      appid: this.appId,
      secret: this.secret,
    });
    const data = await this.fetchJson(`https://api.weixin.qq.com/cgi-bin/token?${params.toString()}`, {
      method: 'GET',
    });
    if (!data?.access_token || data.errcode) {
      throw new ServiceUnavailableException(`微信 access_token 获取失败 (${data?.errcode || 'unknown'})`);
    }
    this.accessToken = data.access_token;
    this.accessTokenExpiresAt = Date.now() + Math.max(300, Number(data.expires_in) || 7200) * 1000;
    return this.accessToken;
  }

  private async postSubscribeMessage(input: {
    openid: string;
    templateId: string;
    page: string;
    data: SubscribeMessageData;
  }, accessToken: string): Promise<SubscribeMessageResult> {
    const data = await this.fetchJson(
      `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touser: input.openid,
          template_id: input.templateId,
          page: input.page,
          miniprogram_state: process.env.NODE_ENV === 'production' ? 'formal' : 'developer',
          lang: 'zh_CN',
          data: input.data,
        }),
      },
    );
    const errcode = Number(data?.errcode);
    return {
      errcode: Number.isFinite(errcode) ? errcode : -1,
      errmsg: String(data?.errmsg || (Number.isFinite(errcode) ? 'ok' : 'invalid response')),
    };
  }

  private async fetchJson(url: string, init: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json() as any;
    } catch {
      throw new ServiceUnavailableException('微信服务请求失败，请稍后重试');
    } finally {
      clearTimeout(timeout);
    }
  }
}
