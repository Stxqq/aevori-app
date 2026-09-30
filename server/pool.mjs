import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { validateProvider, validateMessages, modelRequest } from './core.mjs';
import {
  generationSettings,
  ollamaOptions,
  modelCapabilities,
  modelsWithVision,
} from './generation.mjs';
import { selectAutomaticModel } from './chat.mjs';
import { hasImages, messagesForProvider } from './images.mjs';
const localProvider = {
  type: 'ollama',
  baseUrl: 'http://127.0.0.1:11434',
  apiKey: '',
  local: true,
};
export function rankNodes(nodes, model, vision = false) {
  return nodes
    .filter(
      (n) =>
        n.enabled &&
        n.online &&
        n.active < 4 &&
        n.models?.some(
          (m) => (model === '__pool__' || m.id === model) && (!vision || m.vision === true),
        ),
    )
    .sort((a, b) => a.active - b.active || (a.lastUsed || 0) - (b.lastUsed || 0));
}
export function createPool(getStats) {
  const instanceId = randomUUID(),
    nodes = [];
  let shareToken = null;
  const local = {
    id: 'local',
    name: 'This Mac',
    enabled: true,
    online: false,
    models: [],
    active: 0,
    lastUsed: 0,
  };
  const summary = () => {
    const s = getStats();
    return { hardware: s.hardware, cpu: s.cpu, memory: s.memory, at: s.at };
  };
  const health = async () => ({
    aevoriNode: 1,
    orbitNode: 1,
    instanceId,
    ...summary(),
    models: await modelsWithVision(localProvider),
  });
  const inspect = async (node) => {
    const r = await fetch(node.baseUrl + '/peer/health', {
      headers: { Authorization: `Bearer ${node.token}` },
      signal: AbortSignal.timeout(5000),
      redirect: 'error',
    });
    if (!r.ok)
      throw new Error(
        r.status === 401
          ? 'The connection key was not accepted.'
          : `Mac responded with ${r.status}.`,
      );
    const h = await r.json();
    if (
      (h.aevoriNode ?? h.orbitNode) !== 1 ||
      !Array.isArray(h.models) ||
      h.models.some((m) => typeof m.id !== 'string') ||
      typeof h.instanceId !== 'string' ||
      !h.hardware
    )
      throw new Error('No Aevori Mac found at this address.');
    if (h.instanceId === instanceId)
      throw new Error('This is your current Mac. It is already in the pool.');
    return h;
  };
  let refreshing;
  async function refresh() {
    if (refreshing) return refreshing;
    refreshing = Promise.allSettled([
      modelsWithVision(localProvider)
        .then((models) => {
          Object.assign(local, { online: true, models, error: '' });
        })
        .catch(() =>
          Object.assign(local, { online: false, models: [], error: 'Ollama is unavailable.' }),
        ),
      ...nodes.map(async (n) => {
        try {
          const h = await inspect(n);
          Object.assign(n, {
            online: true,
            models: h.models,
            hardware: h.hardware,
            cpu: h.cpu,
            memory: h.memory,
            lastSeen: Date.now(),
            error: '',
          });
        } catch (e) {
          n.online = false;
          n.error = e.message;
        }
      }),
    ]).finally(() => {
      refreshing = null;
    });
    return refreshing;
  }
  const publicNode = (n) => ({
    id: n.id,
    name: n.id === 'local' ? getStats().hardware.name : n.name,
    enabled: n.enabled,
    online: n.online,
    models: n.models,
    active: n.active,
    lastSeen: n.lastSeen,
    error: n.error || '',
    hardware: n.id === 'local' ? getStats().hardware : n.hardware,
    cpu: n.id === 'local' ? getStats().cpu : n.cpu,
    memory: n.id === 'local' ? getStats().memory : n.memory,
    baseUrl: n.id === 'local' ? null : n.baseUrl,
  });
  return {
    async list() {
      await refresh();
      return { nodes: [local, ...nodes].map(publicNode), sharing: !!shareToken };
    },
    async add(input) {
      if (nodes.length >= 7) throw new Error('Up to eight Macs can work in the pool.');
      if (
        typeof input.name !== 'string' ||
        !input.name.trim() ||
        input.name.length > 60 ||
        typeof input.token !== 'string' ||
        input.token.length < 32 ||
        input.token.length > 200 ||
        /[\r\n]/.test(input.token)
      )
        throw new Error('Check the name and connection key.');
      const config = validateProvider({
        type: 'ollama',
        baseUrl: input.baseUrl,
        apiKey: input.token,
      });
      if (nodes.some((n) => n.baseUrl === config.baseUrl))
        throw new Error('This connection is already in the pool.');
      const node = {
        id: randomUUID(),
        name: input.name.trim(),
        baseUrl: config.baseUrl,
        token: input.token,
        enabled: true,
        online: false,
        models: [],
        active: 0,
        lastUsed: 0,
      };
      const h = await inspect(node);
      if (nodes.some((n) => n.instanceId === h.instanceId))
        throw new Error('This Mac is already connected through another address.');
      Object.assign(node, {
        instanceId: h.instanceId,
        online: true,
        models: h.models,
        hardware: h.hardware,
        cpu: h.cpu,
        memory: h.memory,
        lastSeen: Date.now(),
        error: '',
      });
      nodes.push(node);
      return publicNode(node);
    },
    update(input) {
      const n = [local, ...nodes].find((n) => n.id === input.id);
      if (!n) throw new Error('Mac not found.');
      if (input.remove === true) {
        if (n.id === 'local') throw new Error('This Mac can only be paused.');
        if (n.active) throw new Error('Wait for the current response to finish.');
        nodes.splice(nodes.indexOf(n), 1);
      } else if (typeof input.enabled === 'boolean') n.enabled = input.enabled;
      else throw new Error('Invalid change.');
      return { ok: true };
    },
    share(enable) {
      shareToken = enable ? randomBytes(32).toString('hex') : null;
      return { sharing: !!shareToken, token: shareToken };
    },
    authorized(req) {
      const actual = String(req.headers.authorization || '').replace(/^Bearer /, '');
      return (
        !!shareToken &&
        Buffer.byteLength(actual) === Buffer.byteLength(shareToken) &&
        timingSafeEqual(Buffer.from(actual), Buffer.from(shareToken))
      );
    },
    health,
    async peerChat(input, signal) {
      if (
        !input ||
        typeof input.model !== 'string' ||
        !Array.isArray(input.messages) ||
        input.messages.length > 82 ||
        input.messages.some(
          (m) =>
            !m ||
            !['system', 'user', 'assistant'].includes(m.role) ||
            typeof m.content !== 'string' ||
            m.content.length > 26000,
        )
      )
        throw new Error('Invalid chat request.');
      const messages = input.messages.map((m) =>
        m.role === 'system' ? { role: 'system', content: m.content } : validateMessages([m])[0],
      );
      validateMessages(messages.filter((m) => m.role !== 'system'));
      if (
        hasImages(messages) &&
        (await modelCapabilities(localProvider, input.model)).vision !== true
      )
        throw new Error('This model cannot read images.');
      if (local.active >= 4) throw new Error('This Mac is already handling four requests.');
      local.active++;
      let released = false;
      const release = () => {
        if (!released) {
          local.active--;
          released = true;
        }
      };
      try {
        const response = await modelRequest(localProvider, '/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            model: input.model,
            messages: messagesForProvider(messages, 'ollama'),
            stream: true,
            ...(await ollamaOptions(localProvider, input.model, {
              ...generationSettings(input.settings),
              contextLength: [4096, 8192, 16384].includes(input.settings?.contextLength)
                ? input.settings.contextLength
                : 8192,
            })),
            keep_alive: '5m',
          }),
          signal,
        });
        return { response, release };
      } catch (e) {
        release();
        throw e;
      }
    },
    async open(model, messages, signal, settings = generationSettings()) {
      await refresh();
      const candidates = rankNodes([local, ...nodes], model, hasImages(messages));
      if (!candidates.length)
        throw new Error(
          hasImages(messages)
            ? 'No active Mac with a vision model is available. Install a model such as Gemma 3 on a Mac in the pool.'
            : 'No active Mac with a suitable model is available. Check the Mac pool.',
        );
      let lastError;
      for (const node of candidates) {
        if (signal.aborted) throw signal.reason;
        node.active++;
        node.lastUsed = Date.now();
        let released = false;
        const release = () => {
          if (!released) {
            node.active--;
            released = true;
          }
        };
        try {
          const chosen =
            model === '__pool__'
              ? selectAutomaticModel(node.models, {
                  images: hasImages(messages),
                  mode: settings.mode,
                  memoryBytes: node.id === 'local' ? getStats().memory.total : node.memory?.total,
                }).model.id
              : model;
          const controller = new AbortController();
          const timeout = setTimeout(
            () => controller.abort(new Error('Mac is not responding.')),
            20000,
          );
          let response;
          try {
            response =
              node.id === 'local'
                ? await modelRequest(localProvider, '/api/chat', {
                    method: 'POST',
                    body: JSON.stringify({
                      model: chosen,
                      messages: messagesForProvider(messages, 'ollama'),
                      stream: true,
                      ...(await ollamaOptions(localProvider, chosen, settings)),
                      keep_alive: '5m',
                    }),
                    signal: AbortSignal.any([signal, controller.signal]),
                  })
                : await fetch(node.baseUrl + '/peer/chat', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${node.token}`,
                    },
                    body: JSON.stringify({
                      model: chosen,
                      messages,
                      settings: {
                        responseLength: settings.length,
                        creativity: settings.creativity,
                        reasoning: settings.reasoning,
                        workMode: settings.mode,
                        contextLength: settings.contextLength,
                      },
                    }),
                    signal: AbortSignal.any([signal, controller.signal]),
                    redirect: 'error',
                  });
          } finally {
            clearTimeout(timeout);
          }
          if (!response.ok || !response.body) {
            await response.body?.cancel();
            throw new Error(`Mac responded with ${response.status}.`);
          }
          return {
            response,
            release,
            assignment: {
              id: node.id,
              name: node.id === 'local' ? getStats().hardware.name : node.name,
              model: chosen,
              fallback: !!lastError,
            },
          };
        } catch (e) {
          release();
          lastError = e;
          node.online = false;
          node.error = e.message;
        }
      }
      throw new Error('No Mac could accept the request. Check the connections.');
    },
  };
}
