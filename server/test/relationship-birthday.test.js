const test = require('node:test');
const assert = require('node:assert/strict');
const { RelationshipService } = require('../dist/relationship/relationship.service');

test('creating a relationship with a birthday creates one annual birthday event in the same transaction', async () => {
  const events = [];
  const prisma = {
    $transaction: async (operation) => operation(prisma),
    relationship: {
      create: async ({ data }) => ({ id: 41, ...data }),
    },
    event: {
      create: async ({ data }) => { events.push(data); return { id: 9, ...data }; },
    },
  };
  const service = new RelationshipService(prisma);
  const relationship = await service.create({
    userId: 7,
    name: '小雨',
    type: '朋友',
    birthday: '2000-08-16',
  }, 7);

  assert.equal(relationship.id, 41);
  assert.equal(events.length, 1);
  assert.equal(events[0].relationshipId, 41);
  assert.equal(events[0].title, '生日');
  assert.equal(events[0].repeatType, '每年');
  assert.deepEqual(events[0].remindDays, [7, 1, 0]);
  assert.equal(events[0].eventDate.toISOString().slice(0, 10), '2000-08-16');
});

test('creating a relationship without a birthday does not create a birthday event', async () => {
  let eventCreated = false;
  const prisma = {
    $transaction: async (operation) => operation(prisma),
    relationship: { create: async ({ data }) => ({ id: 42, ...data }) },
    event: { create: async () => { eventCreated = true; } },
  };
  const service = new RelationshipService(prisma);
  await service.create({ userId: 7, name: '林先生', type: '同事' }, 7);
  assert.equal(eventCreated, false);
});

test('updating a birthday synchronizes the annual birthday event and clears stale reminders', async () => {
  const updates = [];
  const deletedReminders = [];
  const prisma = {
    $transaction: async (operation) => operation(prisma),
    relationship: {
      findUnique: async () => ({ id: 41, userId: 7, events: [], memories: [] }),
      update: async ({ data }) => ({ id: 41, userId: 7, ...data }),
    },
    event: {
      findFirst: async () => ({ id: 9, relationshipId: 41, title: '生日', repeatType: '每年' }),
      update: async ({ where, data }) => { updates.push({ where, data }); return { id: where.id, ...data }; },
      create: async () => { throw new Error('should not create a duplicate birthday event'); },
    },
    reminder: {
      deleteMany: async ({ where }) => { deletedReminders.push(where); return { count: 1 }; },
    },
  };
  const service = new RelationshipService(prisma);
  await service.update(41, { birthday: '2001-09-20' }, 7);

  assert.equal(updates.length, 1);
  assert.equal(updates[0].data.eventDate.toISOString().slice(0, 10), '2001-09-20');
  assert.deepEqual(updates[0].data.remindDays, [7, 1, 0]);
  assert.deepEqual(deletedReminders, [{ sourceType: 'RELATIONSHIP', eventId: 9 }]);
});
