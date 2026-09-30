import { useEffect, useRef, useState } from 'react';
import { MODEL_CATALOG } from '../model-catalog';
import { ArrowUpRight, Check, Plus, X } from '../MotionIcon';
import ModelLogo from './ModelLogo';
type Props = {
  available: boolean;
  chatBusy: boolean;
  installed: { id: string }[];
  freeBytes?: number;
  onComplete: () => void;
  onSelect: (id: string) => void;
};
export default function ModelInstall({
  available,
  chatBusy,
  installed,
  freeBytes,
  onComplete,
  onSelect,
}: Props) {
  const [name, setName] = useState('');
  const [downloading, setDownloading] = useState('');
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const install = async (model: string) => {
    if (controller.current || !available) return;
    const abort = new AbortController();
    controller.current = abort;
    setDownloading(model);
    setError('');
    setProgress(null);
    setStatus('Preparing download…');
    try {
      const r = await fetch('/api/models/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
        signal: abort.signal,
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error);
      }
      const reader = r.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let success = false;
      const read = (line: string) => {
        if (!line.trim()) return;
        const d = JSON.parse(line);
        if (d.error) throw new Error(d.error);
        if (d.status)
          setStatus(
            d.status === 'success'
              ? 'Model is ready.'
              : d.status.startsWith('pulling')
                ? 'Downloading model…'
                : 'Verifying download…',
          );
        if (d.total) setProgress(Math.min(100, (100 * (d.completed || 0)) / d.total));
        if (d.status === 'success') success = true;
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let i;
        while ((i = buffer.indexOf('\n')) >= 0) {
          read(buffer.slice(0, i));
          buffer = buffer.slice(i + 1);
        }
      }
      buffer += decoder.decode();
      if (buffer.trim()) read(buffer);
      if (!success) throw new Error('The download did not finish.');
      setStatus('Model installed and ready.');
      setProgress(100);
      onComplete();
    } catch (e) {
      setError(
        abort.signal.aborted
          ? 'Download stopped.'
          : e instanceof Error
            ? e.message
            : 'Download failed.',
      );
      setStatus('');
    } finally {
      setDownloading('');
      controller.current = null;
    }
  };
  return (
    <section className="model-library" aria-labelledby="model-library-title">
      <div className="section-heading models-heading">
        <div>
          <h2 id="model-library-title">For whatever comes next.</h2>
          <p>Coding, frontend, and fresh ideas. Choose your tool.</p>
        </div>
        {freeBytes !== undefined && <span>{Math.floor(freeBytes / 1e9)} GB available</span>}
      </div>
      <div className="model-catalog">
        {MODEL_CATALOG.map((item) => {
          const ready = installed.some((m) => m.id === item.id);
          const loading = downloading === item.id;
          const enoughSpace = freeBytes === undefined || freeBytes > (item.downloadGB + 4) * 1e9;
          return (
            <article key={item.id} className="catalog-card">
              <div className="catalog-top">
                <span className="catalog-logo">
                  <ModelLogo model={item.id} size={25} />
                </span>
                <span>{item.category}</span>
                {ready && (
                  <span className="catalog-ready">
                    <Check size={12} />
                    Ready
                  </span>
                )}
              </div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="catalog-spec">
                <span>~{item.downloadGB.toLocaleString('en-US')} GB download</span>
                <span>{item.ramGB} GB RAM recommended</span>
              </div>
              <div className="catalog-actions">
                {ready ? (
                  <button
                    className="secondary"
                    disabled={chatBusy}
                    onClick={() => onSelect(item.id)}
                  >
                    Use in chat
                    <ArrowUpRight size={14} />
                  </button>
                ) : (
                  <button
                    className="secondary"
                    disabled={!available || !!downloading || !enoughSpace}
                    onClick={() => void install(item.id)}
                  >
                    {loading ? 'Loading…' : enoughSpace ? 'Install' : 'More memory needed'}
                    {!loading && enoughSpace && <Plus size={14} />}
                  </button>
                )}
                <a
                  href={item.source}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Information about ${item.name}`}
                >
                  Details
                  <ArrowUpRight size={12} />
                </a>
              </div>
            </article>
          );
        })}
      </div>
      <div className="model-install">
        <h3>Add another model</h3>
        <p>Enter an Ollama model name. The download stays on this Mac.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void install(name.trim());
          }}
        >
          <label className="sr-only" htmlFor="install-model">
            Ollama model name
          </label>
          <input
            id="install-model"
            disabled={!!downloading || !available}
            placeholder="e.g. qwen3.5:4b"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            pattern="[A-Za-z0-9][A-Za-z0-9._:\/\-]*"
            maxLength={120}
          />
          <button className="secondary" disabled={!available || !!downloading || !name.trim()}>
            <Plus size={15} />
            Add
          </button>
        </form>
        {!available && <p>Connect to local Ollama on the main Mac to install models.</p>}
        {status && (
          <div className="model-download-status">
            <p role="status">
              {downloading && <strong>{downloading} · </strong>}
              {status}
              {progress !== null ? ` ${Math.round(progress)} %` : ''}
            </p>
            {downloading && (
              <button className="text-button" onClick={() => controller.current?.abort()}>
                <X size={14} />
                Stop
              </button>
            )}
          </div>
        )}
        {downloading && progress !== null && (
          <progress value={progress} max="100" aria-label="Model download" />
        )}
        {error && (
          <p className="small-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
