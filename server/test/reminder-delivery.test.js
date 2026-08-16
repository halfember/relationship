const assert = require('node:assert/strict');
const test = require('node:test');
const { ReminderService } = require('../dist/reminder/reminder.service');

function createHarness({ result, error, attemptCount = 0, claimCount = 1 } = {}) {
  const now = new Date(2026, 7, 16, 9, 10, 0);
  const reminder = {
    id: 31,
    userId: 7,
    sourceType: 'RELATIONSHIP',
    relationshipId: 12,
    sharedSpaceId: null,
    eventTitle: '妈妈生日',
    relationshipName: '妈妈',
    eventDate: new Date(2026, 7, 20),
    remindDate: now,
    daysUntil: 4,
    sent: false,
    deliveryStatus: 'PENDING',
    attemptCount,
    user: { openid: 'openid-test' },
  };
  const updates = [];
  const messages = [];
  const prisma = {
    reminder: {
      updateMany: async (input) => ({ count: input.where.id ? claimCount : 0 }),
      findMany: async () => [reminder],
      update: async (input) => {
        updates.push(input);
        return input;
      },
    },
  };
  const wechat = {
    sendSubscribeMessage: async (input) => {
      messages.push(input);
      if (error) throw error;
      return result || { errcode: 0, errmsg: 'ok' };
    },
  };
  return { service: new ReminderService(prisma, wechat), now, updates, messages };
}

test('successful delivery stores SENT only after WeChat accepts the message', async () => {
  const originalTemplateId = process.env.WECHAT_REMINDER_TEMPLATE_ID;
  process.env.WECHAT_REMINDER_TEMPLATE_ID = 'configured-template-id';
  const harness = createHarness();
  let summary;
  try {
    summary = await harness.service.dispatchDueReminders(harness.now);
  } finally {
    if (originalTemplateId === undefined) delete process.env.WECHAT_REMINDER_TEMPLATE_ID;
    else process.env.WECHAT_REMINDER_TEMPLATE_ID = originalTemplateId;
  }

  assert.deepEqual(summary, { sent: 1, noPermission: 0, retry: 0, failed: 0 });
  assert.equal(harness.updates.at(-1).data.deliveryStatus, 'SENT');
  assert.equal(harness.updates.at(-1).data.sent, true);
  assert.equal(harness.messages[0].data.thing1.value, '妈妈生日');
  assert.match(harness.messages[0].data.time2.value, /^2026年8月20日$/);
  assert.equal(harness.messages[0].data.thing4.value, '妈妈 · 提前4天');
  assert.equal(harness.messages[0].page, 'pages/relationship/detail?id=12');
  assert.equal(harness.messages[0].templateId, 'configured-template-id');
});

test('missing subscription permission is terminal and is never marked sent', async () => {
  const harness = createHarness({ result: { errcode: 43101, errmsg: 'user refuse' } });
  const summary = await harness.service.dispatchDueReminders(harness.now);

  assert.equal(summary.noPermission, 1);
  assert.equal(harness.updates.at(-1).data.deliveryStatus, 'NO_PERMISSION');
  assert.equal(harness.updates.at(-1).data.sent, undefined);
});

test('network failure schedules a retry with an honest delivery state', async () => {
  const harness = createHarness({ error: new Error('network unavailable') });
  const summary = await harness.service.dispatchDueReminders(harness.now);

  assert.equal(summary.retry, 1);
  assert.equal(harness.updates.at(-1).data.deliveryStatus, 'RETRY');
  assert.equal(harness.updates.at(-1).data.failureCode, 'NETWORK');
  assert.ok(harness.updates.at(-1).data.nextAttemptAt > harness.now);
});

test('the fifth temporary failure becomes FAILED', async () => {
  const harness = createHarness({
    attemptCount: 4,
    result: { errcode: -1, errmsg: 'system error' },
  });
  const summary = await harness.service.dispatchDueReminders(harness.now);

  assert.equal(summary.failed, 1);
  assert.equal(harness.updates.at(-1).data.deliveryStatus, 'FAILED');
  assert.equal(harness.updates.at(-1).data.nextAttemptAt, null);
});

test('a reminder is not sent when another worker already claimed it', async () => {
  const harness = createHarness({ claimCount: 0 });
  const summary = await harness.service.dispatchDueReminders(harness.now);

  assert.deepEqual(summary, { sent: 0, noPermission: 0, retry: 0, failed: 0 });
  assert.equal(harness.messages.length, 0);
  assert.equal(harness.updates.length, 0);
});
