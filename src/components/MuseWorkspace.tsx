import {
  ArrowUpRight,
  Check,
  ChevronRight,
  ImagePlus,
  Link2,
  MessageCircle,
  NotebookPen,
  Terminal,
} from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import type { workspaceStorage } from '../storage';
import Companion from './Companion';
import './muse.css';

export type MuseAppearance = { name: string; avatar: string };
export const defaultMuse: MuseAppearance = { name: 'Aeri', avatar: '' };
export function MuseAvatar({
  appearance,
  active = false,
  small = false,
}: {
  appearance: MuseAppearance;
  active?: boolean;
  small?: boolean;
}) {
  return (
    <span className={`muse-avatar ${small ? 'small' : ''} ${active ? 'working' : ''}`}>
      {appearance.avatar.startsWith('data:image/') ? (
        <img src={appearance.avatar} alt={small ? '' : appearance.name} />
      ) : (
        <Companion tone="lavender" active={active} size={small ? 32 : 180} />
      )}
    </span>
  );
}
type Props = {
  appearance: MuseAppearance;
  onAppearance: (a: MuseAppearance) => void;
  storage: ReturnType<typeof workspaceStorage>;
  connected: boolean;
  busy: boolean;
  status: string;
  owner: boolean;
  cliInstalled: boolean;
  model: string;
  tasks: { id: string; text: string; done: boolean }[];
  onTask: (id: string) => void;
  onOpen: (view: 'tasks' | 'notes' | 'team') => void;
  onStart: (text?: string, mode?: string) => void;
  onConnect: () => void;
};
export default function MuseWorkspace(p: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(p.appearance.name);
  const [error, setError] = useState('');
  const upload = useRef<HTMLInputElement>(null);
  const save = (next: MuseAppearance) => {
    try {
      p.storage.write('aevori-muse-appearance', next);
      p.onAppearance(next);
      setError('');
      return true;
    } catch {
      setError('Your browser storage is full. The image was not saved.');
      return false;
    }
  };
  const importAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
      setError('Choose a PNG, JPG, or WebP image up to 1 MB.');
      return;
    }
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = data;
      });
      save({ ...p.appearance, avatar: data });
    } catch {
      setError('Could not open the image. Choose another file.');
    }
  };
  const ideas = [
    {
      icon: NotebookPen,
      title: 'Turn an idea into a plan.',
      detail: 'Find the next steps',
      mode: 'general',
      prompt:
        'Help me turn my idea into a concrete plan with clear next steps. First, ask me what I want to achieve.',
    },
    {
      icon: MessageCircle,
      title: 'Find the right words.',
      detail: 'Work on a draft together',
      mode: 'writing',
      prompt:
        'Help me improve a piece of writing. First, ask about my draft, audience, and preferred tone.',
    },
    {
      icon: Terminal,
      title: 'Build something of your own.',
      detail: 'Think through code and design',
      mode: 'code',
      prompt:
        "Let's build a small app. Help me define its most important feature and suggest a manageable first step.",
    },
  ];
  return (
    <div className="muse-workspace">
      <div className="muse-heading">
        <div className="muse-wordmark">
          <strong>Cloud AI</strong>
          <span>API connection in AEVORI</span>
        </div>
        <span className="muse-connection">
          <i className={p.connected ? 'ready' : ''} />
          {p.connected ? 'Connected to Meta' : 'Not connected yet'}
        </span>
      </div>
      <div className="muse-intro">
        <div className="muse-intro-copy">
          <span className="muse-kicker">One thought. So many possibilities.</span>
          <h1>
            Make more
            <br />
            of your ideas.
          </h1>
          <p>
            A place to think, write, and move forward. Optionally with Muse Spark through the Meta
            Model API.
          </p>
          <div className="muse-start">
            <button className="primary" disabled={p.busy} onClick={() => p.onStart()}>
              {p.connected ? 'Chat with Muse' : 'Connect Muse'}
              <ArrowUpRight size={17} />
            </button>
            <a href="https://dev.meta.ai/" target="_blank" rel="noreferrer">
              Open API dashboard
              <ArrowUpRight size={14} />
            </a>
          </div>
          <span className="muse-cloud-note">Muse Spark processes your requests at Meta.</span>
        </div>
        <div className="muse-character">
          <MuseAvatar appearance={p.appearance} active={p.busy && p.connected} />
          <div className="muse-character-name">
            {p.appearance.name}
            <button
              className="icon-button"
              aria-label="Customize character"
              onClick={() => {
                setDraft(p.appearance.name);
                setEditing(!editing);
              }}
            >
              <ImagePlus size={16} />
            </button>
          </div>
          <p role="status">
            {p.connected
              ? p.busy
                ? p.status
                : 'Ready for your next thought.'
              : 'Your AEVORI character is waiting for a connection.'}
          </p>
          <span className="muse-attribution">
            {!p.appearance.avatar.startsWith('data:image/') ? (
              <span>AEVORI character</span>
            ) : (
              'Your avatar · saved on this device'
            )}
          </span>
        </div>
      </div>
      {editing && (
        <form
          className="muse-personalize"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim() && save({ ...p.appearance, name: draft.trim() })) setEditing(false);
          }}
        >
          <label>
            Your character's name
            <input
              value={draft}
              maxLength={32}
              onChange={(e) => setDraft(e.target.value)}
              required
            />
          </label>
          <input
            ref={upload}
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-label="Upload character image"
            onChange={(e) => void importAvatar(e)}
          />
          <button className="secondary" type="button" onClick={() => upload.current?.click()}>
            <ImagePlus size={16} />
            Custom image
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => save({ ...p.appearance, avatar: defaultMuse.avatar })}
          >
            AEVORI character
          </button>
          <button className="primary" disabled={!draft.trim()}>
            Save
          </button>
          <p>
            Your name and image stay in this browser. Only use images you have the rights to use.
          </p>
        </form>
      )}
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      <div className="muse-section-heading">
        <h2>Where shall we start?</h2>
        <span>Ideas for your first step</span>
      </div>
      <div className="muse-ideas">
        {ideas.map((idea) => (
          <button
            key={idea.mode}
            disabled={p.busy}
            onClick={() => p.onStart(idea.prompt, idea.mode)}
          >
            <idea.icon size={20} />
            <strong>{idea.title}</strong>
            <span>
              {idea.detail}
              <ArrowUpRight size={15} />
            </span>
          </button>
        ))}
      </div>
      <div className="muse-lower">
        <section className="muse-goals">
          <div className="muse-section-heading">
            <h2>Your next steps</h2>
            <button className="text-button" onClick={() => p.onOpen('tasks')}>
              All tasks
              <ChevronRight size={14} />
            </button>
          </div>
          {p.tasks.some((t) => !t.done) ? (
            p.tasks
              .filter((t) => !t.done)
              .slice(0, 3)
              .map((t) => (
                <div className="muse-goal" key={t.id}>
                  <button aria-label={`Complete: ${t.text}`} onClick={() => p.onTask(t.id)}>
                    <Check size={14} />
                  </button>
                  <span>{t.text}</span>
                </div>
              ))
          ) : (
            <p>Keep track of what matters. Turn responses directly into tasks.</p>
          )}
          <div className="muse-shortcuts">
            <button onClick={() => p.onOpen('notes')}>
              <NotebookPen size={16} />
              Your notes
            </button>
            <button onClick={() => p.onOpen('team')}>
              <Link2 size={16} />
              Work with friends
            </button>
          </div>
        </section>
        <section className="muse-setup">
          <h2>Your connection</h2>
          <p>
            <i className={p.connected ? 'ready' : ''} />
            {p.connected ? p.model : 'Muse Spark · Standard'}
          </p>
          <span>
            Text, images, and adjustable reasoning effort. The connection uses your Meta API key.
          </span>
          {p.owner && (
            <button className="text-button" disabled={p.busy} onClick={p.onConnect}>
              {p.connected ? 'Edit connection' : 'Add an API key'}
              <ChevronRight size={14} />
            </button>
          )}
          <div className="muse-cli">
            <Terminal size={15} />
            <span>
              {p.cliInstalled
                ? 'Muse Code is installed on this Mac.'
                : 'Muse Code is available separately.'}
            </span>
            <a
              href="https://dev.meta.ai/docs/muse-code/auth"
              target="_blank"
              rel="noreferrer"
              aria-label="Muse Code sign-in"
            >
              <ArrowUpRight size={14} />
            </a>
          </div>
        </section>
      </div>
      <p className="muse-limit">
        An independent API client, not a Meta product. Muse Spark runs inside AEVORI here. Your
        personal Muse account, its memories, and background actions are not synced. You can save
        responses as notes or tasks.
      </p>
    </div>
  );
}
