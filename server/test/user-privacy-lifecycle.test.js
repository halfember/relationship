const test = require('node:test');
const assert = require('node:assert/strict');
const { ValidationPipe } = require('@nestjs/common');
const { UserService } = require('../dist/user/user.service');
const { UpdateUserDto } = require('../dist/user/dto/update-user.dto');

test('profile updates reject client-supplied VIP levels', async () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  await assert.rejects(
    () => pipe.transform({ vipLevel: 5 }, { type: 'body', metatype: UpdateUserDto }),
    (error) => error.getStatus() === 400,
  );
});

test('account deletion removes contact state and all collected local images', async () => {
  const deletes = [];
  const deletedFiles = [];
  const deletion = (name) => async (args) => { deletes.push({ name, args }); return { count: 1 }; };
  const prisma = {
    user: {
      findUnique: async () => ({ id: 7, avatar: '/api/upload/image/user.jpg' }),
      delete: deletion('user'),
    },
    sharedSpace: {
      count: async () => 0,
      findMany: async () => [{ id: 80, memories: [{ imageUrl: '/api/upload/image/archived.jpg' }] }],
      deleteMany: deletion('sharedSpace'),
    },
    spaceMember: { count: async () => 0, deleteMany: deletion('spaceMember') },
    sharedEvent: { findMany: async () => [{ id: 2 }], deleteMany: deletion('sharedEvent') },
    relationship: {
      findMany: async () => [{ avatar: '/api/upload/image/contact.jpg', memories: [{ imageUrl: '/api/upload/image/private.jpg' }] }],
    },
    sharedMemory: {
      findMany: async () => [{ imageUrl: '/api/upload/image/shared.jpg' }],
      deleteMany: deletion('sharedMemory'),
    },
    reminder: { deleteMany: deletion('reminder') },
    contactConnection: { deleteMany: deletion('contactConnection') },
    contactInvite: { deleteMany: deletion('contactInvite') },
    spaceInvite: { deleteMany: deletion('spaceInvite') },
    sharedAccess: { deleteMany: deletion('sharedAccess') },
    shareToken: { deleteMany: deletion('shareToken') },
    aiRecord: { deleteMany: deletion('aiRecord') },
  };
  prisma.$transaction = async (operations) => Promise.all(operations);
  const storage = { deleteManyByUrls: async (urls) => { deletedFiles.push(...urls); } };

  await new UserService(prisma, storage).deleteAccount(7);

  assert.ok(deletes.some((item) => item.name === 'contactConnection'));
  assert.ok(deletes.some((item) => item.name === 'contactInvite'));
  assert.ok(deletes.some((item) => item.name === 'spaceInvite'));
  assert.deepEqual(new Set(deletedFiles), new Set([
    '/api/upload/image/user.jpg',
    '/api/upload/image/contact.jpg',
    '/api/upload/image/private.jpg',
    '/api/upload/image/shared.jpg',
    '/api/upload/image/archived.jpg',
  ]));
});
