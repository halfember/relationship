const test = require('node:test');
const assert = require('node:assert/strict');
const { MemoryService } = require('../dist/memory/memory.service');

test('replacing a memory image deletes the previous local image after the database update', async () => {
  const deletedUrls = [];
  const prisma = {
    memory: {
      findFirst: async () => ({ id: 4, imageUrl: '/api/upload/image/old.jpg' }),
      update: async ({ data }) => ({ id: 4, ...data }),
    },
  };
  const storage = { deleteByUrl: async (url) => { deletedUrls.push(url); } };
  const service = new MemoryService(prisma, storage);

  await service.update(4, { imageUrl: '/api/upload/image/new.jpg' }, 7);
  assert.deepEqual(deletedUrls, ['/api/upload/image/old.jpg']);
});

test('deleting a memory deletes its local image after the database row', async () => {
  const calls = [];
  const prisma = {
    memory: {
      findFirst: async () => ({ id: 4, imageUrl: '/api/upload/image/old.jpg' }),
      delete: async () => { calls.push('database'); },
    },
  };
  const storage = { deleteByUrl: async () => { calls.push('file'); } };
  const service = new MemoryService(prisma, storage);

  await service.delete(4, 7);
  assert.deepEqual(calls, ['database', 'file']);
});
