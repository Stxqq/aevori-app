import {
  ArrowUp,
  ArrowUpRight,
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  ListTodo,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  Square,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { appearanceForTone, type CharacterAppearance } from '../../shared/character.mjs';
import AevoriSelect from './AevoriSelect';
import AgentMessenger from './AgentMessenger';
import CharacterEditor from './CharacterEditor';
import ChatMarkdown from './ChatMarkdown';
import Companion from './Companion';
import './agent.css';
export type AgentArtifact = {
  id: string;
  kind: 'note' | 'task';
  title: string;
  content: string;
  created: number;
};
type Action = AgentArtifact & { status: 'pending' | 'approved' | 'rejected' | 'blocked' };
type Run = {
  mode?: 'chat' | 'work';
  id: string;
  goal: string;
  model: string;
  status: string;
  summary: string;
  steps: string[];
  actions: Action[];
  error?: string;
  created: number;
  events: { text: string; at: number }[];
  archived?: boolean;
};
export type AgentState = {
  name: string;
  tone: string;
  appearance: CharacterAppearance;
  characterConfigured: boolean;
  memoryEnabled: boolean;
  memories: { id: string; kind: string; content: string }[];
  policy: { note: string; task: string };
  runs: Run[];
  artifacts: AgentArtifact[];
  messages: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created: number;
    runId?: string;
    kind?: string;
  }[];
  reminders: { id: string; text: string; at: number; deliveredAt?: number }[];
  readAt: number;
};
const statuses: Record<string, string> = {
  running: 'Working on your Mac',
  review: 'Waiting for you',
  done: 'Saved',
  reviewed: 'Reviewed',
  stopped: 'Stopped',
  interrupted: 'Interrupted',
  error: 'Needs another try',
};
export function useAgent() {
  const [state, setState] = useState<AgentState | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch('/api/agent/state');
        if (!r.ok) throw new Error('Your agent is currently unavailable.');
        const d = await r.json();
        if (alive) {
          setState(d);
          setError('');
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Unavailable.');
      }
    };
    void load();
    const t = setInterval(load, 2500);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  const action = async (path: string, body: unknown) => {
    const r = await fetch('/api/agent/' + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Could not save the change.');
    if (d.runs) setState(d);
    else if (path === 'start')
      setState((current) =>
        current
          ? { ...current, runs: [d, ...current.runs.filter((run) => run.id !== d.id)] }
          : current,
      );
    return d;
  };
  return { state, error, action };
}
type Props = {
  agent: ReturnType<typeof useAgent>;
  onOpen: (view: 'models' | 'notes' | 'tasks' | 'team') => void;
  onChat: () => void;
  initialTab?: string;
};
export default function AgentWorkspace({ agent, onOpen, onChat, initialTab = 'chat' }: Props) {
  const characterButton = useRef<HTMLButtonElement>(null);
  const characterLauncher = useRef<HTMLElement | null>(null);
  const openCharacter = () => {
    characterLauncher.current = document.activeElement as HTMLElement;
    setEditing(true);
  };
  const [tab, setTab] = useState(initialTab);
  const [goal, setGoal] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [kind, setKind] = useState('prefer');
  const [memory, setMemory] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState(false);
  const [characterSaved, setCharacterSaved] = useState(false);
  const state = agent.state;
  const active = state?.runs.some((r) => r.status === 'running');
  const pending =
    state?.runs.reduce((n, r) => n + r.actions.filter((a) => a.status === 'pending').length, 0) ||
    0;
  const act = async (path: string, body: unknown) => {
    setError('');
    try {
      return await agent.action(path, body);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
      return null;
    }
  };
  if (!state)
    return (
      <div className="agent-loading">
        <Companion active />
        <p role="status">{agent.error || 'Opening your agent…'}</p>
      </div>
    );
  return (
    <div className={`agent-space ${tab === 'chat' ? 'messenger-space' : ''}`}>
      {tab !== 'chat' && (
        <>
          <div className="agent-top">
            <div className="agent-local">
              <span className="status-dot online" />
              On your Mac
            </div>
            <button
              ref={characterButton}
              className="character-create-button"
              onClick={() => {
                setCharacterSaved(false);
                openCharacter();
              }}
            >
              <Settings2 size={15} />
              {state.characterConfigured ? 'Edit character' : 'Create character'}
            </button>
          </div>
          <header className={`agent-welcome ${state.runs.length ? 'compact' : ''}`}>
            <Companion appearance={state.appearance} tone={state.tone} active={active} size={136} />
            <h1>
              {state.name}
              <span>Your personal agent.</span>
            </h1>
            <p>
              {active
                ? "I'm working on your assignment."
                : pending
                  ? 'A result is waiting for your decision.'
                  : 'What shall we work on today?'}
            </p>
          </header>
          {!state.characterConfigured && (
            <section className="character-first-visit">
              <div>
                <strong>A character of your own.</strong>
                <p>Choose a name, a shape, and the details that feel like you.</p>
              </div>
              <button className="primary" onClick={openCharacter}>
                Make it yours
                <ArrowUpRight size={15} />
              </button>
            </section>
          )}
        </>
      )}
      {characterSaved && (
        <p className="character-saved" role="status">
          <Check size={14} />
          Your character has been saved.
        </p>
      )}
      {editing && (
        <CharacterEditor
          name={state.name}
          appearance={state.appearance ?? appearanceForTone(state.tone)}
          configured={state.characterConfigured}
          onClose={() => setEditing(false)}
          onReturnFocus={() =>
            (characterLauncher.current ?? characterButton.current)?.focus({ preventScroll: true })
          }
          onSave={async (draft) => {
            await agent.action('profile', draft);
            setCharacterSaved(true);
          }}
        />
      )}

      <nav className="agent-tabs" aria-label="Agent sections">
        {[
          ['chat', 'Messages'],
          ['work', 'Assignments'],
          ['memory', 'Memory'],
          ['rules', 'Rules'],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => setTab(id)}
          >
            {label}
            {id === 'work' && pending > 0 && <span>{pending}</span>}
          </button>
        ))}
      </nav>
      {(error || agent.error) && (
        <div className="error-banner" role="alert">
          {error || agent.error}
        </div>
      )}
      {tab === 'chat' && (
        <AgentMessenger
          state={state}
          act={act}
          onCharacter={openCharacter}
          onWork={() => setTab('work')}
        />
      )}
      {tab === 'work' && (
        <>
          <form
            className="agent-brief"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!goal.trim()) return;
              setSending(true);
              const d = await act('start', { goal });
              if (d) setGoal('');
              setSending(false);
            }}
          >
            <label className="sr-only" htmlFor="agent-goal">
              Assignment for your agent
            </label>
            <textarea
              id="agent-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              maxLength={6000}
              rows={3}
              placeholder="An idea, a goal, or something to get done…"
            />
            <div>
              <span>
                <LockKeyhole size={13} />
                Local AI. Your rules.
              </span>
              <button
                className="agent-send"
                aria-label="Start assignment"
                disabled={sending || active || !goal.trim()}
              >
                {sending ? <Clock3 size={19} /> : <ArrowUp size={20} />}
              </button>
            </div>
          </form>
          {!state.runs.length && (
            <div className="agent-examples">
              {[
                'Create a clear weekly plan with three priorities.',
                'Draft a short project brief and the next tasks.',
              ].map((t) => (
                <button key={t} onClick={() => setGoal(t)}>
                  {t}
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </div>
          )}
          <div className="agent-list-options">
            <button className="text-button" onClick={() => setShowArchived(!showArchived)}>
              {showArchived
                ? 'Current assignments'
                : `Archive (${state.runs.filter((r) => r.mode !== 'chat' && r.archived).length})`}
            </button>
          </div>
          <div className="agent-run-list">
            {state.runs
              .filter((r) => r.mode !== 'chat' && Boolean(r.archived) === showArchived)
              .map((run) => (
                <article className="agent-run" key={run.id}>
                  <div className="agent-run-heading">
                    <span className={`agent-run-status ${run.status}`}>
                      {run.status === 'running' ? (
                        <Clock3 size={13} />
                      ) : run.status === 'review' ? (
                        <ShieldCheck size={13} />
                      ) : (
                        <Check size={13} />
                      )}{' '}
                      {statuses[run.status] || run.status}
                    </span>
                    <time>
                      {new Date(run.created).toLocaleString('en-US', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                  <h2>{run.goal}</h2>
                  {run.status === 'running' ? (
                    <div className="agent-running">
                      <Companion appearance={state.appearance} tone={state.tone} active size={40} />
                      <span>Creating the plan and drafts.</span>
                      <button
                        className="secondary"
                        onClick={() => void act('stop', { id: run.id })}
                      >
                        <Square size={12} />
                        Stop
                      </button>
                    </div>
                  ) : (
                    <>
                      {run.error && <p className="small-error">{run.error}</p>}
                      {run.summary && (
                        <div className="agent-summary">
                          <ChatMarkdown>{run.summary}</ChatMarkdown>
                        </div>
                      )}
                    </>
                  )}
                  {run.steps.length > 0 && (
                    <details className="agent-plan">
                      <summary>
                        Work plan
                        <ChevronDown size={14} />
                      </summary>
                      <ol>
                        {run.steps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                    </details>
                  )}
                  {run.actions.map((a) => (
                    <section className="agent-action" key={a.id}>
                      <div className="agent-action-title">
                        {a.kind === 'note' ? <FileText size={16} /> : <ListTodo size={16} />}
                        <strong>{a.title}</strong>
                        <span>{a.kind === 'note' ? 'Note' : 'Task'}</span>
                      </div>
                      <div className="agent-action-content">
                        <ChatMarkdown>{a.content}</ChatMarkdown>
                      </div>
                      {a.status === 'pending' ? (
                        <div className="agent-approval">
                          <span>Save to your workspace?</span>
                          <button
                            className="secondary"
                            onClick={() =>
                              void act('decide', {
                                runId: run.id,
                                actionId: a.id,
                                decision: 'reject',
                              })
                            }
                          >
                            Decline
                          </button>
                          <button
                            className="primary"
                            onClick={() =>
                              void act('decide', {
                                runId: run.id,
                                actionId: a.id,
                                decision: 'approve',
                              })
                            }
                          >
                            <Check size={14} />
                            Save
                          </button>
                        </div>
                      ) : (
                        <p className="agent-action-result">
                          {a.status === 'approved'
                            ? 'Saved'
                            : a.status === 'blocked'
                              ? 'Blocked by your rule'
                              : 'Not saved'}
                        </p>
                      )}
                    </section>
                  ))}
                  {run.status !== 'running' && (
                    <div className="agent-run-footer">
                      <button
                        onClick={() => {
                          setTab('memory');
                          setKind('prefer');
                          setMemory('');
                        }}
                      >
                        Remember feedback
                        <Brain size={13} />
                      </button>
                      <details>
                        <summary>Activity</summary>
                        {run.events.map((e, i) => (
                          <p key={i}>
                            {new Date(e.at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            · {e.text}
                          </p>
                        ))}
                      </details>
                      <button
                        onClick={() => void act('archive', { id: run.id, archived: !run.archived })}
                      >
                        {run.archived ? 'Restore' : 'Archive'}
                      </button>
                    </div>
                  )}
                </article>
              ))}
          </div>
          <div className="agent-tools">
            <button onClick={() => onOpen('notes')}>
              <FileText size={17} />
              Notes
              <ChevronRight size={14} />
            </button>
            <button onClick={() => onOpen('tasks')}>
              <ListTodo size={17} />
              Tasks
              <ChevronRight size={14} />
            </button>
            <button onClick={onChat}>
              Just chat
              <ArrowUpRight size={15} />
            </button>
          </div>
          <p className="agent-footnote">
            Assignments continue on the main Mac while AEVORI and Ollama are running. The agent
            creates plans and content. It cannot access your browser, email, purchases, or arbitrary
            files.
          </p>
        </>
      )}
      {tab === 'memory' && (
        <section className="agent-memory">
          <div className="agent-setting-row">
            <div>
              <h2>What your agent knows about you.</h2>
              <p>Confirmed memories are included in local chats and agent assignments.</p>
            </div>
            <button
              role="switch"
              aria-checked={state.memoryEnabled}
              aria-label="Use memory"
              className={`toggle ${state.memoryEnabled ? 'on' : ''}`}
              onClick={() => void act('profile', { memoryEnabled: !state.memoryEnabled })}
            >
              <i />
            </button>
          </div>
          <form
            className="agent-memory-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await act('memory', { kind, content: memory })) setMemory('');
            }}
          >
            <AevoriSelect
              label="Memory type"
              value={kind}
              onValueChange={setKind}
              options={[
                { value: 'prefer', label: 'This works for me · prefer' },
                { value: 'avoid', label: 'Avoid this' },
                { value: 'fact', label: 'About me' },
              ]}
            />
            <textarea
              aria-label="New memory"
              value={memory}
              onChange={(e) => setMemory(e.target.value)}
              maxLength={600}
              rows={3}
              placeholder={
                kind === 'avoid'
                  ? 'For example: Avoid unnecessarily long introductions.'
                  : 'For example: I like clear answers with one concrete next step.'
              }
            />
            <button className="primary" disabled={!memory.trim()}>
              Confirm memory
            </button>
          </form>
          <p className="agent-footnote">
            Only information you confirm is saved. Sensitive details are not added automatically,
            and model weights are not trained. Turning memory off keeps entries saved but excludes
            them from requests. Muse does not receive these memories.
          </p>
          <div className="agent-memory-list">
            {state.memories.map((m) => (
              <article key={m.id}>
                <span>
                  {m.kind === 'prefer' ? 'Prefer' : m.kind === 'avoid' ? 'Avoid' : 'About me'}
                </span>
                <p>{m.content}</p>
                <button
                  className="icon-button"
                  aria-label={`Delete memory: ${m.content}`}
                  onClick={() => void act('forget', { id: m.id })}
                >
                  <Trash2 size={15} />
                </button>
              </article>
            ))}
          </div>
          {!state.memories.length && (
            <p className="agent-empty">No memories yet. You decide what stays.</p>
          )}
        </section>
      )}
      {tab === 'rules' && (
        <section className="agent-rules">
          <h2>You decide what's okay.</h2>
          <p>AEVORI checks these rules. Your agent cannot change them itself.</p>
          {[
            ['note', 'Save notes', 'Keep drafts in your workspace.'],
            ['task', 'Create tasks', 'Save concrete next steps.'],
          ].map(([key, label, description]) => (
            <div className="agent-setting-row" key={key}>
              <div>
                <h3>{label}</h3>
                <p>{description}</p>
              </div>
              <AevoriSelect
                label={label}
                value={state.policy[key as 'note' | 'task']}
                onValueChange={(value) => void act('profile', { policy: { [key]: value } })}
                options={[
                  { value: 'ask', label: 'Review first' },
                  { value: 'allow', label: 'Save automatically' },
                  { value: 'block', label: "Don't allow" },
                ]}
              />
            </div>
          ))}
          <div className="agent-boundaries">
            <LockKeyhole size={19} />
            <div>
              <strong>Your workspace has clear boundaries.</strong>
              <p>
                No commands, emails, purchases, or external changes. Each team member has separate
                assignments and memories.
              </p>
            </div>
          </div>
          <button
            className="secondary"
            onClick={() => {
              const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'aevori-agent.json';
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            <Download size={15} />
            Export agent data
          </button>
          <button className="text-button" onClick={() => onOpen('models')}>
            Manage local models
            <ChevronRight size={14} />
          </button>
        </section>
      )}
    </div>
  );
}
