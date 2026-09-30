import http from 'node:http';
import { createAgent } from './agent.mjs';
import os from 'node:os';
import { access as fileAccess, constants as fsConstants } from 'node:fs/promises';
import { isMuseProvider, museOptions, museError } from './muse.mjs';
import { readFile, stat, copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  allowedRequest,
  validateProvider,
  validateMessages,
  systemSnapshot,
  modelsFor,
  modelRequest,
} from './core.mjs';
import { createTeam } from './team.mjs';
import { createPool } from './pool.mjs';
import {
  generationSettings,
  modelCapabilities,
  modelsWithVision,
  ollamaOptions,
  usageFromEvent,
} from './generation.mjs';
import { hasImages, messagesForProvider } from './images.mjs';
import { buildSystemPrompt, prepareConversation, selectAutomaticModel } from './chat.mjs';
import { getAppIcon } from './app-icons.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.AEVORI_PORT || process.env.ORBIT_PORT || 5190);
const dev = process.argv.includes('--dev');
const version = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).version;
const teamFile =
  process.env.AEVORI_TEAM_FILE ||
  process.env.ORBIT_TEAM_FILE ||
  path.join(root, '.aevori', `team-${port}.json`);
if (!process.env.AEVORI_TEAM_FILE && !process.env.ORBIT_TEAM_FILE) {
  await mkdir(path.dirname(teamFile), { recursive: true, mode: 0o700 });
  try {
    await copyFile(path.join(root, '.orbit', `team-${port}.json`), teamFile, 1);
  } catch (error) {
    if (!['ENOENT', 'EEXIST'].includes(error.code)) throw error;
  }
}
const team = createTeam({ port, file: teamFile });
const agent = createAgent({ file: teamFile + '.agent.json' });
const reminderTimer = setInterval(() => {
  try {
    agent.deliverDue();
  } catch (error) {
    console.error('AEVORI reminder storage:', error.message);
  }
}, 1000);
reminderTimer.unref();
const vite = dev
  ? await (
      await import('vite')
    ).createServer({ root, server: { middlewareMode: true }, appType: 'spa' })
  : null;
let provider = validateProvider({ type: 'ollama', baseUrl: 'http://127.0.0.1:11434', apiKey: '' });
let snapshot = await systemSnapshot();
const pool = createPool(() => snapshot);
let collecting = false;
const timer = setInterval(async () => {
  if (collecting) return;
  collecting = true;
  try {
    snapshot = await systemSnapshot();
  } finally {
    collecting = false;
  }
}, 3000);
timer.unref();
const publicProvider = () => ({
  type: provider.type,
  baseUrl: provider.baseUrl,
  local: provider.local,
  hasKey: !!provider.apiKey,
  brand: isMuseProvider(provider) ? 'meta-muse' : null,
});
function json(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(data));
}
async function body(req) {
  const limit = ['/api/chat', '/peer/chat'].includes(req.url?.split('?')[0])
    ? 12 * 1024 ** 2
    : 1024 ** 2;
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit)
      throw new Error('Request too large. Start a new chat or use smaller attachments.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
async function api(req, res, url) {
  const access = team.gate(req);
  if (!access.allowed)
    return json(
      res,
      { error: 'Only the local app or your configured team access is allowed.' },
      403,
    );
  if (req.method === 'POST' && !req.headers['content-type']?.startsWith('application/json'))
    return json(res, { error: 'JSON required.' }, 415);
  try {
    if (url === '/api/session' && req.method === 'GET') return json(res, team.info(access));
    if (url === '/api/team/join' && req.method === 'POST' && !access.local)
      return json(res, team.join(await body(req), res));
    if (!access.actor) return json(res, { error: 'Please sign in with a valid invitation.' }, 401);
    const owner = access.actor.role === 'owner';
    if (url === '/api/health' && req.method === 'GET' && owner)
      return json(res, { app: 'AEVORI', version });
    if (
      !owner &&
      ![
        '/api/chat',
        '/api/models',
        '/api/model/options',
        '/api/pool',
        '/api/team/state',
        '/api/team/heartbeat',
        '/api/team/logout',
        '/api/profile',
        '/api/agent/state',
        '/api/agent/profile',
        '/api/agent/memory',
        '/api/agent/forget',
        '/api/agent/start',
        '/api/agent/stop',
        '/api/agent/decide',
        '/api/agent/archive',
        '/api/agent/read',
        '/api/agent/remind',
        '/api/agent/cancel-reminder',
      ].includes(url)
    )
      return json(res, { error: 'Only the host can change this setting on the main Mac.' }, 403);
    if (url === '/api/agent/read' && req.method === 'POST')
      return json(res, agent.read(access.actor, await body(req)));
    if (url === '/api/agent/remind' && req.method === 'POST')
      return json(res, agent.remind(access.actor, await body(req)));
    if (url === '/api/agent/cancel-reminder' && req.method === 'POST')
      return json(res, agent.cancelReminder(access.actor, await body(req)));
    if (url === '/api/agent/state' && req.method === 'GET')
      return json(res, agent.state(access.actor));
    if (url === '/api/agent/profile' && req.method === 'POST')
      return json(res, agent.profile(access.actor, await body(req)));
    if (url === '/api/agent/memory' && req.method === 'POST')
      return json(res, agent.remember(access.actor, await body(req)));
    if (url === '/api/agent/forget' && req.method === 'POST')
      return json(res, agent.forget(access.actor, (await body(req)).id));
    if (url === '/api/agent/stop' && req.method === 'POST')
      return json(res, agent.stop(access.actor, (await body(req)).id));
    if (url === '/api/agent/decide' && req.method === 'POST')
      return json(res, agent.decide(access.actor, await body(req)));
    if (url === '/api/agent/archive' && req.method === 'POST') {
      const input = await body(req);
      return json(res, agent.archive(access.actor, input.id, input.archived));
    }
    if (url === '/api/agent/start' && req.method === 'POST') {
      const input = await body(req),
        local = validateProvider({ type: 'ollama', baseUrl: 'http://127.0.0.1:11434', apiKey: '' });
      const available = await modelsWithVision(local);
      const selected = selectAutomaticModel(available, {
        mode: 'general',
        memoryBytes: snapshot.memory.total,
      });
      agent.start(access.actor, input, local, selected.model.id);
      return json(res, agent.state(access.actor), 202);
    }
    if (url === '/api/profile' && req.method === 'POST')
      return json(res, team.profile(access.actor, await body(req)));
    if (url === '/api/team/state' && req.method === 'GET')
      return json(res, team.state(access.actor));
    if (url === '/api/team/heartbeat' && req.method === 'POST')
      return json(res, team.heartbeat(access.actor));
    if (url === '/api/team/configure' && req.method === 'POST')
      return json(res, team.configure(await body(req)));
    if (url === '/api/team/invite' && req.method === 'POST')
      return json(res, team.invite(await body(req)));
    if (url === '/api/team/revoke' && req.method === 'POST') {
      const { id } = await body(req);
      const result = team.revoke(id);
      agent.stopAll({ id });
      return json(res, result);
    }
    if (url === '/api/team/logout' && req.method === 'POST')
      return json(res, team.logout(req, res));
    if (url.startsWith('/api/app-icon/') && req.method === 'GET') {
      const icon = getAppIcon(url.slice('/api/app-icon/'.length));
      if (!icon) return json(res, { error: 'No app icon available.' }, 404);
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      });
      return res.end(icon);
    }
    if (url === '/api/system' && req.method === 'GET') return json(res, snapshot);
    if (url === '/api/pool' && req.method === 'GET') {
      const state = await pool.list();
      return json(
        res,
        owner
          ? state
          : {
              sharing: false,
              nodes: state.nodes.map(({ baseUrl, error, ...n }) => ({ ...n, error: '' })),
            },
      );
    }
    if (url === '/api/pool/add' && req.method === 'POST')
      return json(res, await pool.add(await body(req)));
    if (url === '/api/pool/update' && req.method === 'POST')
      return json(res, pool.update(await body(req)));
    if (url === '/api/pool/share' && req.method === 'POST') {
      const input = await body(req);
      if (typeof input.enable !== 'boolean') throw new Error('Sharing is not enabled.');
      return json(res, pool.share(input.enable));
    }
    if (url === '/api/muse/status' && req.method === 'GET') {
      let cliInstalled = false;
      try {
        await fileAccess(path.join(os.homedir(), '.local/bin/muse'), fsConstants.X_OK);
        cliInstalled = true;
      } catch {}
      return json(res, { cliInstalled });
    }
    if (url === '/api/provider' && req.method === 'GET') return json(res, publicProvider());
    if (url === '/api/provider' && req.method === 'POST') {
      const input = await body(req);
      const candidate = validateProvider(input);
      const models = await modelsWithVision(candidate);
      provider = candidate;
      return json(res, { provider: publicProvider(), models });
    }
    if (url === '/api/model/options' && req.method === 'POST') {
      const input = await body(req);
      if (typeof input.model !== 'string' || input.model.length > 200)
        throw new Error('Invalid model.');
      return json(res, await modelCapabilities(provider, input.model));
    }
    if (url === '/api/models/install' && req.method === 'POST') {
      if (provider.type !== 'ollama' || !provider.local)
        throw new Error('Installation requires local Ollama.');
      const input = await body(req);
      if (
        typeof input.model !== 'string' ||
        input.model.length > 120 ||
        !/^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/.test(input.model)
      )
        throw new Error('Enter a valid Ollama model name.');
      const controller = new AbortController();
      res.on('close', () => controller.abort());
      const r = await modelRequest(provider, '/api/pull', {
        method: 'POST',
        body: JSON.stringify({ model: input.model, stream: true }),
        signal: controller.signal,
      });
      if (!r.ok || !r.body) throw new Error('Ollama could not start the download.');
      res.writeHead(200, { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' });
      for await (const chunk of r.body) {
        if (res.destroyed) break;
        res.write(chunk);
      }
      return res.end();
    }
    if (url === '/api/models' && req.method === 'GET') {
      try {
        return json(res, {
          models: await modelsWithVision(provider),
          provider: owner
            ? publicProvider()
            : {
                type: provider.type,
                baseUrl: 'http://localhost',
                local: provider.local,
                hasKey: false,
                brand: isMuseProvider(provider) ? 'meta-muse' : null,
              },
          connected: true,
        });
      } catch (error) {
        return json(res, {
          models: [],
          provider: owner
            ? publicProvider()
            : {
                type: provider.type,
                baseUrl: 'http://localhost',
                local: provider.local,
                hasKey: false,
                brand: isMuseProvider(provider) ? 'meta-muse' : null,
              },
          connected: false,
          error: error.message,
        });
      }
    }
    if (url === '/api/chat' && req.method === 'POST') {
      const activeProvider = { ...provider };
      const input = await body(req);
      const messages = validateMessages(input.messages);
      if (typeof input.model !== 'string' || !input.model || input.model.length > 200)
        throw new Error('Please choose a model first.');
      const controller = new AbortController();
      res.on('close', () => controller.abort());
      const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(180000)]);
      const context =
        owner && input.context === true
          ? `Current readings (read only): ${JSON.stringify({ hardware: snapshot.hardware, cpuPercent: snapshot.cpu, memory: snapshot.memory, disk: snapshot.disk, uptime: snapshot.uptime, at: snapshot.at })}`
          : 'No system readings were shared.';
      const settings = generationSettings(input);
      let chosenModel = input.model,
        selectionReason = '';
      if (input.model === '__auto__' && !input.usePool) {
        const choice = selectAutomaticModel(await modelsWithVision(activeProvider), {
          images: hasImages(messages),
          mode: settings.mode,
          memoryBytes: activeProvider.local ? snapshot.memory.total : undefined,
        });
        chosenModel = choice.model.id;
        selectionReason = choice.reason;
      }
      const capabilities = input.usePool
        ? {}
        : await modelCapabilities(activeProvider, chosenModel);
      if (
        hasImages(messages) &&
        !input.usePool &&
        activeProvider.type === 'ollama' &&
        capabilities.vision !== true
      )
        throw new Error('This model cannot read images. Choose a vision model or Automatic.');
      settings.contextLength = isMuseProvider(activeProvider)
        ? 32768
        : Math.min(
            capabilities.contextLength || 8192,
            snapshot.memory.total >= 24 * 1024 ** 3 ? 16384 : 8192,
          );
      const prepared = prepareConversation(messages, {
        contextLength: settings.contextLength,
        outputTokens: settings.maxTokens,
      });
      const memoryContext =
        activeProvider.local && !input.usePool ? agent.context(access.actor) : '';
      const instructions = buildSystemPrompt({
        mode: settings.mode,
        length: settings.length,
        context,
        historyNote: [prepared.historyNote, memoryContext].filter(Boolean).join('\n\n'),
      });
      const started = Date.now();
      let usage = null;
      const payload = {
        model: chosenModel,
        messages: [{ role: 'system', content: instructions }, ...prepared.messages],
        stream: true,
        ...(activeProvider.type === 'ollama'
          ? {
              ...(!input.usePool ? await ollamaOptions(activeProvider, chosenModel, settings) : {}),
              keep_alive: '5m',
            }
          : isMuseProvider(activeProvider)
            ? museOptions(chosenModel, settings)
            : {
                max_tokens: settings.maxTokens,
                temperature: settings.temperature,
                stream_options: { include_usage: true },
              }),
      };
      const job = team.begin(access.actor, chosenModel, () => controller.abort());
      let outcome = 'error';
      res.writeHead(200, {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      });
      res.flushHeaders();
      const send = (data) => {
        if (!res.destroyed) res.write(JSON.stringify(data) + '\n');
      };
      let allocation;
      try {
        send({
          selection: { model: chosenModel, reason: selectionReason },
          context: prepared.info,
        });
        send({
          status:
            input.usePool === true ? 'Connecting an available Mac…' : 'Connecting to the model…',
          phase: 'connecting',
        });
        if (input.usePool === true)
          allocation = await pool.open(input.model, payload.messages, signal, settings);
        const upstream = allocation
          ? allocation.response
          : await modelRequest(
              activeProvider,
              activeProvider.type === 'ollama' ? '/api/chat' : '/chat/completions',
              {
                method: 'POST',
                body: JSON.stringify({
                  ...payload,
                  messages: messagesForProvider(payload.messages, activeProvider.type),
                }),
                signal,
              },
            );
        if (!upstream.ok || !upstream.body)
          throw new Error(
            isMuseProvider(activeProvider)
              ? museError(upstream.status)
              : `Model responded with ${upstream.status}. Please check the connection and model.`,
          );
        if (allocation) {
          send({ assigned: allocation.assignment });
          team.assigned(job, allocation.assignment.name, allocation.assignment.model);
        } else
          team.assigned(
            job,
            activeProvider.local
              ? snapshot.hardware.name
              : isMuseProvider(activeProvider)
                ? 'Meta Cloud'
                : 'API provider',
            chosenModel,
          );
        send({ status: 'Preparing the response…', phase: 'preparing' });
        let buffer = '',
          text = '',
          thinkingReported = false,
          finishReason = null,
          upstreamDone = false;
        const decoder = new TextDecoder();
        const consume = (line) => {
          line = line.trim();
          if (line === 'data: [DONE]') {
            upstreamDone = true;
            return;
          }
          if (!line || line.startsWith(':')) return;
          if (!allocation && activeProvider.type === 'compatible') {
            if (!line.startsWith('data:')) return;
            line = line.slice(5).trim();
          }
          const event = JSON.parse(line);
          if (event.error)
            throw new Error(
              typeof event.error === 'string' ? event.error : 'The provider stopped the response.',
            );
          usage = usageFromEvent(event) || usage;
          if (event.done === true || event.choices?.[0]?.finish_reason) upstreamDone = true;
          finishReason = event.done_reason || event.choices?.[0]?.finish_reason || finishReason;
          if (
            !text &&
            !thinkingReported &&
            (event.message?.thinking || event.choices?.[0]?.delta?.reasoning_content)
          ) {
            thinkingReported = true;
            send({ status: 'Model is thinking…', phase: 'thinking' });
          }
          const delta =
            allocation || activeProvider.type === 'ollama'
              ? event.message?.content
              : event.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta) {
            if (!text) send({ status: 'Writing the response…', phase: 'writing' });
            text += delta;
            send({ delta });
          }
        };
        for await (const chunk of upstream.body) {
          buffer += decoder.decode(chunk, { stream: true });
          let i;
          while ((i = buffer.indexOf('\n')) >= 0) {
            consume(buffer.slice(0, i));
            buffer = buffer.slice(i + 1);
          }
        }
        buffer += decoder.decode();
        if (buffer.trim()) consume(buffer);
        if (!upstreamDone)
          throw new Error(
            'The connection to the model was interrupted before completion. Please try again.',
          );
        if (!text) send({ error: 'The model did not return a text response. Please try again.' });
        else {
          outcome = 'done';
          send({ done: true, finishReason, usage: { ...usage, durationMs: Date.now() - started } });
        }
      } catch (error) {
        if (!controller.signal.aborted)
          send({
            error:
              error.name === 'TimeoutError'
                ? 'The response took too long. Please try again.'
                : error.message,
          });
      } finally {
        allocation?.release();
        team.finish(job, usage, controller.signal.aborted ? 'stopped' : outcome);
      }
      return res.end();
    }
    return json(res, { error: 'Not found.' }, 404);
  } catch (error) {
    if (!res.headersSent)
      json(
        res,
        {
          error:
            error.name === 'TimeoutError'
              ? 'The provider is unavailable. Check the address and that its server is running.'
              : error.message || 'Connection failed.',
        },
        400,
      );
    else res.end();
  }
}
const server = http.createServer(async (req, res) => {
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
  );
  res.setHeader('Referrer-Policy', 'no-referrer');
  const url = req.url?.split('?')[0] || '/';
  if (url.startsWith('/peer/')) {
    if (
      req.headers.origin ||
      req.headers['sec-fetch-site'] === 'cross-site' ||
      !pool.authorized(req)
    )
      return json(res, { error: 'Connection key required.' }, 401);
    try {
      if (url === '/peer/health' && req.method === 'GET') return json(res, await pool.health());
      if (
        url === '/peer/chat' &&
        req.method === 'POST' &&
        req.headers['content-type']?.startsWith('application/json')
      ) {
        const controller = new AbortController();
        res.on('close', () => controller.abort());
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(180000)]);
        const { response, release } = await pool.peerChat(await body(req), signal);
        try {
          if (!response.ok || !response.body)
            return json(res, { error: 'Local model unavailable.' }, 502);
          res.writeHead(200, {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-store',
          });
          for await (const chunk of response.body) {
            if (res.destroyed) break;
            res.write(chunk);
          }
          return res.end();
        } finally {
          release();
        }
      }
      return json(res, { error: 'Not found.' }, 404);
    } catch {
      if (!res.headersSent)
        return json(res, { error: 'This Mac could not handle the request.' }, 502);
      return res.end();
    }
  }
  if (url.startsWith('/api/')) return api(req, res, url);
  if (vite) return vite.middlewares(req, res);
  try {
    const relative = decodeURIComponent(url);
    let target = path.resolve(root, 'dist', '.' + relative);
    if (!target.startsWith(path.join(root, 'dist') + path.sep))
      target = path.join(root, 'dist', 'index.html');
    try {
      if (!(await stat(target)).isFile()) target = path.join(root, 'dist', 'index.html');
    } catch {
      target = path.join(root, 'dist', 'index.html');
    }
    const mime =
      {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.json': 'application/json',
        '.webmanifest': 'application/manifest+json',
        '.ico': 'image/x-icon',
      }[path.extname(target)] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': mime,
      'X-Content-Type-Options': 'nosniff',
      ...(url === '/sw.js' ? { 'Cache-Control': 'no-cache', 'Service-Worker-Allowed': '/' } : {}),
    });
    res.end(await readFile(target));
  } catch {
    res.writeHead(500);
    res.end('Please run npm run build first.');
  }
});
server.listen(port, '127.0.0.1', () =>
  console.log(`Aevori is running locally: http://localhost:${port}`),
);
process.on('SIGINT', () => {
  clearInterval(timer);
  clearInterval(reminderTimer);
  server.close();
  vite?.close();
  process.exit(0);
});
