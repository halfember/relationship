const test = require('node:test');
const assert = require('node:assert/strict');
const { RelationshipService } = require('../dist/relationship/relationship.service');

function createPrisma(spaceStatus) {
  const calls = { disconnected: 0, deleted: 0 };
  const prisma = {
    relationship: {
      findFirst: async () => ({ id: 41, userId: 7 }),
      delete: async () => { calls.deleted += 1; },
    },
    contactConnection: {
      findMany: async () => [{ id: 9, sharedSpace: spaceStatus ? { status: spaceStatus } : null }],
      updateMany: async () => { calls.disconnected += 1; },
    },
    reminder: { deleteMany: async () => ({ count: 0 }) },
  };
  prisma.$transaction = async (operation) => operation(prisma);
  return { prisma, calls };
}

for (const status of ['ACTIVE', 'PENDING']) {
  test(`relationship deletion is blocked while its shared space is ${status}`, async () => {
    const { prisma, calls } = createPrisma(status);
    const service = new RelationshipService(prisma);

    await assert.rejects(() => service.delete(41, 7), (error) => error.getStatus() === 400);
    assert.equal(calls.disconnected, 0);
    assert.equal(calls.deleted, 0);
  });
}

test('relationship deletion cleans a stale archived-space connection', async () => {
  const { prisma, calls } = createPrisma('ARCHIVED');
  const service = new RelationshipService(prisma);

  assert.deepEqual(await service.delete(41, 7), { id: 41, deleted: true });
  assert.equal(calls.disconnected, 1);
  assert.equal(calls.deleted, 1);
});
