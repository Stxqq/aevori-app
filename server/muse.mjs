// Official Meta Model API contract, verified 2026-09-30.
export const MUSE_BASE_URL = 'https://api.meta.ai/v1';
export const isMuseProvider = provider => provider.type === 'compatible' && provider.baseUrl === MUSE_BASE_URL;
export const isMuseChatModel = id => /^muse-spark-1\.[123]$/.test(id);

export function museModels(data) {
  if (!Array.isArray(data.data)) throw new Error('Meta hat keine gültige Modellliste zurückgegeben.');
  // Only supported text models on the Standard tier. Contributor requires a separate data-sharing choice.
  const models = data.data.filter(m => typeof m?.id === 'string' && isMuseChatModel(m.id))
    .map(m => ({id:m.id})).sort((a,b) => b.id.localeCompare(a.id,undefined,{numeric:true}));
  if (!models.length) throw new Error('Für diesen Meta-Schlüssel ist kein Muse-Spark-Modell im Standard-Tarif freigeschaltet. Prüfe deinen API-Zugang.');
  return models;
}

export function museOptions(model, settings) {
  if (!isMuseChatModel(model)) throw new Error('Wähle ein verfügbares Muse-Spark-Modell im Standard-Tarif.');
  if (!['auto','low','medium','high'].includes(settings.reasoning)) throw new Error('Muse unterstützt hier die Denkstufen Automatisch, Niedrig, Mittel und Hoch.');
  return {max_completion_tokens:Math.max(8192,settings.maxTokens),temperature:settings.creativity==='balanced'?1:settings.temperature,
    ...(settings.reasoning==='auto'?{}:{reasoning_effort:settings.reasoning})};
}

export function museError(status) {
  return ({401:'Der Meta-API-Schlüssel wurde nicht akzeptiert. Prüfe ihn im Meta Developer Dashboard.',403:'Dieser Meta-Zugang hat keine Berechtigung für das Modell. Prüfe Projekt und Freischaltung.',429:'Das Meta-Limit ist erreicht. Prüfe dein API-Guthaben oder versuche es später erneut.'})[status]
    || `Meta antwortet mit ${status}. Bitte versuche es später erneut.`;
}
