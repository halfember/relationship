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
    (error) => error?.getResponse?.().errorCode === 'ACCOUNT_HAS_ACTIVE_PAIR_SPACE',
  );
  assert.equal(transactionCalled, false);
});

test('an owner must dissolve active spaces before deleting the account', async () => {
  let membershipChecked = false;
  const prisma = {
    user: { findUnique: async () => ({ id: 7 }) },
    sharedSpace: { count: async () => 1 },
    spaceMember: { count: async () => { membershipChecked = true; return 0; } },
  };

  await assert.rejects(
    () => new UserService(prisma).deleteAccount(7),
    (error) => error?.getResponse?.().errorCode === 'ACCOUNT_HAS_OWNED_SPACES',
  );
  assert.equal(membershipChecked, false);
});
