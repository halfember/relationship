const assert = require('node:assert/strict');
const test = require('node:test');
const { ReminderService } = require('../dist/reminder/reminder.service');

test('shared events create one reminder per active account member', async () => {
  const created = [];
  const insertCalls = [];
  const eventDate = new Date();
  eventDate.setHours(0, 0, 0, 0);
  eventDate.setDate(eventDate.getDate() + 5);

  const prisma = {
    reminder: {
      deleteMany: async () => ({ count: 0 }),
      createMany: async (input) => {
        insertCalls.push(input);
        created.push(...input.data);
        return { count: input.data.length };
      },
    },
    event: { findMany: async () => [] },
    sharedEvent: {
      findMany: async () => [{
        id: 8,
        spaceId: 3,
        title: '家庭纪念日',
        eventDate,
        repeatType: '每年',
        remindDays: [1, 0],
        space: { id: 3, name: '我们的家', members: [{ userId: 11 }, { userId: 12 }] },
      }],
    },
  };

  await new ReminderService(prisma).generateUpcoming();

  assert.equal(insertCalls.length, 1);
  assert.equal(insertCalls[0].skipDuplicates, true);
  assert.equal(created.length, 4);
  assert.deepEqual(new Set(created.map((item) => item.userId)), new Set([11, 12]));
  assert.ok(created.every((item) => item.sourceType === 'SPACE'));
  assert.ok(created.every((item) => item.sharedSpaceId === 3 && item.sharedEventId === 8));
  assert.ok(created.every((item) => item.relationshipId === undefined && item.eventId === undefined));
});
