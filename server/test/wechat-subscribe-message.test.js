const assert = require('node:assert/strict');
const test = require('node:test');
const { WechatService } = require('../dist/wechat/wechat.service');

const input = {
  openid: 'openid-test',
  templateId: 'template-test',
  page: 'pages/relationship/detail?id=12',
  data: {
    thing1: { value: '妈妈生日' },
    time2: { value: '2026年8月20日' },
    thing4: { value: '妈妈 · 提前4天' },
  },
};

function response(body) {
  return { ok: true, json: async () => body };
}

function withWechatEnv(run) {
  return async () => {
    const originalFetch = global.fetch;
    const originalAppId = process.env.WECHAT_APPID;
    const originalSecret = process.env.WECHAT_SECRET;
    process.env.WECHAT_APPID = 'appid-test';
    process.env.WECHAT_SECRET = 'secret-test';
    try {
      await run();
    } finally {
      global.fetch = originalFetch;
      if (originalAppId === undefined) delete process.env.WECHAT_APPID;
      else process.env.WECHAT_APPID = originalAppId;
      if (originalSecret === undefined) delete process.env.WECHAT_SECRET;
      else process.env.WECHAT_SECRET = originalSecret;
    }
  };
}

test('access token is cached and template payload is forwarded unchanged', withWechatEnv(async () => {
  const requests = [];
  global.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    if (String(url).includes('/cgi-bin/token?')) {
      return response({ access_token: 'token-1', expires_in: 7200 });
    }
    return response({ errcode: 0, errmsg: 'ok' });
  };

  const service = new WechatService();
  await service.sendSubscribeMessage(input);
  await service.sendSubscribeMessage(input);

  assert.equal(requests.filter((item) => item.url.includes('/cgi-bin/token?')).length, 1);
  const body = JSON.parse(requests.find((item) => item.url.includes('/message/subscribe/send?')).init.body);
  assert.equal(body.template_id, input.templateId);
  assert.deepEqual(body.data, input.data);
}));

test('invalid access token is refreshed once before retrying the message', withWechatEnv(async () => {
  const replies = [
    { access_token: 'token-old', expires_in: 7200 },
    { errcode: 40001, errmsg: 'invalid credential' },
    { access_token: 'token-new', expires_in: 7200 },
    { errcode: 0, errmsg: 'ok' },
  ];
  global.fetch = async () => response(replies.shift());

  const result = await new WechatService().sendSubscribeMessage(input);

  assert.equal(result.errcode, 0);
  assert.equal(replies.length, 0);
}));

test('malformed WeChat response is not treated as delivered', withWechatEnv(async () => {
  const replies = [
    { access_token: 'token-1', expires_in: 7200 },
    {},
  ];
  global.fetch = async () => response(replies.shift());

  const result = await new WechatService().sendSubscribeMessage(input);

  assert.equal(result.errcode, -1);
  assert.equal(result.errmsg, 'invalid response');
}));
