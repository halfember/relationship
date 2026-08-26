const test = require('node:test');
const assert = require('node:assert/strict');
const { BadRequestException } = require('@nestjs/common');
const { ContentSafetyService } = require('../dist/content-safety/content-safety.service');

test('content safety rejects prohibited text', () => {
  const safety = new ContentSafetyService();
  assert.throws(() => safety.assertTextAllowed('这是一段赌博博彩内容', '备注'), BadRequestException);
  assert.doesNotThrow(() => safety.assertTextAllowed('周末和家人吃饭', '备注'));
});

test('content safety walks nested request bodies', () => {
  const safety = new ContentSafetyService();
  assert.throws(() => safety.assertBodyAllowed({ nested: { prompt: '包含色情内容' } }), BadRequestException);
});

test('content safety ignores protocol identifiers and URLs', () => {
  const safety = new ContentSafetyService();
  assert.doesNotThrow(() => safety.assertBodyAllowed({
    code: 'dev_赌博博彩',
    token: '色情内容-token',
    url: 'https://example.com/赌博博彩',
    prompt: '周末和家人吃饭',
  }));
});
