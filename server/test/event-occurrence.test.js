const test = require('node:test');
const assert = require('node:assert/strict');
const { EventService } = require('../dist/event/event.service');

test('calendar occurrences come directly from personal and shared events', async () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const personalDate = new Date(now);
  personalDate.setDate(personalDate.getDate() + 45);
  const sharedDate = new Date(now);
  sharedDate.setDate(sharedDate.getDate() + 12);
  const prisma = {
    event: { findMany: async () => [{ id: 4, relationshipId: 8, title: '下次见面', eventDate: personalDate, repeatType: null, relationship: { id: 8, name: '小林' } }] },
    sharedEvent: { findMany: async () => [{ id: 6, spaceId: 3, title: '家庭聚餐', eventDate: sharedDate, repeatType: null, space: { id: 3, name: '我们的家' } }] },
  };

  const rows = await new EventService(prisma).findUpcomingForUser(7, 90);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].sourceType, 'SPACE');
  assert.equal(rows[0].daysUntilEvent, 12);
  assert.equal(rows[1].sourceType, 'RELATIONSHIP');
  assert.equal(rows[1].daysUntilEvent, 45);
});

test('calendar occurrences enforce a bounded query window', async () => {
  const service = new EventService({});
  await assert.rejects(() => service.findUpcomingForUser(7, 366), /查询范围/);
});
