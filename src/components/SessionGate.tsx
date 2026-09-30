import { useEffect, useState, type ReactNode } from 'react';
import BrandLogo from './BrandLogo';
import type { Session } from './TeamPanel';
export default function SessionGate({ children }: { children: (session: Session) => ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [token] = useState(() => new URLSearchParams(location.hash.slice(1)).get('invite') || '');
  const load = async () => {
    try {
      const r = await fetch('/api/session');
      if (!r.ok)
        throw new Error('This access has not been enabled yet. Open Aevori on the main Mac.');
      setSession(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Aevori is unavailable.');
    }
  };
  useEffect(() => {
    if (token) history.replaceState(null, '', location.pathname + location.search);
    void load();
  }, []);
  if (session?.authenticated) return children(session);
  if (!session && !error)
    return (
      <main className="access-page">
        <BrandLogo />
        <p role="status">Opening your workspace…</p>
      </main>
    );
  return (
    <main className="access-page">
      <BrandLogo />
      <div className="access-card">
        <span className="eyebrow">Aevori · Private workspace</span>
        <h1>{token ? "You're invited." : 'Your team is waiting for you.'}</h1>
        <p>
          {token
            ? 'Accept your personal invitation to use the shared AI models.'
            : 'Access requires a personal invitation from the host.'}
        </p>
        {error && (
          <p className="small-error" role="alert">
            {error}
          </p>
        )}
        {token && (
          <button
            className="primary"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setError('');
              void fetch('/api/team/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
              })
                .then(async (r) => {
                  const d = await r.json();
                  if (!r.ok) throw new Error(d.error);
                  await load();
                })
                .catch((e) => setError(e.message))
                .finally(() => setBusy(false));
            }}
          >
            {busy ? 'Opening access…' : 'Accept invitation'}
          </button>
        )}
      </div>
    </main>
  );
}
