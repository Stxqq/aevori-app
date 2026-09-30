import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProvider, modelsFor, modelRequest } from '../server/core.mjs';
import { generationSettings, modelCapabilities } from '../server/generation.mjs';
import { MUSE_BASE_URL, isMuseProvider, museOptions } from '../server/muse.mjs';
import { selectAutomaticModel } from '../server/chat.mjs';
import { messagesForProvider } from '../server/images.mjs';
const provider = () =>
  validateProvider({
    type: 'compatible',
    baseUrl: MUSE_BASE_URL,
    apiKey: 'fixture-not-a-real-key',
  });

test('Muse verifies authentication against the official model catalog; only Standard chat models are selectable', async (t) => {
  let request;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    request = { url, options };
    return new Response(
      JSON.stringify({
        data: [
          { id: 'muse-image-1.0' },
          { id: 'muse-spark-1.2-contributor' },
          { id: 'muse-spark-1.1' },
          { id: 'muse-spark-1.3' },
          { id: 'muse-voice-transcribe-1.0' },
        ],
      }),
      { status: 200 },
    );
  });
  const models = await modelsFor(provider());
  assert.equal(request.url, 'https://api.meta.ai/v1/models');
  assert.equal(request.options.headers.Authorization, 'Bearer fixture-not-a-real-key');
  assert.equal(request.options.redirect, 'error');
  assert.deepEqual(
    models.map((m) => m.id),
    ['muse-spark-1.3', 'muse-spark-1.1'],
  );
  const enriched = await Promise.all(
    models.map(async (m) => ({ ...m, ...(await modelCapabilities(provider(), m.id)) })),
  );
  assert.equal(enriched[0].vision, true);
  assert.equal(selectAutomaticModel(enriched, { images: true }).model.id, 'muse-spark-1.3');
});

test('Muse rejects invalid access and unsupported/contributor models without exposing keys', async (t) => {
  assert.throws(
    () => validateProvider({ type: 'compatible', baseUrl: MUSE_BASE_URL, apiKey: ' ' }),
    /Meta API key/,
  );
  assert.equal(
    isMuseProvider({ type: 'compatible', baseUrl: 'https://api.meta.ai.evil.example/v1' }),
    false,
  );
  const mock = t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 401 }));
  await assert.rejects(modelsFor(provider()), /not accepted/);
  mock.mock.mockImplementation(
    async () => new Response(JSON.stringify({ data: [{ id: 'muse-spark-1.3-contributor' }] })),
  );
  await assert.rejects(modelsFor(provider()), /No Standard-tier Muse Spark model/);
  assert.throws(
    () => museOptions('muse-spark-1.3-contributor', generationSettings()),
    /Standard tier/,
  );
  assert.throws(
    () => museOptions('muse-spark-1.3', generationSettings({ reasoning: 'off' })),
    /reasoning levels/,
  );
});

test('Muse forwards images, documented reasoning and completion limits using the compatible chat protocol', async (t) => {
  const settings = generationSettings({ reasoning: 'high', responseLength: 'long' });
  const options = museOptions('muse-spark-1.3', settings);
  assert.equal(options.reasoning_effort, 'high');
  assert.equal(options.max_completion_tokens, 8192);
  assert.equal(options.max_tokens, undefined);
  assert.equal(options.stream_options, undefined);
  assert.equal(options.temperature, 1);
  assert.equal(museOptions('muse-spark-1.3', generationSettings()).reasoning_effort, undefined);
  const messages = messagesForProvider(
    [{ role: 'user', content: 'Describe this', images: ['data:image/png;base64,aW1hZ2U='] }],
    'compatible',
  );
  assert.equal(messages[0].content[1].image_url.url, 'data:image/png;base64,aW1hZ2U=');
  t.mock.method(globalThis, 'fetch', async (url, request) => {
    assert.equal(url, MUSE_BASE_URL + '/chat/completions');
    const payload = JSON.parse(request.body);
    assert.equal(payload.messages[0].content[1].type, 'image_url');
    assert.equal(payload.reasoning_effort, 'high');
    return new Response(
      'data: {"choices":[{"delta":{"content":"Fixture response"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
    );
  });
  const response = await modelRequest(provider(), '/chat/completions', {
    method: 'POST',
    body: JSON.stringify({ model: 'muse-spark-1.3', messages, stream: true, ...options }),
  });
  assert.match(await response.text(), /Fixture response/);
});
