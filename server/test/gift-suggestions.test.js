const test = require('node:test');
const assert = require('node:assert/strict');
const { parseGiftSuggestions } = require('../dist/ai/gift-suggestions');

test('parses structured gift suggestions wrapped in a JSON code fence', () => {
  const result = parseGiftSuggestions('```json\n{"suggestions":[{"name":"相册","reason":"记录回忆","priceRange":"100-300元"}],"summary":"附一张卡片"}\n```');
  assert.deepEqual(result.suggestions, [{ name: '相册', reason: '记录回忆', priceRange: '100-300元' }]);
  assert.equal(result.summary, '附一张卡片');
});

test('keeps an unstructured AI response as the summary', () => {
  const result = parseGiftSuggestions('暂时无法生成结构化建议');
  assert.deepEqual(result.suggestions, []);
  assert.equal(result.summary, '暂时无法生成结构化建议');
});

test('keeps only suggestions fully inside the selected budget', () => {
  const raw = JSON.stringify({
    suggestions: [
      { name: '桌面相框', reason: '适合日常陈列', priceRange: '200-350元', priceMin: 200, priceMax: 350 },
      { name: '耳机', reason: '超出本次预算', priceRange: '450-800元', priceMin: 450, priceMax: 800 },
      { name: '手写卡片', reason: '低于本次预算范围', priceRange: '20-50元', priceMin: 20, priceMax: 50 },
    ],
    summary: '按条件筛选',
  });
  const result = parseGiftSuggestions(raw, { min: 200, max: 500 });
  assert.deepEqual(result.suggestions.map((item) => item.name), ['桌面相框']);
});

test('rejects suggestions without a verifiable price range when a budget is selected', () => {
  const raw = JSON.stringify({ suggestions: [{ name: '体验课', reason: '可共同参与', priceRange: '价格面议' }] });
  const result = parseGiftSuggestions(raw, { min: 200, max: 500 });
  assert.deepEqual(result.suggestions, []);
});
