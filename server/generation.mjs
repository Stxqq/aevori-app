import { modelRequest, modelsFor } from './core.mjs';
import { normalizeMode } from './chat.mjs';
import { isMuseProvider, isMuseChatModel } from './muse.mjs';
const cache = new Map();
export function generationSettings(input = {}) {
  const length = ['short', 'normal', 'long'].includes(input.responseLength)
    ? input.responseLength
    : 'normal';
  const creativity = ['precise', 'balanced', 'creative'].includes(input.creativity)
    ? input.creativity
    : 'balanced';
  const reasoning = ['auto', 'off', 'on', 'low', 'medium', 'high'].includes(input.reasoning)
    ? input.reasoning
    : 'auto';
  return {
    length,
    creativity,
    reasoning,
    mode: normalizeMode(input.workMode),
    maxTokens: { short: 512, normal: 1600, long: 4096 }[length],
    temperature: { precise: 0.2, balanced: 0.7, creative: 1 }[creativity],
  };
}
export async function modelCapabilities(provider, model) {
  if (isMuseProvider(provider) && isMuseChatModel(model))
    return {
      thinking: ['low', 'medium', 'high'],
      vision: true,
      tools: false,
      contextLength: 1048576,
      completion: true,
    };
  if (provider.type !== 'ollama')
    return { thinking: [], vision: null, tools: null, contextLength: null, completion: null };
  const key = provider.baseUrl + '|' + model,
    old = cache.get(key);
  if (old && Date.now() - old.at < 60000) return old.value;
  try {
    const r = await modelRequest(provider, '/api/show', {
      method: 'POST',
      body: JSON.stringify({ model }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return { thinking: [], vision: null };
    const d = await r.json();
    const values = Array.isArray(d.thinking?.values)
      ? d.thinking.values
      : d.capabilities?.includes('thinking')
        ? [false, true]
        : [];
    const limits = Object.entries(d.model_info || {})
      .filter(([k, v]) => k.endsWith('.context_length') && Number.isFinite(v) && v > 0)
      .map(([, v]) => v);
    const value = {
      thinking: values.some((v) => v === true || typeof v === 'string')
        ? values.filter((v) => typeof v === 'boolean' || ['low', 'medium', 'high'].includes(v))
        : [],
      vision: Array.isArray(d.capabilities) ? d.capabilities.includes('vision') : null,
      tools: Array.isArray(d.capabilities) ? d.capabilities.includes('tools') : null,
      completion: Array.isArray(d.capabilities) ? d.capabilities.includes('completion') : null,
      contextLength: limits.length ? Math.min(...limits) : null,
    };
    cache.set(key, { at: Date.now(), value });
    return value;
  } catch {
    return { thinking: [], vision: null };
  }
}
export async function modelsWithVision(provider) {
  return Promise.all(
    (await modelsFor(provider)).map(async (model) => ({
      ...model,
      ...(await modelCapabilities(provider, model.id)),
    })),
  );
}
export async function ollamaOptions(provider, model, settings) {
  const result = {
    options: {
      num_predict: settings.maxTokens,
      temperature: settings.temperature,
      ...(settings.contextLength ? { num_ctx: settings.contextLength } : {}),
    },
  };
  if (settings.reasoning === 'auto') return result;
  const desired =
    settings.reasoning === 'on' ? true : settings.reasoning === 'off' ? false : settings.reasoning;
  const caps = await modelCapabilities(provider, model);
  if (!caps.thinking.includes(desired))
    throw new Error('This model does not support the selected reasoning level. Choose Automatic.');
  return {
    ...result,
    think: desired,
    options: {
      ...result.options,
      num_predict: desired ? Math.max(8192, settings.maxTokens) : settings.maxTokens,
    },
  };
}
export function usageFromEvent(event) {
  const input = event.prompt_eval_count ?? event.usage?.prompt_tokens;
  const output = event.eval_count ?? event.usage?.completion_tokens;
  if (!Number.isFinite(input) && !Number.isFinite(output)) return null;
  return {
    inputTokens: Number.isFinite(input) ? input : null,
    outputTokens: Number.isFinite(output) ? output : null,
    tokensPerSecond:
      event.eval_duration > 0 && Number.isFinite(output)
        ? Math.round((output / (event.eval_duration / 1e9)) * 10) / 10
        : null,
  };
}
