const test = require('node:test');
const assert = require('node:assert/strict');
const { SpaceService } = require('../dist/space/space.service');

test('leaving a pair space clears the contact connection space binding', async () => {
  const connectionUpdates = [];
  const prisma = {
    spaceMember: {
      findFirst: async () => ({
        id: 2,
        role: 'MEMBER',
        space: { id: 50, type: 'PAIR', status: 'ACTIVE' },
      }),
      updateMany: async () => ({ count: 2 }),
    },
    sharedSpace: { update: async () => ({ id: 50, status: 'ARCHIVED' }) },
    relationship: { updateMany: async () => ({ count: 2 }) },
    contactConnection: {
      updateMany: async (args) => {
        connectionUpdates.push(args);
        return { count: 1 };
      },
    },
    reminder: { deleteMany: async () => ({ count: 1 }) },
    spaceInvite: { updateMany: async () => ({ count: 1 }) },
  };
  prisma.$transaction = async (operation) => operation(prisma);
  const service = new SpaceService(prisma);

  await service.leaveSpace(50, 7);

  assert.deepEqual(connectionUpdates, [{
    where: { sharedSpaceId: 50 },
    data: { sharedSpaceId: null },
  }]);
});
