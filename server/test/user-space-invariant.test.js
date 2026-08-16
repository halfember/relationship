const assert = require('node:assert/strict');
const test = require('node:test');
const { UserService } = require('../dist/user/user.service');

test('an active pair member must leave before deleting the account', async () => {
  let transactionCalled = false;
  const prisma = {
    user: { findUnique: async () => ({ id: 7 }) },
    sharedSpace: { count: async () => 0 },
    spaceMember: { count: async () => 1 },
    $transaction: async () => { transactionCalled = true; },
  };

  await assert.rejects(
    () => new UserService(prisma).deleteAccount(7),
    (error) => error?.message === '请先退出双人共同空间再注销账号',
  );
  assert.equal(transactionCalled, false);
});
