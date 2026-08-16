const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, readFile, rm } = require('fs/promises');
const { join } = require('path');
const { tmpdir } = require('os');
const { UploadStorageService } = require('../dist/upload/upload-storage');

test('upload storage deletes local capability URLs but ignores external images', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'relationship-upload-test-'));
  const previousDir = process.env.UPLOAD_DIR;
  const previousBaseUrl = process.env.PUBLIC_BASE_URL;
  process.env.UPLOAD_DIR = directory;
  process.env.PUBLIC_BASE_URL = 'https://yumt.cn';
  const storage = new UploadStorageService();
  const filename = await storage.saveImage(Buffer.from('image'), 'image/png');
  const path = join(directory, filename);
  assert.equal((await readFile(path)).toString(), 'image');

  await storage.deleteByUrl(`https://evil.example/api/upload/image/${filename}`);
  assert.equal((await readFile(path)).toString(), 'image');
  await storage.deleteByUrl(`https://yumt.cn/api/upload/image/${filename}`);
  await assert.rejects(() => readFile(path), (error) => error.code === 'ENOENT');
  await storage.deleteByUrl('https://example.com/unrelated.png');

  await rm(directory, { recursive: true, force: true });
  if (previousDir === undefined) delete process.env.UPLOAD_DIR;
  else process.env.UPLOAD_DIR = previousDir;
  if (previousBaseUrl === undefined) delete process.env.PUBLIC_BASE_URL;
  else process.env.PUBLIC_BASE_URL = previousBaseUrl;
});
