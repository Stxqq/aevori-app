import {
  ArrowUp,
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  MessageCircle,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { AgentState } from './AgentWorkspace';
import ChatMarkdown from './ChatMarkdown';
import Companion from './Companion';
import './agent-messenger.css';
type Props = {
  state: AgentState;
  act: (path: string, body: unknown) => Promise<unknown>;
  onCharacter: () => void;
  onWork: () => void;
};
export default function AgentMessenger({ state, act, onCharacter, onWork }: Props) {
  const [mobile, setMobile] = useState(() => matchMedia('(max-width: 760px)').matches);
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState<'chat' | 'work'>('chat');
  const [sending, setSending] = useState(false);
  const [details, setDetails] = useState(false);
  const [selected, setSelected] = useState('');
  const [reminding, setReminding] = useState(false);
  const [reminder, setReminder] = useState('');
  const [at, setAt] = useState('');
  const [count, setCount] = useState(60);
  const [atBottom, setAtBottom] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const read = useRef('');
  const initialized = useRef(false);
  const contextPanel = useRef<HTMLElement>(null);
  const detailsButton = useRef<HTMLButtonElement>(null);
  const hadDetails = useRef(false);
  useEffect(() => {
    const media = matchMedia('(max-width: 760px)');
    const change = () => setMobile(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (details && mobile) contextPanel.current?.focus();
    else if (!details && hadDetails.current) detailsButton.current?.focus();
    hadDetails.current = details;
  }, [details, mobile]);
  const closeDetails = () => setDetails(false);
  const messages = state.messages ?? [];
  const running = state.runs.find((r) => r.status === 'running');
  const latest = messages.at(-1);
  const lastReply = [...messages].reverse().find((m) => m.role === 'assistant');
  const run =
    state.runs.find((r) => r.id === selected) ??
    state.runs.find((r) => r.mode !== 'chat' && !r.archived);
  const upcoming = (state.reminders ?? []).filter((r) => !r.deliveredAt);
  useEffect(() => {
    const el = scroller.current;
    if (el && (!initialized.current || atBottom)) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior:
          initialized.current &&
          document.documentElement.dataset.motion !== 'off' &&
          !matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'smooth'
            : 'instant',
      });
      initialized.current = true;
    }
  }, [latest?.id, Boolean(running), atBottom]);
  useEffect(() => {
    const mark = () => {
      if (
        document.visibilityState !== 'visible' ||
        (mobile && details) ||
        !atBottom ||
        !lastReply ||
        lastReply.created <= state.readAt ||
        read.current === lastReply.id
      )
        return;
      read.current = lastReply.id;
      void act('read', { id: lastReply.id })
        .then((result) => {
          if (!result) read.current = '';
        })
        .catch(() => {
          read.current = '';
        });
    };
    mark();
    document.addEventListener('visibilitychange', mark);
    return () => document.removeEventListener('visibilitychange', mark);
  }, [lastReply?.id, state.readAt, atBottom, mobile, details, act]);
  async function send() {
    if (!draft.trim() || sending || running) return;
    setSending(true);
    try {
      const result = await act('start', { goal: draft, mode });
      if (result) {
        setDraft('');
        setAtBottom(true);
        input.current?.focus();
      }
    } finally {
      setSending(false);
    }
  }
  return (
    <div
      className={`agent-messenger ${details ? 'has-details' : ''}`}
      style={{ '--agent-color': state.appearance.color } as CSSProperties}
    >
      <section
        className="agent-thread"
        inert={mobile && details}
        aria-label={`Messages with ${state.name}`}
      >
        <header className="agent-thread-header">
          <button
            className="agent-contact"
            onClick={onCharacter}
            aria-label={`Customize ${state.name}`}
          >
            <Companion appearance={state.appearance} active={!!running} size={56} />
            <span>
              <strong>{state.name}</strong>
              <small>
                <i className="status-dot online" />
                {running
                  ? running.mode === 'chat'
                    ? 'Typing…'
                    : 'Working on your assignment…'
                  : 'Your agent · on your Mac'}
              </small>
            </span>
          </button>
          <div>
            <button
              className="icon-button"
              aria-label="Schedule a reminder"
              aria-expanded={reminding}
              onClick={() => {
                setReminding(!reminding);
                setDetails(true);
              }}
            >
              <Bell size={18} />
            </button>
            <button
              ref={detailsButton}
              className="icon-button"
              aria-label={details ? 'Close workspace' : 'Open workspace'}
              aria-expanded={details}
              onClick={() => setDetails(!details)}
            >
              {details ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            </button>
          </div>
        </header>
        <div
          className="agent-thread-scroll"
          ref={scroller}
          onScroll={() => {
            const el = scroller.current;
            if (el) setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 100);
          }}
          role="log"
          aria-label="Agent messages"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.length > count && (
            <button className="thread-older" onClick={() => setCount(count + 60)}>
              Show earlier messages
            </button>
          )}
          {!messages.length && (
            <div className="agent-thread-intro">
              <button onClick={onCharacter} aria-label="Customize character">
                <Companion appearance={state.appearance} size={150} />
              </button>
              <h1>Hey, I'm {state.name}.</h1>
              <p>
                A place for your ideas.
                <br />
                And someone to think them through with.
              </p>
              <div>
                {["Let's think through an idea.", 'What can you help me with?'].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setDraft(t);
                      input.current?.focus();
                    }}
                  >
                    {t}
                    <ArrowUpRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.slice(-count).map((m, i, visible) => {
            const prior = visible[i - 1];
            const newDay =
              !prior ||
              new Date(prior.created).toDateString() !== new Date(m.created).toDateString();
            const result = state.runs.find((r) => r.id === m.runId);
            return (
              <div key={m.id} className="agent-message-entry">
                {newDay && (
                  <p className="thread-date">
                    {new Date(m.created).toLocaleDateString('en-US', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                )}
                <article className={`agent-chat-message ${m.role} ${m.kind || ''}`}>
                  {m.role === 'assistant' && <Companion appearance={state.appearance} size={34} />}
                  <div className="agent-chat-message-content">
                    <div className="agent-chat-bubble">
                      {m.kind === 'reminder' && (
                        <span className="thread-kind">
                          <Bell size={12} />
                          Your reminder
                        </span>
                      )}
                      {m.kind === 'work' && (
                        <span className="thread-kind">
                          <FileText size={12} />
                          Assignment
                        </span>
                      )}
                      <ChatMarkdown>{m.content}</ChatMarkdown>
                    </div>
                    <div className="agent-message-meta">
                      <time dateTime={new Date(m.created).toISOString()}>
                        {new Date(m.created).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                      {m.role === 'user' && (
                        <span>{result?.status === 'running' ? 'Delivered' : 'Sent'}</span>
                      )}
                      {m.kind === 'result' && result && (
                        <button
                          onClick={() => {
                            setSelected(result.id);
                            setDetails(true);
                          }}
                        >
                          {result.actions.some((a) => a.status === 'pending')
                            ? 'Review result'
                            : 'View assignment'}
                          <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
          {running && (
            <div className="agent-chat-message assistant agent-is-typing">
              <Companion appearance={state.appearance} active size={34} />
              <div>
                <div
                  className="typing-dots"
                  role="status"
                  aria-label={`${state.name} ${running.mode === 'chat' ? 'is typing' : 'is working'}`}
                >
                  <i />
                  <i />
                  <i />
                </div>
                <small>{running.mode === 'chat' ? 'Typing…' : 'Preparing your assignment…'}</small>
              </div>
            </div>
          )}
        </div>
        <footer className="agent-thread-footer">
          {!atBottom && (
            <button
              className="thread-latest"
              onClick={() => {
                setAtBottom(true);
              }}
            >
              Jump to latest messages ↓
            </button>
          )}
          <form
            className="agent-message-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              ref={input}
              aria-label={`Message ${state.name}`}
              rows={1}
              value={draft}
              maxLength={6000}
              placeholder={
                mode === 'chat'
                  ? `Message ${state.name} …`
                  : 'What would you like your agent to prepare?'
              }
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <div className="agent-composer-toolbar">
              <div className="agent-compose-mode" aria-label="Message type">
                <button
                  type="button"
                  aria-pressed={mode === 'chat'}
                  onClick={() => setMode('chat')}
                >
                  <MessageCircle size={13} />
                  Message
                </button>
                <button
                  type="button"
                  aria-pressed={mode === 'work'}
                  onClick={() => setMode('work')}
                >
                  <Plus size={13} />
                  Assignment
                </button>
              </div>
              {running ? (
                <button
                  type="button"
                  className="agent-send"
                  aria-label="Stop agent"
                  onClick={() => void act('stop', { id: running.id })}
                >
                  <Square size={15} />
                </button>
              ) : (
                <button
                  className="agent-send"
                  aria-label="Send message"
                  disabled={sending || !draft.trim()}
                >
                  <ArrowUp size={18} />
                </button>
              )}
            </div>
          </form>
          <p>
            Private on your Mac.{' '}
            {mode === 'work'
              ? 'Review drafts before saving.'
              : 'A conversation that stays with you.'}
          </p>
        </footer>
      </section>
      {details && (
        <aside
          ref={contextPanel}
          tabIndex={-1}
          className="agent-context"
          role={mobile ? 'dialog' : 'complementary'}
          aria-modal={mobile ? true : undefined}
          aria-label="Workspace"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              closeDetails();
            }
            if (mobile && e.key === 'Tab') {
              const buttons = Array.from(
                e.currentTarget.querySelectorAll<HTMLElement>(
                  'button:not(:disabled), input, textarea, [href], summary',
                ),
              );
              const first = buttons[0];
              const last = buttons.at(-1);
              if (
                e.shiftKey &&
                (document.activeElement === first || document.activeElement === e.currentTarget)
              ) {
                e.preventDefault();
                last?.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
              }
            }
          }}
        >
          <div className="agent-context-heading">
            <span>Workspace</span>
            <button className="icon-button" aria-label="Close details" onClick={closeDetails}>
              <X size={16} />
            </button>
          </div>
          {reminding && (
            <form
              className="agent-reminder-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const result = await act('remind', {
                  text: reminder,
                  at: new Date(String(new FormData(e.currentTarget).get('reminderAt'))).getTime(),
                });
                if (result) {
                  setReminding(false);
                  setReminder('');
                  setAt('');
                }
              }}
            >
              <h2>I'll remind you.</h2>
              <p>Your agent sends a message here at the time you choose.</p>
              <label>
                What should I remind you about?
                <input
                  required
                  maxLength={500}
                  value={reminder}
                  onChange={(e) => setReminder(e.target.value)}
                  placeholder="For example: Review the draft"
                />
              </label>
              <label>
                Date & time
                <input
                  required
                  name="reminderAt"
                  type="datetime-local"
                  value={at}
                  onInput={(e) => setAt(e.currentTarget.value)}
                  onChange={(e) => setAt(e.target.value)}
                />
              </label>
              <button className="primary">
                Save reminder
                <Bell size={13} />
              </button>
              <small>
                AEVORI must be running on your Mac. After a pause, the message arrives at the next
                launch.
              </small>
            </form>
          )}
          {upcoming.length > 0 && (
            <section className="agent-upcoming">
              <h2>Scheduled</h2>
              {upcoming.map((r) => (
                <div key={r.id}>
                  <Bell size={14} />
                  <span>
                    {r.text}
                    <small>
                      {new Date(r.at).toLocaleString('en-US', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                  </span>
                  <button
                    className="icon-button"
                    aria-label={`Remove reminder: ${r.text}`}
                    onClick={() => void act('cancel-reminder', { id: r.id })}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </section>
          )}
          {run ? (
            <section className="agent-context-run">
              <span className="context-eyebrow">
                {run.status === 'running'
                  ? 'IN PROGRESS'
                  : run.actions.some((a) => a.status === 'pending')
                    ? 'READY TO REVIEW'
                    : 'YOUR ASSIGNMENT'}
              </span>
              <h2>{run.goal}</h2>
              {run.steps.length > 0 && (
                <ol className="context-plan">
                  {run.steps.map((step, i) => (
                    <li key={i}>
                      <span>{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              )}
              {run.actions.map((a) => (
                <article className="context-artifact" key={a.id}>
                  <header>
                    <FileText size={16} />
                    <strong>{a.title}</strong>
                  </header>
                  <div>
                    <ChatMarkdown>{a.content}</ChatMarkdown>
                  </div>
                  <footer>
                    {a.status === 'pending' ? (
                      <>
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
                          <Check size={13} />
                          Save
                        </button>
                      </>
                    ) : (
                      <span>
                        {a.status === 'approved'
                          ? 'Saved to your workspace'
                          : a.status === 'blocked'
                            ? 'Blocked by your rule'
                            : 'Not saved'}
                      </span>
                    )}
                  </footer>
                </article>
              ))}
              {run.error && <p className="small-error">{run.error}</p>}
              <details className="context-activity">
                <summary>
                  <Clock3 size={14} />
                  Activity
                </summary>
                {run.events.map((e, i) => (
                  <p key={i}>{e.text}</p>
                ))}
              </details>
              <button className="text-button" onClick={onWork}>
                All assignments
                <ArrowUpRight size={14} />
              </button>
            </section>
          ) : (
            !reminding && (
              <div className="agent-context-empty">
                <Companion appearance={state.appearance} size={96} />
                <h2>Room for what comes next.</h2>
                <p>Plans, notes, and next steps appear here when you start an assignment.</p>
                <button
                  className="secondary"
                  onClick={() => {
                    setMode('work');
                    input.current?.focus();
                  }}
                >
                  Write your first assignment
                  <ArrowUpRight size={14} />
                </button>
              </div>
            )
          )}
        </aside>
      )}
    </div>
  );
}
