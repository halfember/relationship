import { BadRequestException, Injectable } from '@nestjs/common';

const BLOCKED_PATTERNS = [
  /色情|淫秽|裸聊|卖淫|赌博|博彩|六合彩|毒品|制毒|自杀|杀人|爆炸|枪支|炸弹/iu,
  /反政府|颠覆|邪教|法轮功|民族仇恨|恐怖主义/iu,
];

@Injectable()
export class ContentSafetyService {
  assertTextAllowed(value: unknown, field = '内容') {
    if (typeof value !== 'string' || !value.trim()) return;
    if (BLOCKED_PATTERNS.some((pattern) => pattern.test(value))) {
      throw new BadRequestException(`${field}包含不适宜内容，请修改后重试`);
    }
  }

  assertBodyAllowed(body: unknown) {
    const walk = (value: unknown, path: string) => {
      if (typeof value === 'string') this.assertTextAllowed(value, path);
      else if (Array.isArray(value)) value.forEach((item, index) => walk(item, `${path}[${index}]`));
      else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => {
        // Protocol values are identifiers, not user-authored content.
        if (/^(code|token|url|authorization|signature|openid|iv|encryptedData)$/i.test(key)) return;
        walk(item, key);
      });
    };
    walk(body, '内容');
  }
}
