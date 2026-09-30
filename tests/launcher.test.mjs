import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

async function launch(port) {
  const child = spawn(process.execPath, ['scripts/launch.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, AEVORI_NO_OPEN: '1', AEVORI_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (data) => (output += data));
  child.stderr.on('data', (data) => (output += data));
  const [code] = await once(child, 'exit');
  return { code, output };
}
test('Web launcher rejects invalid ports and does not claim an unrelated service', async () => {
  const invalid = await launch(12);
  assert.equal(invalid.code, 1);
  assert.match(invalid.output, /1024/);
  const server = http.createServer((req, res) => res.end('A different app'));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const result = await launch(server.address().port);
    assert.equal(result.code, 1);
    assert.match(result.output, /in use/);
  } finally {
    server.closeAllConnections();
    server.close();
  }
});
test('Web launcher reuses an existing AEVORI service without starting a second server', async () => {
  let path = '';
  const server = http.createServer((req, res) => {
    path = req.url;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ app: 'AEVORI', version: '0.2.0' }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const result = await launch(server.address().port);
    assert.equal(result.code, 0);
    assert.match(result.output, /already running/);
    assert.equal(path, '/api/health');
  } finally {
    server.closeAllConnections();
    server.close();
  }
});
