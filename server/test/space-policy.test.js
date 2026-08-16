const assert = require('node:assert/strict');
const test = require('node:test');
const {
  canDeleteSharedContent,
  canManageSpace,
  canRemoveSpaceMember,
  generateSpaceInviteToken,
  getInviteState,
} = require('../dist/space/space-policy');

test('space invite token is uppercase and excludes ambiguous characters', () => {
  const token = generateSpaceInviteToken();
  assert.match(token, /^[A-HJ-NP-Z2-9]{10}$/);
});

test('member removal preserves pair and owner invariants', () => {
  assert.equal(canRemoveSpaceMember('PAIR', 'MEMBER'), false);
  assert.equal(canRemoveSpaceMember('FAMILY', 'OWNER'), false);
  assert.equal(canRemoveSpaceMember('FAMILY', 'MEMBER'), true);
});

test('pending invite becomes expired at its expiry time', () => {
  const expiresAt = new Date('2026-08-14T12:00:00.000Z');
  assert.equal(getInviteState('PENDING', expiresAt, new Date('2026-08-14T11:59:59.000Z')), 'PENDING');
  assert.equal(getInviteState('PENDING', expiresAt, new Date('2026-08-14T12:00:00.000Z')), 'EXPIRED');
  assert.equal(getInviteState('ACCEPTED', expiresAt, new Date('2026-08-15T12:00:00.000Z')), 'ACCEPTED');
});

test('owners and admins manage spaces while authors retain content control', () => {
  assert.equal(canManageSpace('OWNER'), true);
  assert.equal(canManageSpace('ADMIN'), true);
  assert.equal(canManageSpace('MEMBER'), false);
  assert.equal(canDeleteSharedContent('MEMBER', 8, 8), true);
  assert.equal(canDeleteSharedContent('MEMBER', 8, 9), false);
  assert.equal(canDeleteSharedContent('OWNER', 8, 9), true);
});
