import { useState } from 'react';
import { Check, ChevronRight, Copy, Plus, RefreshCw, ShieldCheck, Trash2, X } from './MotionIcon';
import MacImage from './components/MacImage';
import ModelLogo from './components/ModelLogo';
export type PoolNode = {
  id: string;
  name: string;
  enabled: boolean;
  online: boolean;
  models: { id: string }[];
  active: number;
  error: string;
  hardware?: { name: string; chip: string; cores: number };
  memory?: { total: number; used: number };
  cpu?: number;
};
export type PoolState = { nodes: PoolNode[]; sharing: boolean };
export async function poolRequest(path: string, data: unknown) {
  const r = await fetch('/api/pool/' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const value = await r.json();
  if (!r.ok) throw new Error(value.error || 'Connection failed.');
  return value;
}
export default function PoolPanel({
  pool,
  refresh,
  startChat,
  readOnly = false,
}: {
  readOnly?: boolean;
  pool: PoolState;
  refresh: () => Promise<void>;
  startChat: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [token, setToken] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: '', baseUrl: 'http://127.0.0.1:5191', token: '' });
  const ready = pool.nodes.filter((n) => n.enabled && n.online && n.models.length);
  const active = pool.nodes.reduce((sum, n) => sum + n.active, 0);
  const act = async (fn: () => Promise<unknown>) => {
    setPending(true);
    setError('');
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed.');
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <div className="page-heading with-action">
        <div>
          <span className="eyebrow">Connected together</span>
          <h1>More Macs. One Aevori.</h1>
          <p>Your AI requests find the next available Mac.</p>
        </div>
        <button className="primary" disabled={readOnly} onClick={() => setAdding(!adding)}>
          <Plus size={16} />
          Connect a Mac
        </button>
      </div>
      <section className="pool-hub">
        <div className="pool-hub-copy">
          <span className="connected-pill">
            <span className={`status-dot ${ready.length ? 'online' : ''}`} />
            {ready.length} {ready.length === 1 ? 'Mac ready' : 'Macs ready'}
          </span>
          <h2>
            One team.
            <br />
            More possibilities.
          </h2>
          <p>
            Connect your Macs. Aevori routes each new request to an available machine with the right
            model.
          </p>
          <div className="pool-hub-numbers">
            <div>
              <strong>{pool.nodes.length.toString().padStart(2, '0')}</strong>
              <span>Connected Macs</span>
            </div>
            <div>
              <strong>{active.toString().padStart(2, '0')}</strong>
              <span>Active requests</span>
            </div>
            <div>
              <strong>
                {new Set(
                  pool.nodes
                    .filter((n) => n.online && n.enabled)
                    .flatMap((n) => n.models.map((m) => m.id)),
                ).size
                  .toString()
                  .padStart(2, '0')}
              </strong>
              <span>Available models</span>
            </div>
          </div>
          <button className="primary" onClick={startChat} disabled={!ready.length}>
            Chat with the pool
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="pool-hardware-scene">
          <div className="hardware-halo" />
          <MacImage
            name={pool.nodes[0]?.hardware?.name || 'Mac Studio'}
            className="pool-primary-mac"
          />
          <span className="pool-scene-label">
            <span className={`status-dot ${ready.length ? 'online' : ''}`} />
            {pool.nodes[0]?.name || 'Your Mac'}
            <small>{pool.nodes[0]?.hardware?.chip || 'Ready to connect'}</small>
          </span>
          <div className="pool-link-line" />
          <div className="pool-scene-peers">
            {pool.nodes.slice(1, 4).map((n) => (
              <div key={n.id}>
                <MacImage name={n.hardware?.name || n.name} />
                <span>{n.name}</span>
              </div>
            ))}
            <button disabled={readOnly} onClick={() => setAdding(true)}>
              <Plus size={19} />
              <span>Add Mac</span>
            </button>
          </div>
        </div>
        <div className="pool-hub-footer">
          <span>
            <ShieldCheck size={14} />
            Your computers. Your models. Your private pool.
          </span>
          <button className="text-button" onClick={() => void act(refresh)} disabled={pending}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </section>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {adding && (
        <section className="pool-setup">
          <div className="section-heading">
            <h2>Bring another Mac into Aevori.</h2>
            <button
              className="icon-button"
              aria-label="Close connection setup"
              onClick={() => setAdding(false)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="setup-columns">
            <ol className="setup-steps">
              <li>
                <strong>Start Aevori on the other Mac.</strong>
                <span>Start Ollama and install at least one model there.</span>
              </li>
              <li>
                <strong>Share that Mac.</strong>
                <span>Create a connection key in its Mac pool settings.</span>
              </li>
              <li>
                <strong>Open a secure connection.</strong>
                <span>
                  Start an SSH tunnel on this Mac. Replace the username and Mac address with your
                  own.
                </span>
                <code>ssh -N -L 5191:127.0.0.1:5190 USER@MAC.local</code>
                <span>You can also use an HTTPS address you have already configured.</span>
              </li>
            </ol>
            <form
              className="connection-form"
              onSubmit={(e) => {
                e.preventDefault();
                void act(async () => {
                  await poolRequest('add', form);
                  setForm({ name: '', baseUrl: 'http://127.0.0.1:5191', token: '' });
                  setAdding(false);
                });
              }}
            >
              <label>
                Mac name
                <input
                  required
                  maxLength={60}
                  placeholder="Office Mac Studio"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Aevori address
                <input
                  required
                  type="url"
                  value={form.baseUrl}
                  onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                />
              </label>
              <label>
                Connection key
                <input
                  required
                  type="password"
                  autoComplete="off"
                  value={form.token}
                  onChange={(e) => setForm({ ...form, token: e.target.value })}
                />
              </label>
              <button className="primary wide" disabled={pending}>
                {pending ? 'Checking connection…' : 'Check and add'}
              </button>
              <p className="fine-print">
                Connections last for this session. Each additional tunnel needs its own local port,
                such as 5192.
              </p>
            </form>
          </div>
        </section>
      )}
      <div className="section-heading models-heading">
        <h2>Your computers</h2>
        <span>{pool.nodes.length} in the pool</span>
      </div>
      <div className="pool-machine-list">
        {pool.nodes.map((n) => (
          <article key={n.id} className="pool-machine">
            <div className="pool-machine-icon">
              <MacImage name={n.hardware?.name || n.name} />
            </div>
            <div className="pool-machine-copy">
              <h3>
                {n.name}
                {n.id === 'local' && <small>This Mac</small>}
              </h3>
              <p>
                {n.hardware?.chip || 'Aevori Mac'}
                {n.memory ? ` · ${Math.round(n.memory.total / 1024 ** 3)} GB RAM` : ''}
              </p>
              <div className="pool-models">
                {n.models.map((m) => (
                  <span key={m.id}>
                    <ModelLogo model={m.id} size={14} />
                    {m.id.replace(':latest', '')}
                  </span>
                ))}
              </div>
              {n.error && <p className="small-error">{n.error}</p>}
            </div>
            <div className="pool-machine-state">
              <span className={`status-dot ${n.online && n.enabled ? 'online' : ''}`} />
              {!n.enabled
                ? 'Paused'
                : !n.online
                  ? 'Offline'
                  : n.active
                    ? `${n.active} active`
                    : 'Ready'}
            </div>
            <button
              role="switch"
              aria-label={`Use ${n.name} in the pool`}
              aria-checked={n.enabled}
              disabled={pending || readOnly}
              className={`toggle ${n.enabled ? 'on' : ''}`}
              onClick={() =>
                void act(() => poolRequest('update', { id: n.id, enabled: !n.enabled }))
              }
            >
              <i />
            </button>
            {!readOnly && n.id !== 'local' && (
              <button
                className="icon-button"
                aria-label={`Remove ${n.name}`}
                disabled={pending || n.active > 0}
                onClick={() => void act(() => poolRequest('update', { id: n.id, remove: true }))}
              >
                <Trash2 size={16} />
              </button>
            )}
          </article>
        ))}
      </div>
      {!readOnly && (
        <section className="share-machine">
          <div>
            <ShieldCheck size={22} />
            <div>
              <h3>Share this Mac with your pool</h3>
              <p>Other Aevori Macs can use it with a session key.</p>
            </div>
          </div>
          <button className="secondary" onClick={() => setSharing(!sharing)}>
            {sharing ? 'Close' : pool.sharing ? 'Manage sharing' : 'Set up sharing'}
            <ChevronRight size={15} />
          </button>
        </section>
      )}
      {sharing && (
        <div className="pool-setup sharing-details">
          <p>
            This key allows AI requests and access to device usage readings. It expires when sharing
            stops or Aevori restarts.
          </p>
          {token && (
            <div className="share-token">
              <input aria-label="Session key" type="password" readOnly value={token} />
              <button
                className="secondary"
                onClick={() =>
                  void navigator.clipboard
                    .writeText(token)
                    .then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    })
                    .catch(() => setError('Could not copy the key.'))
                }
              >
                {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
          <div className="row">
            <button
              className="primary"
              disabled={pending}
              onClick={() =>
                void act(async () => {
                  const d = await poolRequest('share', { enable: true });
                  setToken(d.token);
                })
              }
            >
              {pool.sharing ? 'Create new key' : 'Share and create key'}
            </button>
            {pool.sharing && (
              <button
                className="secondary"
                disabled={pending}
                onClick={() =>
                  void act(async () => {
                    await poolRequest('share', { enable: false });
                    setToken('');
                  })
                }
              >
                Stop sharing
              </button>
            )}
          </div>
        </div>
      )}
      <p className="fine-print pool-explainer">
        Aevori routes complete requests to active Macs with suitable models. Memory remains separate
        on each device. If a Mac fails before a response begins, Aevori tries the next one. Your
        conversation is sent to the selected Mac.
      </p>
    </>
  );
}
