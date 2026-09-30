// Official Meta Model API contract, verified 2026-09-30.
export const MUSE_BASE_URL = 'https://api.meta.ai/v1';
export const isMuseProvider = (provider) =>
  provider.type === 'compatible' && provider.baseUrl === MUSE_BASE_URL;
export const isMuseChatModel = (id) => /^muse-spark-1\.[123]$/.test(id);

export function museModels(data) {
  if (!Array.isArray(data.data)) throw new Error('Meta did not return a valid model list.');
  // Only supported text models on the Standard tier. Contributor requires a separate data-sharing choice.
  const models = data.data
    .filter((m) => typeof m?.id === 'string' && isMuseChatModel(m.id))
    .map((m) => ({ id: m.id }))
    .sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));
  if (!models.length)
    throw new Error(
      'No Standard-tier Muse Spark model is enabled for this Meta key. Check your API access.',
    );
  return models;
}

export function museOptions(model, settings) {
  if (!isMuseChatModel(model))
    throw new Error('Choose an available Muse Spark model on the Standard tier.');
  if (!['auto', 'low', 'medium', 'high'].includes(settings.reasoning))
    throw new Error('Muse supports Automatic, Low, Medium, and High reasoning levels here.');
  return {
    max_completion_tokens: Math.max(8192, settings.maxTokens),
    temperature: settings.creativity === 'balanced' ? 1 : settings.temperature,
    ...(settings.reasoning === 'auto' ? {} : { reasoning_effort: settings.reasoning }),
  };
}

export function museError(status) {
  return (
    {
      401: 'The Meta API key was not accepted. Check it in the Meta Developer Dashboard.',
      403: 'This Meta account does not have access to the model. Check your project and access settings.',
      429: "Meta's usage limit has been reached. Check your API balance or try again later.",
    }[status] || `Meta responded with ${status}. Please try again later.`
  );
}
