const test = require('node:test');
const assert = require('node:assert/strict');
const { VoiceService } = require('../dist/voice/voice.service');

const audioFile = {
  originalname: 'recording.mp3',
  size: 4,
  mimetype: 'audio/mpeg',
  buffer: Buffer.from([1, 2, 3, 4]),
};

test('voice transcription without an API key fails and stores no fake record', async () => {
  const previousKey = process.env.AI_API_KEY;
  delete process.env.AI_API_KEY;
  let records = 0;
  const service = new VoiceService({ aiRecord: { create: async () => { records += 1; } } });

  await assert.rejects(() => service.transcribe(audioFile, 7), (error) => error.getStatus() === 503);
  assert.equal(records, 0);
  if (previousKey === undefined) delete process.env.AI_API_KEY;
  else process.env.AI_API_KEY = previousKey;
});

test('voice transcription maps upstream failure to 502 and stores no record', async () => {
  const previousKey = process.env.AI_API_KEY;
  const previousFetch = global.fetch;
  process.env.AI_API_KEY = 'test-key';
  global.fetch = async () => ({ ok: false, json: async () => ({ error: { message: 'failed' } }) });
  let records = 0;
  const service = new VoiceService({ aiRecord: { create: async () => { records += 1; } } });

  await assert.rejects(() => service.transcribe(audioFile, 7), (error) => error.getStatus() === 502);
  assert.equal(records, 0);
  global.fetch = previousFetch;
  if (previousKey === undefined) delete process.env.AI_API_KEY;
  else process.env.AI_API_KEY = previousKey;
});

test('voice transcription stores only a non-empty upstream transcript', async () => {
  const previousKey = process.env.AI_API_KEY;
  const previousFetch = global.fetch;
  process.env.AI_API_KEY = 'test-key';
  global.fetch = async () => ({ ok: true, json: async () => ({ text: ' real transcript ' }) });
  const records = [];
  const service = new VoiceService({ aiRecord: { create: async ({ data }) => { records.push(data); } } });

  assert.deepEqual(await service.transcribe(audioFile, 7), { text: 'real transcript' });
  assert.equal(records.length, 1);
  assert.equal(records[0].result, 'real transcript');
  global.fetch = previousFetch;
  if (previousKey === undefined) delete process.env.AI_API_KEY;
  else process.env.AI_API_KEY = previousKey;
});
