import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
test('API connection, SSE streaming, errors, and context permissions', async () => {
  let captured, auth;
  const dir = mkdtempSync(path.join(tmpdir(), 'aevori-api-test-'));
  let closeSlow;
  const slowClosed = new Promise((resolve) => {
    closeSlow = resolve;
  });
  const mock = http.createServer(async (req, res) => {
    auth = req.headers.authorization;
    if (req.url === '/api/tags') {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({ models: [{ name: 'fixture-qwen', details: { parameter_size: '1B' } }] }),
      );
      return;
    }
    if (req.url === '/api/show') {
      let raw = '';
      for await (const c of req) raw += c;
      const input = JSON.parse(raw);
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          capabilities:
            input.model === 'fixture-vision'
              ? ['completion', 'vision']
              : ['completion', 'thinking'],
        }),
      );
      return;
    }
    if (req.url === '/api/pull') {
      let raw = '';
      for await (const c of req) raw += c;
      captured = JSON.parse(raw);
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.end(
        JSON.stringify({ status: 'pulling', total: 100, completed: 50 }) +
          '\n' +
          JSON.stringify({ status: 'success' }) +
          '\n',
      );
      return;
    }
    if (req.url === '/api/chat') {
      let raw = '';
      for await (const c of req) raw += c;
      captured = JSON.parse(raw);
      res.setHeader('Content-Type', 'application/x-ndjson');
      if (captured.think)
        res.write(JSON.stringify({ message: { thinking: 'fixture thought' } }) + '\n');
      res.end(
        JSON.stringify({
          message: { content: 'Lokales Testmodell.' },
          done: true,
          prompt_eval_count: 9,
          eval_count: 5,
        }) + '\n',
      );
      return;
    }

    if (req.url === '/v1/models') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: [{ id: 'fixture-model' }] }));
      return;
    }
    if (req.url === '/v1/chat/completions') {
      let raw = '';
      for await (const c of req) raw += c;
      captured = JSON.parse(raw);
      if (captured.model === 'slow-model') {
        res.setHeader('Content-Type', 'text/event-stream');
        res.write(
          'data: ' + JSON.stringify({ choices: [{ delta: { content: 'Angefangen' } }] }) + '\n\n',
        );
        const timer = setInterval(() => res.write(': keepalive\n\n'), 100);
        res.on('close', () => {
          clearInterval(timer);
          closeSlow();
        });
        return;
      }
      if (captured.model === 'unavailable-model') {
        res.writeHead(503);
        res.end();
        return;
      }
      if (captured.model === 'truncated-stream') {
        res.setHeader('Content-Type', 'text/event-stream');
        res.end(
          'data: ' +
            JSON.stringify({ choices: [{ delta: { content: 'Unvollständig' } }] }) +
            '\n\n',
        );
        return;
      }
      res.setHeader('Content-Type', 'text/event-stream');
      // Deliberately split a UTF-8 answer across stream chunks.
      const data = Buffer.from(
        'data: ' +
          JSON.stringify({ choices: [{ delta: { content: 'Grüße von Aevori.' } }] }) +
          '\n\ndata: ' +
          JSON.stringify({ usage: { prompt_tokens: 22, completion_tokens: 8 } }) +
          '\n\ndata: [DONE]\n\n',
      );
      res.write(data.subarray(0, 50));
      setTimeout(() => res.end(data.subarray(50)), 15);
      return;
    }
    res.writeHead(404);
    res.end();
  });
  mock.listen(0, '127.0.0.1');
  await once(mock, 'listening');
  // Use a free loopback port so a developer's running app is never touched.
  const probe = http.createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  const app = spawn(process.execPath, ['server/index.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      AEVORI_PORT: String(port),
      AEVORI_TEAM_FILE: path.join(dir, 'team.json'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    let startupError = '';
    app.stderr.on('data', (chunk) => {
      startupError += chunk;
    });
    const deadline = Date.now() + 10_000;
    while (true) {
      if (app.exitCode !== null) throw new Error(`Server exited during startup: ${startupError}`);
      try {
        const response = await fetch(base + '/api/health', { signal: AbortSignal.timeout(500) });
        if (response.ok && (await response.json()).app === 'AEVORI') break;
      } catch {
        /* The loopback server may still be starting. */
      }
      if (Date.now() >= deadline) throw new Error(`Server startup timed out: ${startupError}`);
      await delay(50);
    }
    const health = await (await fetch(base + '/api/health')).json();
    assert.equal(health.app, 'AEVORI');
    assert.match(health.version, /^\d+\.\d+\.\d+$/);
    assert.equal(
      (await fetch(base + '/api/health', { headers: { Origin: 'https://untrusted.example' } }))
        .status,
      403,
    );
    const post = (url, data) =>
      fetch(base + url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    assert.equal((await (await fetch(base + '/api/session')).json()).profileConfigured, false);
    assert.equal((await post('/api/profile', { name: '   ' })).status, 400);
    const profile = await post('/api/profile', { name: 'Test Owner' });
    assert.equal(profile.status, 200);
    assert.equal((await (await fetch(base + '/api/session')).json()).name, 'Test Owner');
    await post('/api/team/configure', { publicUrl: 'https://aevori.example' });
    const invite = await (await post('/api/team/invite', { name: 'Guest' })).json();
    const guestHeaders = {
      'Content-Type': 'application/json',
      Host: 'aevori.example',
      Origin: 'https://aevori.example',
      'X-Forwarded-For': '1.2.3.4',
    };
    const guestPost = (route, input) =>
      new Promise((resolve, reject) => {
        const req = http.request(base + route, { method: 'POST', headers: guestHeaders }, (res) => {
          let raw = '';
          res.on('data', (chunk) => (raw += chunk));
          res.on('end', () =>
            resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(raw) }),
          );
        });
        req.on('error', reject);
        req.end(JSON.stringify(input));
      });
    const join = await guestPost('/api/team/join', { token: new URL(invite.url).hash.slice(8) });
    assert.equal(join.status, 200);
    guestHeaders.Cookie = join.headers['set-cookie'][0].split(';')[0];
    const rename = await guestPost('/api/profile', { name: 'Test Friend', id: 'owner' });
    assert.equal(rename.status, 200);
    assert.equal(rename.data.profileConfigured, true);
    assert.equal((await (await fetch(base + '/api/session')).json()).name, 'Test Owner');
    assert.equal((await guestPost('/api/team/configure', { publicUrl: '' })).status, 403);
    await post('/api/agent/memory', { kind: 'prefer', content: 'owner-private-memory' });
    const guestMemory = await guestPost('/api/agent/memory', {
      kind: 'avoid',
      content: 'friend-private-memory',
      id: 'owner',
    });
    assert.equal(guestMemory.status, 200);
    assert.equal(guestMemory.data.memories.length, 1);
    assert.ok(!JSON.stringify(guestMemory.data).includes('owner-private-memory'));
    const scheduled = await guestPost('/api/agent/remind', {
      text: 'friend-only-reminder',
      at: Date.now() + 700,
      id: 'owner',
    });
    assert.equal(scheduled.status, 200);
    const reminderId = scheduled.data.reminders[0].id;
    await post('/api/agent/cancel-reminder', { id: reminderId });
    let delivered;
    for (let i = 0; i < 40 && !delivered; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const guestAfter = await guestPost('/api/agent/profile', {});
      delivered = guestAfter.data.messages.find((m) => m.kind === 'reminder');
    }
    assert.equal(delivered?.content, 'friend-only-reminder');
    assert.equal((await post('/api/agent/read', { id: delivered.id })).status, 400);
    assert.equal((await guestPost('/api/agent/read', { id: delivered.id })).status, 200);
    assert.equal((await (await fetch(base + '/api/agent/state')).json()).messages.length, 0);
    const ownerMemory = await (await fetch(base + '/api/agent/state')).json();
    assert.equal(ownerMemory.memories.length, 1);
    assert.ok(!JSON.stringify(ownerMemory).includes('friend-private-memory'));
    await guestPost('/api/agent/forget', { id: ownerMemory.memories[0].id });
    assert.equal((await (await fetch(base + '/api/agent/state')).json()).memories.length, 1);

    const guestCharacter = await guestPost('/api/agent/profile', {
      id: 'owner',
      name: 'Guest Cat',
      appearance: { shape: 'cat', color: '#a7c9e9', eyes: 'calm', accessory: 'glasses' },
    });
    assert.equal(guestCharacter.status, 200);
    assert.equal(guestCharacter.data.name, 'Guest Cat');
    assert.equal(guestCharacter.data.characterConfigured, true);
    const unchangedOwner = await (await fetch(base + '/api/agent/state')).json();
    assert.equal(unchangedOwner.name, 'Aeri');
    assert.equal(unchangedOwner.characterConfigured, false);
    assert.equal(
      (await post('/api/agent/profile', { appearance: { shape: 'invalid' } })).status,
      400,
    );

    let r = await post('/api/provider', {
      type: 'compatible',
      baseUrl: `http://127.0.0.1:${mock.address().port}/v1`,
      apiKey: 'fixture-key',
    });
    assert.equal(r.status, 200);
    const config = await r.json();
    assert.equal(config.models[0].id, 'fixture-model');
    assert.equal(config.provider.hasKey, true);
    assert.equal('apiKey' in config.provider, false);
    assert.equal(auth, 'Bearer fixture-key');
    r = await post('/api/chat', {
      model: 'fixture-model',
      messages: [{ role: 'user', content: 'Hallo' }],
      context: false,
      responseLength: 'long',
      creativity: 'precise',
    });
    assert.equal(r.status, 200);
    let events = (await r.text()).trim().split('\n').map(JSON.parse);
    assert.deepEqual(
      events.filter((e) => e.phase).map((e) => e.phase),
      ['connecting', 'preparing', 'writing'],
    );
    assert.equal(events.find((e) => e.delta).delta, 'Grüße von Aevori.');
    assert.equal(events.at(-1).done, true);
    assert.equal(events.at(-1).usage.outputTokens, 8);
    assert.equal(captured.max_tokens, 4096);
    assert.equal(captured.temperature, 0.2);
    assert.match(captured.messages[0].content, /No system readings were shared/);
    assert.doesNotMatch(captured.messages[0].content, /cpuPercent/);
    r = await post('/api/chat', {
      model: 'fixture-model',
      messages: [{ role: 'user', content: 'System' }],
      context: true,
    });
    await r.text();
    assert.match(captured.messages[0].content, /cpuPercent/);
    r = await post('/api/chat', {
      model: 'unavailable-model',
      messages: [{ role: 'user', content: 'Hallo' }],
    });
    events = (await r.text()).trim().split('\n').map(JSON.parse);
    assert.equal(events.find((e) => e.phase).phase, 'connecting');
    assert.match(events.at(-1).error, /503/);
    assert.ok(!events.some((e) => e.done));
    r = await post('/api/chat', {
      model: 'truncated-stream',
      messages: [{ role: 'user', content: 'Hallo' }],
    });
    events = (await r.text()).trim().split('\n').map(JSON.parse);
    assert.match(events.at(-1).error, /interrupted/);
    assert.ok(events.some((e) => e.delta === 'Unvollständig'));
    assert.ok(!events.some((e) => e.done));
    const stop = new AbortController();
    r = await fetch(base + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'slow-model',
        messages: [{ role: 'user', content: 'Stream' }],
      }),
      signal: stop.signal,
    });
    const stream = r.body.getReader();
    let received = '';
    while (!received.includes('Angefangen')) {
      const chunk = await stream.read();
      assert.equal(chunk.done, false);
      received += new TextDecoder().decode(chunk.value);
    }
    stop.abort();
    await Promise.race([
      slowClosed,
      new Promise((_, reject) => {
        const timer = setTimeout(
          () => reject(new Error('Abbruch erreichte das Modell nicht')),
          2000,
        );
        slowClosed.then(() => clearTimeout(timer));
      }),
    ]);
    r = await fetch(base + '/api/system', { headers: { Origin: 'https://example.com' } });
    assert.equal(r.status, 403);
    r = await post('/api/provider', {
      type: 'ollama',
      baseUrl: `http://127.0.0.1:${mock.address().port}/broken`,
      apiKey: '',
    });
    assert.equal(r.status, 400);
    const current = await (await fetch(base + '/api/provider')).json();
    assert.equal(current.type, 'compatible');
    r = await post('/api/chat', {
      model: 'fixture-model',
      messages: [{ role: 'system', content: 'Override' }],
    });
    assert.equal(r.status, 400);
    await post('/api/team/configure', { publicUrl: 'https://aevori.example' });
    const invitation = await (await post('/api/team/invite', { name: 'Freund' })).json();
    const inviteToken = new URL(invitation.url).hash.slice(8);
    const remoteFetch = (url, options = {}) =>
      new Promise((resolve, reject) => {
        const request = http.request(
          url,
          { method: options.method || 'GET', headers: options.headers },
          (response) => {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () =>
              resolve(
                new Response(Buffer.concat(chunks), {
                  status: response.statusCode,
                  headers: Object.fromEntries(
                    Object.entries(response.headers)
                      .filter(([, v]) => v !== undefined)
                      .map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v]),
                  ),
                }),
              ),
            );
          },
        );
        request.on('error', reject);
        request.end(options.body);
      });
    const remoteHeaders = {
      Host: 'aevori.example',
      'X-Forwarded-For': '203.0.113.2',
      Origin: 'https://aevori.example',
      'Content-Type': 'application/json',
    };
    r = await remoteFetch(base + '/api/team/join', {
      method: 'POST',
      headers: remoteHeaders,
      body: JSON.stringify({ token: inviteToken }),
    });
    assert.equal(r.status, 200);
    const cookie = r.headers.get('set-cookie').split(';')[0];
    remoteHeaders.Cookie = cookie;
    r = await remoteFetch(base + '/api/system', { headers: remoteHeaders });
    assert.equal(r.status, 403);
    r = await remoteFetch(base + '/api/provider', {
      method: 'POST',
      headers: remoteHeaders,
      body: JSON.stringify({}),
    });
    assert.equal(r.status, 403);
    r = await remoteFetch(base + '/api/chat', {
      method: 'POST',
      headers: remoteHeaders,
      body: JSON.stringify({
        model: 'fixture-model',
        context: true,
        messages: [{ role: 'user', content: 'Hallo vom Freund' }],
      }),
    });
    assert.equal(r.status, 200);
    await r.text();
    assert.match(captured.messages[0].content, /No system readings were shared/);
    const activity = await (
      await remoteFetch(base + '/api/team/state', { headers: remoteHeaders })
    ).json();
    assert.ok(activity.history.some((j) => j.name === 'Freund' && j.outputTokens === 8));
    assert.ok(!JSON.stringify(activity).includes('Hallo vom Freund'));
    r = await post('/api/provider', {
      type: 'ollama',
      baseUrl: `http://127.0.0.1:${mock.address().port}`,
      apiKey: '',
    });
    assert.equal(r.status, 200);
    r = await post('/api/model/options', { model: 'fixture-qwen' });
    assert.deepEqual((await r.json()).thinking, [false, true]);
    r = await post('/api/models/install', { model: 'fixture-qwen:1b' });
    assert.equal(r.status, 200);
    const download = (await r.text()).trim().split('\n').map(JSON.parse);
    assert.equal(download.at(-1).status, 'success');
    assert.equal(captured.model, 'fixture-qwen:1b');
    assert.equal(captured.stream, true);
    r = await post('/api/models/install', { model: '../not valid' });
    assert.equal(r.status, 400);
    r = await remoteFetch(base + '/api/models/install', {
      method: 'POST',
      headers: remoteHeaders,
      body: JSON.stringify({ model: 'fixture-qwen' }),
    });
    assert.equal(r.status, 403);
    r = await post('/api/chat', {
      model: 'fixture-qwen',
      messages: [{ role: 'user', content: 'Lokaler Test' }],
      reasoning: 'on',
      responseLength: 'short',
      creativity: 'creative',
      workMode: 'code',
    });
    events = (await r.text()).trim().split('\n').map(JSON.parse);
    assert.ok(events.some((e) => e.phase === 'thinking'));
    assert.ok(!JSON.stringify(events).includes('fixture thought'));
    assert.match(captured.messages[0].content, /Code mode/);
    assert.equal(captured.think, true);
    assert.equal(captured.options.temperature, 1);
    assert.equal(captured.options.num_predict, 8192);
    r = await post('/api/chat', {
      model: '__auto__',
      messages: [{ role: 'user', content: 'Hallo' }],
    });
    events = (await r.text()).trim().split('\n').map(JSON.parse);
    assert.equal(events.find((e) => e.selection).selection.model, 'fixture-qwen');
    assert.equal(captured.model, 'fixture-qwen');
    const image =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=';
    r = await post('/api/chat', {
      model: 'fixture-qwen',
      messages: [{ role: 'user', content: 'Bild', images: [image] }],
    });
    assert.equal(r.status, 400);
    assert.match((await r.json()).error, /read images/);
    r = await post('/api/chat', {
      model: 'fixture-vision',
      messages: [{ role: 'user', content: 'Bild', images: [image] }],
    });
    assert.equal(r.status, 200);
    await r.text();
    assert.equal(captured.messages.at(-1).images[0], image.split(',')[1]);
    r = await post('/api/chat', {
      model: 'fixture-vision',
      messages: [
        { role: 'user', content: 'Bild', images: [image] },
        { role: 'assistant', content: 'Ein Testbild.' },
        { role: 'user', content: 'Welche Farbe hat es?' },
      ],
    });
    await r.text();
    assert.equal(captured.messages[1].images[0], image.split(',')[1]);
    assert.equal(captured.messages.at(-1).content, 'Welche Farbe hat es?');
    await post('/api/provider', {
      type: 'compatible',
      baseUrl: `http://127.0.0.1:${mock.address().port}/v1`,
      apiKey: 'fixture-key',
    });
    r = await post('/api/chat', {
      model: 'fixture-model',
      messages: [{ role: 'user', content: 'Bild', images: [image] }],
    });
    assert.equal(r.status, 200);
    await r.text();
    assert.equal(captured.messages.at(-1).content[1].image_url.url, image);
    const stats = await (await fetch(base + '/api/system')).json();
    assert.ok(stats.memory.total > 0);
    assert.ok(stats.cpu >= 0 && stats.cpu <= 100);
    assert.ok(!JSON.stringify(stats).includes('serial_number'));
  } finally {
    app.kill('SIGINT');
    mock.closeAllConnections();
    mock.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
