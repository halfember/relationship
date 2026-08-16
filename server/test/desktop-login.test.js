const test = require('node:test');
const assert = require('node:assert/strict');
const { UserService } = require('../dist/user/user.service');

test('desktop connection codes are single-use and expire', async () => {
  let record;
  let consumed = false;
  const user = { id: 7, openid: 'openid-7', nickname: '小雨', avatar: null, vipLevel: 0 };
  const prisma = {
    user: { findUnique: async () => user },
    desktopLoginCode: {
      deleteMany: async () => ({ count: 0 }),
      create: async ({ data }) => { record = { id: 1, userId: 7, ...data, usedAt: null }; return record; },
      findUnique: async () => record,
      updateMany: async () => { if (consumed) return { count: 0 }; consumed = true; return { count: 1 }; },
    },
  };
  const service = new UserService(prisma);
  const issued = await service.createDesktopLoginCode(7);
  assert.match(issued.code, /^[A-HJ-NP-Z2-9]{8}$/);
  const first = await service.consumeDesktopLoginCode(issued.code);
  assert.equal(first.id, 7);
  await assert.rejects(() => service.consumeDesktopLoginCode(issued.code), /已被使用/);
});
