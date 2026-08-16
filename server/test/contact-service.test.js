const test = require('node:test');
const assert = require('node:assert/strict');
const { ContactService } = require('../dist/contact/contact.service');

function createPrisma(createdRelationships) {
  const prisma = {
    contactInvite: {
      findUnique: async () => ({
        id: 10,
        token: 'ABCDEFGH',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 60_000),
        inviterId: 1,
        inviterRelationshipId: 11,
        displayName: 'Private name chosen by inviter',
        relationshipType: 'family',
        inviter: { id: 1, nickname: 'Alice', avatar: null },
        inviterRelationship: { id: 11 },
      }),
      updateMany: async () => ({ count: 1 }),
      update: async ({ data }) => ({ id: 10, ...data }),
    },
    contactConnection: {
      findUnique: async () => null,
      create: async ({ data }) => ({ id: 20, status: 'ACTIVE', ...data }),
    },
    relationship: {
      findFirst: async () => null,
      create: async ({ data }) => {
        createdRelationships.push(data);
        return { id: 30, ...data };
      },
    },
  };
  prisma.$transaction = async (operation) => operation(prisma);
  return prisma;
}

test('accepting a contact invite defaults to the inviter nickname, not the inviter private contact name', async () => {
  const createdRelationships = [];
  const service = new ContactService(createPrisma(createdRelationships));

  await service.acceptInvite(2, { token: 'ABCDEFGH' });

  assert.equal(createdRelationships.length, 1);
  assert.equal(createdRelationships[0].name, 'Alice');
  assert.equal(createdRelationships[0].type, '朋友');
});

test('accepting a contact invite preserves the recipient own name and relationship type', async () => {
  const createdRelationships = [];
  const service = new ContactService(createPrisma(createdRelationships));

  await service.acceptInvite(2, {
    token: 'ABCDEFGH',
    displayName: 'My contact name',
    relationshipType: 'colleague',
  });

  assert.equal(createdRelationships[0].name, 'My contact name');
  assert.equal(createdRelationships[0].type, '同事');
});

test('only a pending sent invite can be revoked', async () => {
  const prisma = {
    contactInvite: { updateMany: async () => ({ count: 1 }) },
  };
  const service = new ContactService(prisma);

  assert.deepEqual(await service.revokeInvite(10, 1), { id: 10, status: 'REVOKED' });
});

test('rejecting an invite claims its pending state atomically', async () => {
  let updateArgs;
  const prisma = {
    contactInvite: {
      findUnique: async () => ({
        id: 10,
        inviterId: 1,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 60_000),
      }),
      updateMany: async (args) => { updateArgs = args; return { count: 1 }; },
    },
  };
  const service = new ContactService(prisma);

  assert.deepEqual(await service.rejectInvite(2, { token: 'abcdefgh' }), { id: 10, status: 'REJECTED' });
  assert.equal(updateArgs.where.status, 'PENDING');
  assert.equal(updateArgs.data.status, 'REJECTED');
  assert.equal(updateArgs.data.acceptedById, 2);
});
