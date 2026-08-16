const assert = require('node:assert/strict');
const test = require('node:test');
const { normalizeRelationshipType } = require('../dist/relationship/relationship-type');

test('relationship types use the existing Chinese categories', () => {
  assert.equal(normalizeRelationshipType('friend'), '朋友');
  assert.equal(normalizeRelationshipType('lover'), '恋人');
  assert.equal(normalizeRelationshipType('同事'), '同事');
  assert.equal(normalizeRelationshipType('unexpected'), '其他');
  assert.equal(normalizeRelationshipType(), '朋友');
});
