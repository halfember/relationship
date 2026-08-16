const test = require('node:test');
const assert = require('node:assert/strict');
const { groupDatesByMonthWeek } = require('../dist/analytics/analytics-period');

test('groups reminder dates into four month buckets', () => {
  assert.deepEqual(
    groupDatesByMonthWeek([
      new Date(2026, 7, 1),
      new Date(2026, 7, 7),
      new Date(2026, 7, 8),
      new Date(2026, 7, 22),
      new Date(2026, 7, 31),
    ]),
    [
      { week: 1, count: 2 },
      { week: 2, count: 1 },
      { week: 3, count: 0 },
      { week: 4, count: 2 },
    ],
  );
});
