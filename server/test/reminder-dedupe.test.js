const assert = require('node:assert/strict');
const test = require('node:test');
const { deduplicateReminderOccurrences } = require('../dist/reminder/reminder-dedupe');

test('multiple reminder milestones render as one event occurrence', () => {
  const eventDate = new Date('2026-08-18T00:00:00.000Z');
  const rows = [
    { id: 1, userId: 2, sourceType: 'RELATIONSHIP', eventId: 7, sharedEventId: null, eventDate, remindDate: new Date('2026-08-15T00:00:00.000Z') },
    { id: 2, userId: 2, sourceType: 'RELATIONSHIP', eventId: 7, sharedEventId: null, eventDate, remindDate: new Date('2026-08-18T00:00:00.000Z') },
    { id: 3, userId: 2, sourceType: 'RELATIONSHIP', eventId: 8, sharedEventId: null, eventDate, remindDate: new Date('2026-08-18T00:00:00.000Z') },
  ];

  assert.deepEqual(deduplicateReminderOccurrences(rows).map((item) => item.id), [1, 3]);
});

test('shared and private events with the same numeric id remain separate', () => {
  const eventDate = new Date('2026-08-18T00:00:00.000Z');
  const rows = [
    { id: 1, userId: 2, sourceType: 'RELATIONSHIP', eventId: 7, sharedEventId: null, eventDate },
    { id: 2, userId: 2, sourceType: 'SPACE', eventId: null, sharedEventId: 7, eventDate },
  ];

  assert.equal(deduplicateReminderOccurrences(rows).length, 2);
});
