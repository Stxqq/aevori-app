import { spawn, execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error('AEVORI requires Node.js 22.13 or newer. Download: https://nodejs.org/en/download');
  process.exit(1);
}
const port = Number(process.env.AEVORI_PORT || 5190);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error('AEVORI_PORT must be between 1024 and 65535.');
  process.exit(1);
}
const url = `http://localhost:${port}`;
const inspect = async () => {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
      signal: AbortSignal.timeout(600),
    });
    if (!response.ok) return 'occupied';
    const body = await response.json();
    return body.app === 'AEVORI' ? 'ready' : 'occupied';
  } catch (error) {
    return error.cause?.code === 'ECONNREFUSED' ? 'free' : 'occupied';
  }
};
const open = () => {
  if (process.env.AEVORI_NO_OPEN !== '1')
    execFile('open', [url], (error) => {
      if (error) console.log(`Open ${url} in your browser.`);
    });
};
const state = await inspect();
if (state === 'ready') {
  console.log(`AEVORI is already running at ${url}`);
  open();
  process.exit(0);
}
if (state === 'occupied') {
  console.error(
    `Port ${port} is in use. Close the earlier app, or set AEVORI_PORT to another port.`,
  );
  process.exit(1);
}
const dataDir = path.join(os.homedir(), 'Library', 'Application Support', 'Aevori');
const teamFile = process.env.AEVORI_TEAM_FILE || path.join(dataDir, `team-${port}.json`);
await mkdir(path.dirname(teamFile), { recursive: true, mode: 0o700 });
const child = spawn(process.execPath, ['server/index.mjs'], {
  cwd: root,
  env: { ...process.env, AEVORI_TEAM_FILE: teamFile, AEVORI_PORT: String(port) },
  stdio: 'inherit',
});
let stopped = false;
const stop = () => {
  if (stopped) return;
  stopped = true;
  child.kill('SIGINT');
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
process.once('exit', stop);
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  stopped = true;
  process.exit(code ?? 0);
});
let ready = false;
for (let attempt = 0; attempt < 60 && !stopped; attempt++) {
  await new Promise((resolve) => setTimeout(resolve, 250));
  if ((await inspect()) === 'ready') {
    ready = true;
    break;
  }
}
if (ready) {
  console.log(
    `\nAEVORI — Intelligence, locally.\n${url}\nKeep this window open. Press Control+C to stop.\n`,
  );
  open();
} else {
  console.error('AEVORI could not start. See the message above.');
  process.exitCode = 1;
  stop();
}
