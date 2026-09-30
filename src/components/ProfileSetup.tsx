import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  MessageCircle,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import AevoriMark from '../AevoriMark';
import BrandLogo from './BrandLogo';
import SmoothHeight from './SmoothHeight';
import ThemePreview from './ThemePreview';

export async function saveProfile(name: string): Promise<string> {
  const response = await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Could not save your profile.');
  return result.name;
}

export function ProfileForm({ name, onSave }: { name: string; onSave: (name: string) => void }) {
  const [draft, setDraft] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const saved = await saveProfile(draft);
      setDraft(saved);
      onSave(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="profile-form" onSubmit={submit}>
      <label htmlFor="profile-display-name">Your name</label>
      <div>
        <input
          id="profile-display-name"
          autoComplete="nickname"
          value={draft}
          required
          maxLength={40}
          onChange={(e) => setDraft(e.target.value)}
          aria-describedby="profile-name-help"
        />
        <button className="secondary" disabled={busy || !draft.trim() || draft.trim() === name}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
      <p id="profile-name-help">
        This is how friends see you in the team. You can change your name anytime.
      </p>
      {error && (
        <p className="small-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

type Props = {
  name: string;
  theme: string;
  onTheme: (theme: string) => void;
  ready: boolean;
  status: string;
  canClose: boolean;
  onClose: () => void;
  onComplete: (name: string, destination: 'chat' | 'team') => void;
};
export default function ProfileSetup({
  name: initialName,
  theme,
  onTheme,
  ready,
  status,
  canClose,
  onClose,
  onComplete,
}: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [destination, setDestination] = useState<'chat' | 'team'>('chat');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (step > 0) heading.current?.focus();
  }, [step]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setStep(0);
      setError('What should we call you?');
      return;
    }
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      const saved = await saveProfile(name);
      onComplete(saved, destination);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && canClose && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="setup-overlay" />
        <Dialog.Content
          className="setup-dialog"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            if (!canClose || busy) e.preventDefault();
          }}
        >
          <div className="setup-top">
            <BrandLogo />
            <span>Getting started · {step + 1} of 3</span>
            {canClose && (
              <Dialog.Close className="icon-button" disabled={busy} aria-label="Close setup">
                <X size={17} />
              </Dialog.Close>
            )}
          </div>
          <div className="setup-progress" aria-label={`Step ${step + 1} of 3`}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={i <= step ? 'complete' : ''} />
            ))}
          </div>
          <SmoothHeight>
            <form onSubmit={submit}>
              <div className="setup-page" key={step}>
                <div className="setup-mark">
                  <AevoriMark />
                </div>
                <Dialog.Title ref={heading} tabIndex={-1}>
                  {
                    [
                      'A space for your ideas.',
                      'Make yourself at home.',
                      'Ready for your next thought.',
                    ][step]
                  }
                </Dialog.Title>
                <Dialog.Description>
                  {
                    [
                      'Welcome to Aevori. What should we call you?',
                      'Choose a look for your workspace.',
                      `Good to see you, ${name.trim()}. How would you like to start?`,
                    ][step]
                  }
                </Dialog.Description>
                {step === 0 && (
                  <div className="setup-name">
                    <label htmlFor="setup-name">Your name</label>
                    <input
                      id="setup-name"
                      placeholder="e.g. Alex"
                      autoComplete="nickname"
                      autoFocus
                      required
                      maxLength={40}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-describedby="setup-name-help"
                    />
                    <p id="setup-name-help">
                      This name also appears in your team when you work with friends. No account
                      needed.
                    </p>
                  </div>
                )}
                {step === 1 && (
                  <>
                    <div
                      className="theme-choices setup-themes"
                      role="group"
                      aria-label="Color scheme"
                    >
                      {[
                        { id: 'dark', name: 'Dark' },
                        { id: 'light', name: 'Light' },
                        { id: 'sand', name: 'Sand' },
                      ].map((t) => (
                        <button
                          type="button"
                          aria-pressed={theme === t.id}
                          className={`theme-choice ${t.id} ${theme === t.id ? 'selected' : ''}`}
                          key={t.id}
                          onClick={() => onTheme(t.id)}
                        >
                          <ThemePreview theme={t.id} />
                          <span>{t.name}</span>
                        </button>
                      ))}
                    </div>
                    <p className="setup-hint">You can change this later in Settings.</p>
                  </>
                )}
                {step === 2 && (
                  <>
                    <div
                      className="setup-destinations"
                      role="group"
                      aria-label="Your starting point"
                    >
                      <button
                        type="button"
                        aria-pressed={destination === 'chat'}
                        onClick={() => setDestination('chat')}
                      >
                        <MessageCircle size={22} />
                        <span>
                          <strong>Start on my own</strong>
                          <small>Chat, notes, and your ideas.</small>
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-pressed={destination === 'team'}
                        onClick={() => setDestination('team')}
                      >
                        <Users size={22} />
                        <span>
                          <strong>Work with friends</strong>
                          <small>See your team and set up access.</small>
                        </span>
                      </button>
                    </div>
                    <div className="setup-model-status">
                      <span className={`status-dot ${ready ? 'online' : ''}`} />
                      <span>{status}</span>
                    </div>
                  </>
                )}
              </div>
              {error && (
                <p className="error-banner" role="alert">
                  {error}
                </p>
              )}
              <div className="setup-actions">
                {step > 0 ? (
                  <button
                    type="button"
                    className="text-button"
                    disabled={busy}
                    onClick={() => {
                      setError('');
                      setStep(step - 1);
                    }}
                  >
                    <ArrowLeft size={15} />
                    Back
                  </button>
                ) : (
                  <span className="setup-local">
                    <ShieldCheck size={14} />
                    Your own workspace
                  </span>
                )}
                <button className="primary" disabled={busy || (step === 0 && !name.trim())}>
                  {busy ? 'Setting things up…' : step === 2 ? 'Open Aevori' : 'Continue'}
                  {step === 2 ? <ArrowUpRight size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
            </form>
          </SmoothHeight>
          <p className="setup-footer">Aevori — Intelligence, locally.</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
