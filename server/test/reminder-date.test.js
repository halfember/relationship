const test = require('node:test');
const assert = require('node:assert/strict');
const {
  computeNextOccurrence,
  nextMonthlyDate,
  nextWeeklyDate,
  daysUntilDate,
} = require('../dist/reminder/reminder-date');

test('non-repeating past event has no next occurrence', () => {
  const result = computeNextOccurrence(
    new Date(2026, 6, 1),
    null,
    new Date(2026, 7, 11),
  );
  assert.equal(result, null);
});

test('days until event uses calendar days and never returns a negative value', () => {
  assert.equal(daysUntilDate(new Date(2026, 7, 14, 23), new Date(2026, 7, 11, 8)), 3);
  assert.equal(daysUntilDate(new Date(2026, 7, 10), new Date(2026, 7, 11)), 0);
});

test('annual event advances to next year after its anniversary', () => {
  const result = computeNextOccurrence(
    new Date(2020, 4, 20),
    '每年',
    new Date(2026, 7, 11),
  );
  assert.deepEqual(result, new Date(2027, 4, 20));
});

test('monthly event clamps to the last day of a short month', () => {
  const result = nextMonthlyDate(new Date(2026, 1, 1), 31);
  assert.deepEqual(result, new Date(2026, 1, 28));
});

test('weekly event occurring today advances exactly one week', () => {
  const now = new Date(2026, 7, 11);
  const result = nextWeeklyDate(now, now.getDay());
  assert.deepEqual(result, new Date(2026, 7, 18));
});

test('weekly event later this week uses the nearest matching day', () => {
  const result = nextWeeklyDate(new Date(2026, 7, 11), 5);
  assert.deepEqual(result, new Date(2026, 7, 14));
});
