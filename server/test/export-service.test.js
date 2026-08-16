const assert = require('node:assert/strict');
const test = require('node:test');
const { ExportService } = require('../dist/export/export.service');

function relationship(events) {
  return {
    id: 4,
    userId: 2,
    name: '小雨',
    type: '朋友',
    birthday: null,
    tags: null,
    remark: null,
    createdAt: new Date('2020-01-01T00:00:00.000Z'),
    events,
    memories: [],
  };
}

test('relationship card advances annual events to their next occurrence', async () => {
  const prisma = {
    relationship: {
      findUnique: async () => relationship([{
        id: 8,
        title: '认识纪念日',
        eventDate: new Date('2020-12-31T00:00:00.000Z'),
        repeatType: '每年',
      }]),
    },
  };

  const data = await new ExportService(prisma).exportRelationship(4, 2);
  assert.equal(data.upcomingEvents.length, 1);
  assert.ok(data.upcomingEvents[0].daysUntil >= 0);
  assert.ok(new Date(data.upcomingEvents[0].eventDate).getTime() >= new Date().setHours(0, 0, 0, 0));
});

test('relationship card marks non-repeating past events as days ago', async () => {
  const prisma = {
    relationship: {
      findUnique: async () => relationship([{
        id: 9,
        title: '过去的旅行',
        eventDate: new Date('2020-01-02T00:00:00.000Z'),
        repeatType: null,
      }]),
    },
  };

  const data = await new ExportService(prisma).exportRelationship(4, 2);
  assert.equal(data.upcomingEvents.length, 0);
  assert.ok(data.recentPastEvents[0].daysUntil < 0);
});
