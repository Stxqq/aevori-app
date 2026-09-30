import { useEffect, useState } from 'react';
import { Copy, Network, Plus, ShieldCheck, Trash2 } from '../MotionIcon';
import ModelLogo from './ModelLogo';
export type Session = {
  authenticated: boolean;
  id: string;
  role: 'owner' | 'member';
  name?: string;
  profileConfigured?: boolean;
  publicUrl?: string;
};
type Job = {
  id: string;
  member: string;
  name: string;
  model: string;
  machine?: string;
  started: number;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  status?: string;
};
type Team = {
  members: { id: string; name: string; role: string; online: boolean; active: number }[];
  active: Job[];
  history: Job[];
  publicUrl?: string;
  configured: boolean;
};
async function action(route: string, data: unknown) {
  const r = await fetch('/api/team/' + route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await r.json();
  if (!r.ok) throw new Error(result.error);
  return result;
}
const seconds = (ms: number) =>
  ms >= 60000
    ? `${Math.floor(ms / 60000)} min ${Math.floor((ms % 60000) / 1000)} s`
    : `${Math.max(0, ms / 1000).toFixed(1)} s`;
export default function TeamPanel({ session }: { session: Session }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState(session.publicUrl || '');
  const [invite, setInvite] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const refresh = async () => {
    try {
      const r = await fetch('/api/team/state');
      if (!r.ok) throw new Error('Team unavailable.');
      setTeam(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Team unavailable.');
    }
  };
  useEffect(() => {
    void refresh();
    const t = setInterval(refresh, 5000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(t);
      clearInterval(clock);
    };
  }, []);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  };
  const tokens = team?.history.reduce((sum, j) => sum + (j.outputTokens || 0), 0) || 0;
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">Work together</span>
        <h1>Your team. One workspace.</h1>
        <p>See who's working and how your models are being used.</p>
      </div>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="team-notice" role="status">
          {notice}
        </p>
      )}
      <div className="team-stats">
        <div>
          <span>Online now</span>
          <strong>{team?.members.filter((m) => m.online).length ?? '—'}</strong>
        </div>
        <div>
          <span>Active requests</span>
          <strong>{team?.active.length ?? '—'}</strong>
        </div>
        <div>
          <span>Output tokens</span>
          <strong>{tokens.toLocaleString('en-US')}</strong>
          <small>Reported since server startup</small>
        </div>
      </div>
      <div className="section-heading">
        <h2>Your people</h2>
        <span>Live · every 5 seconds</span>
      </div>
      <div className="team-members">
        {team?.members.map((m) => (
          <article key={m.id}>
            <span className="team-avatar">
              {m.name.slice(0, 1).toUpperCase()}
              <i className={`status-dot ${m.online ? 'online' : ''}`} />
            </span>
            <div>
              <strong>{m.name}</strong>
              <span>
                {m.active
                  ? `${m.active} ${m.active === 1 ? 'request running' : 'requests running'}`
                  : m.online
                    ? 'Online'
                    : 'Offline'}
                {m.role === 'owner' ? ' · Host' : ''}
              </span>
            </div>
            {session.role === 'owner' && m.role !== 'owner' && (
              <button
                className="icon-button"
                disabled={busy}
                aria-label={`Revoke access for ${m.name}`}
                onClick={() =>
                  void run(async () => {
                    await action('revoke', { id: m.id });
                    setNotice('Access revoked.');
                  })
                }
              >
                <Trash2 size={15} />
              </button>
            )}
          </article>
        ))}
      </div>
      {!!team?.active.length && (
        <section className="team-active">
          <h2>In progress</h2>
          {team.active.map((j) => (
            <div key={j.id}>
              <ModelLogo model={j.model} />
              <div>
                <strong>{j.name}</strong>
                <span>
                  {j.model} · {j.machine || 'Connecting…'}
                </span>
              </div>
              <span className="active-job-dot" />
              <time>{seconds(now - j.started)}</time>
            </div>
          ))}
        </section>
      )}
      <section className="team-usage">
        <div className="section-heading">
          <h2>Recent requests</h2>
          <span>Without chat content</span>
        </div>
        {team?.history.length ? (
          <div className="usage-table">
            <div className="usage-table-head">
              <span>Person & model</span>
              <span>Duration</span>
              <span>Tokens in / out</span>
            </div>
            {team.history.map((j) => (
              <div key={j.id}>
                <span>
                  <ModelLogo model={j.model} />
                  <span>
                    <strong>{j.name}</strong>
                    <small>
                      {j.model} ·{' '}
                      {j.status === 'done'
                        ? j.machine || 'Completed'
                        : j.status === 'stopped'
                          ? 'Stopped'
                          : 'Failed'}
                    </small>
                  </span>
                </span>
                <span>{seconds(j.durationMs || 0)}</span>
                <span>
                  {j.inputTokens ?? '—'} / {j.outputTokens ?? '—'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="team-empty">
            <Network size={24} />
            <p>Your first shared request starts here.</p>
            <span>Token counts appear when the model reports them.</span>
          </div>
        )}
      </section>
      {session.role === 'owner' && (
        <section className="team-sharing">
          <div>
            <ShieldCheck size={22} />
            <h2>Invite friends.</h2>
            <p>A personal link. Individual access. Revocable anytime.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await action('configure', { publicUrl: url });
                setNotice('HTTPS address saved. External access must forward to this Mac.');
              });
            }}
          >
            <label>
              Your HTTPS address
              <input
                type="url"
                placeholder="https://aevori.example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </label>
            <button className="secondary" disabled={busy}>
              Save address
            </button>
          </form>
          <p className="fine-print">
            Aevori remains locally accessible. For online access, connect this address to port 5190
            through an HTTPS tunnel. The address alone does not publish the app.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const r = await action('invite', { name });
                setInvite(r.url);
                setName('');
              });
            }}
          >
            <label>
              Your friend's name
              <input
                placeholder="e.g. Arda"
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <button className="primary" disabled={busy || !team?.configured}>
              <Plus size={15} />
              Create invitation
            </button>
          </form>
          {invite && (
            <div className="team-invite">
              <input aria-label="Invitation link" readOnly value={invite} />
              <button
                className="secondary"
                onClick={() =>
                  void navigator.clipboard
                    .writeText(invite)
                    .then(() => setNotice('Invitation link copied.'))
                    .catch(() => setError('Please copy the link manually.'))
                }
              >
                <Copy size={15} />
                Copy
              </button>
            </div>
          )}
          <p className="fine-print">
            Invitations are single-use and valid for 24 hours. Friends can chat and see shared
            usage. Device settings, local processes, and keys remain with the host.
          </p>
        </section>
      )}
    </>
  );
}
