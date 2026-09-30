import { formatBytes as bytes } from './lib/format-bytes';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import AevoriMark from './AevoriMark';
import { imageDataUrl, setAttachmentWorkspace, type PreparedAttachments } from './attachments';
import { branchAt, wireContent, type Message } from './chat-state';
import AevoriSelect from './components/AevoriSelect';
import AgentWorkspace, { useAgent } from './components/AgentWorkspace';
import type { SidebarNavGroup, View } from './components/app-shared';
import { AppShell } from './components/app-shell';
import { AppSidebar } from './components/app-sidebar';
import BrandLogo from './components/BrandLogo';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import Companion from './components/Companion';
import ModelEcosystem from './components/ModelEcosystem';
import ModelInstall from './components/ModelInstall';
import ModelLogo from './components/ModelLogo';
import ModelSelect from './components/ModelSelect';
import MuseWorkspace, {
  MuseAvatar,
  defaultMuse,
  type MuseAppearance,
} from './components/MuseWorkspace';
import NotesPanel from './components/NotesPanel';
import ProfileSetup from './components/ProfileSetup';
import SettingsPage, { type SettingsTab } from './components/SettingsPage';
import SystemPanel from './components/SystemPanel';
import TasksPanel from './components/TasksPanel';
import TeamPanel, { type Session } from './components/TeamPanel';
import { modelInfo, modelLabel } from './model-catalog';
import {
  Activity,
  ArrowUpRight,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  HardDrive,
  Link2,
  MessageCircle,
  Network,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from './MotionIcon';
import PoolPanel, { type PoolState } from './PoolPanel';
import { workspaceStorage } from './storage';

import Modal from './components/Modal';
import { NAV } from './navigation';
import type { Chat, Model, Note, Provider, Stats, Task } from './types';
const uid = () => crypto.randomUUID();
function Mark({ small = false, busy = false }: { small?: boolean; busy?: boolean }) {
  return <AevoriMark small={small} busy={busy} />;
}

export default function App({ session }: { session: Session }) {
  const isOwner = session.role === 'owner';
  const agent = useAgent();
  const storage = useMemo(
    () => workspaceStorage(session.role, session.id),
    [session.role, session.id],
  );
  const saved = <T,>(key: string, fallback: T): T => storage.read(key, fallback);
  setAttachmentWorkspace(isOwner ? 'owner' : session.id);
  useEffect(() => {
    const ping = () =>
      void fetch('/api/team/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }).catch(() => {});
    ping();
    const t = setInterval(ping, 15000);
    return () => clearInterval(t);
  }, []);
  const [view, setView] = useState<View>('chat');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('profile');
  const [agentSection, setAgentSection] = useState('chat');
  const [connectOpen, setConnectOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const mainContentRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainContentRef.current?.scrollTo({ top: 0 });
  }, [view]);
  const [theme, setTheme] = useState(saved('aevori-theme', 'dark'));
  const [glass, setGlass] = useState(saved('aevori-glass', true));
  const [stats, setStats] = useState<Stats | null>(null);
  const [systemError, setSystemError] = useState('');
  const [history, setHistory] = useState<number[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [provider, setProvider] = useState<Provider>({
    type: 'ollama',
    baseUrl: 'http://127.0.0.1:11434',
    local: true,
    hasKey: false,
  });
  const [connected, setConnected] = useState(false);
  const [model, setModel] = useState(saved('aevori-model', ''));
  const [connectionError, setConnectionError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [museAppearance, setMuseAppearance] = useState<MuseAppearance>(
    saved('aevori-muse-appearance', defaultMuse),
  );
  const [museCliInstalled, setMuseCliInstalled] = useState(false);
  const museDraft = useRef<{ text: string; mode: string } | null>(null);
  const museConnected = connected && provider.brand === 'meta-muse';
  useEffect(() => {
    if (isOwner)
      void fetch('/api/muse/status')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setMuseCliInstalled(d?.cliInstalled === true))
        .catch(() => {});
  }, [isOwner]);
  const [form, setForm] = useState({
    type: 'ollama',
    baseUrl: 'http://127.0.0.1:11434',
    apiKey: '',
  });
  const [connecting, setConnecting] = useState(false);
  const [formError, setFormError] = useState('');
  const [chats, setChats] = useState<Chat[]>(saved('aevori-chats', []));
  const [chatId, setChatId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [chatError, setChatError] = useState('');
  const [includeContext, setIncludeContext] = useState(false);
  const [status, setStatus] = useState('');
  const [requestStartedAt, setRequestStartedAt] = useState<number | null>(null);
  const [notes, setNotes] = useState<Note[]>(saved('aevori-notes', []));
  const [noteId, setNoteId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>(saved('aevori-tasks', []));

  const [taskText, setTaskText] = useState('');
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('medium');
  const [workMode, setWorkMode] = useState(saved('aevori-work-mode', 'general'));
  const [editing, setEditing] = useState<{ index: number; text: string } | null>(null);
  const [taskDraft, setTaskDraft] = useState<string | null>(null);
  const [responseLength, setResponseLength] = useState(saved('aevori-response-length', 'normal'));
  const [creativity, setCreativity] = useState('balanced');
  const [reasoning, setReasoning] = useState('auto');
  const [thinking, setThinking] = useState<(string | boolean)[]>([]);
  useEffect(() => {
    setReasoning('auto');
    setThinking([]);
    if (!model || model === '__auto__') return;
    let alive = true;
    void fetch('/api/model/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (alive) setThinking(d.thinking || []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [model, provider.baseUrl]);
  useEffect(() => {
    storage.write('aevori-work-mode', workMode);
    storage.write('aevori-response-length', responseLength);
  }, [workMode, responseLength]);
  const [pool, setPool] = useState<PoolState>({ nodes: [], sharing: false });
  const [usePool, setUsePool] = useState(false);
  const [profileName, setProfileName] = useState(
    session.profileConfigured
      ? session.name || ''
      : session.role === 'member'
        ? session.name || ''
        : '',
  );
  const [motion, setMotion] = useState(saved('aevori-motion', true));
  const [profileConfigured, setProfileConfigured] = useState(session.profileConfigured === true);
  const [setupOpen, setSetupOpen] = useState(!session.profileConfigured);
  const refreshPool = async () => {
    try {
      const r = await fetch('/api/pool');
      if (r.ok) setPool(await r.json());
    } catch {
      /* Keep last known pool until the next refresh. */
    }
  };
  useEffect(() => {
    void refreshPool();
    const t = setInterval(refreshPool, 6000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (profileConfigured) storage.write('aevori-name', profileName);
  }, [profileName, profileConfigured]);
  useEffect(() => {
    storage.write('aevori-motion', motion);
    document.documentElement.dataset.motion = motion ? 'on' : 'off';
    window.dispatchEvent(new Event('aevori-motion-change'));
  }, [motion]);
  const requestInFlight = useRef(false);
  const contextProvider = useRef('');
  const followReply = useRef(true);
  const conversation = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState('');
  const [undoChat, setUndoChat] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const visibleChats = chats.filter((c) => !c.deletedAt);
  const chat = chats.find((c) => c.id === chatId);
  const messages = chat?.messages || [];
  const go = (next: View) => {
    if (next === 'agent') setAgentSection('chat');
    setView(!isOwner && next === 'system' ? 'team' : next);
    setSearchOpen(false);
  };
  const notify = (text: string) => {
    setUndoChat(null);
    setToast(text);
  };
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => {
      setToast('');
      setUndoChat(null);
    }, 7000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    storage.write('aevori-theme', theme);
  }, [theme]);
  useEffect(() => {
    storage.write('aevori-glass', glass);
  }, [glass]);
  useEffect(() => {
    try {
      storage.write('aevori-chats', chats);
      storage.write('aevori-notes', notes);
      storage.write('aevori-tasks', tasks);
    } catch {
      notify('Device storage is full. Changes could not be saved.');
    }
  }, [chats, notes, tasks]);
  useEffect(() => {
    if (!agent.state) return;
    const imported = storage.read<string[]>('aevori-agent-imports', []);
    const fresh = agent.state.artifacts.filter((a) => !imported.includes(a.id));
    if (!fresh.length) return;
    const nextNotes = [
      ...fresh
        .filter((a) => a.kind === 'note' && !notes.some((n) => n.id === 'agent-' + a.id))
        .map((a) => ({ id: 'agent-' + a.id, title: a.title, body: a.content, updated: a.created })),
      ...notes,
    ];
    const nextTasks = [
      ...fresh
        .filter((a) => a.kind === 'task' && !tasks.some((t) => t.id === 'agent-' + a.id))
        .map((a) => ({
          id: 'agent-' + a.id,
          text: a.title + ' — ' + a.content,
          priority: 'medium' as const,
          done: false,
        })),
      ...tasks,
    ];
    try {
      storage.write('aevori-notes', nextNotes);
      storage.write('aevori-tasks', nextTasks);
      storage.write('aevori-agent-imports', [...imported, ...fresh.map((a) => a.id)]);
      setNotes(nextNotes);
      setTasks(nextTasks);
    } catch {
      notify("Device storage is full. Your agent's result is still saved on your Mac.");
    }
  }, [agent.state, storage]);
  useEffect(() => {
    storage.write('aevori-model', model);
  }, [model]);
  useEffect(() => {
    if (!isOwner) return;
    let alive = true;
    const c = new AbortController();
    const poll = async () => {
      try {
        const r = await fetch('/api/system', { signal: c.signal });
        if (!r.ok) throw new Error();
        const s = await r.json();
        if (alive) {
          setStats(s);
          setSystemError('');
          setHistory((h) => [...h.slice(-39), s.cpu]);
        }
      } catch {
        if (alive) setSystemError('Aevori is not connected to the local service.');
      }
    };
    void poll();
    const timer = setInterval(poll, 3000);
    return () => {
      alive = false;
      c.abort();
      clearInterval(timer);
    };
  }, []);
  const refreshModels = async () => {
    setRefreshing(true);
    try {
      const r = await fetch('/api/models');
      const data = await r.json();
      if (!data.provider) throw new Error('No provider information available.');
      setModels(data.models || []);
      setProvider(data.provider);
      if (contextProvider.current !== data.provider.baseUrl) {
        setIncludeContext(false);
        contextProvider.current = data.provider.baseUrl;
      }
      setConnected(data.connected);
      setConnectionError(data.error || '');
      setModel((old: string) =>
        old === '__auto__'
          ? '__auto__'
          : (data.models || []).some((m: Model) => m.id === old)
            ? old
            : data.models?.length
              ? '__auto__'
              : '',
      );
    } catch {
      setConnected(false);
      setConnectionError('Local service unavailable.');
    } finally {
      setRefreshing(false);
    }
  };
  useEffect(() => {
    void refreshModels();
    return () => abort.current?.abort();
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!setupOpen && (e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [setupOpen]);
  useEffect(() => {
    followReply.current = true;
  }, [chatId]);
  useEffect(() => {
    const box = conversation.current;
    if (box && followReply.current) box.scrollTop = box.scrollHeight;
  }, [messages.at(-1)?.content, busy, chatId]);
  const restoreChat = (id: string) => {
    setChats((cs) => cs.map((c) => (c.id === id ? { ...c, deletedAt: undefined } : c)));
    setUndoChat(null);
    setToast('Chat restored.');
  };
  const deleteChat = (id: string) => {
    if (busy && chatId === id) return;
    setChats((cs) => cs.map((c) => (c.id === id ? { ...c, deletedAt: Date.now() } : c)));
    if (chatId === id) {
      setChatId(null);
      setChatError('');
    }
    setUndoChat(id);
    setToast('Chat deleted.');
  };
  const newChat = () => {
    if (busy) return;
    setChatId(null);
    setPrompt('');
    setChatError('');
    go('chat');
  };
  const openConnect = () => {
    if (!isOwner) {
      notify('Your host sets up new connections on the main Mac.');
      return;
    }
    setForm({ type: provider.type, baseUrl: provider.baseUrl, apiKey: '' });
    setFormError('');
    setConnectOpen(true);
  };
  const openMuseConnect = () => {
    if (!isOwner) {
      notify('Your host sets up the Muse connection on the main Mac.');
      return;
    }
    setForm({ type: 'compatible', baseUrl: 'https://api.meta.ai/v1', apiKey: '' });
    setFormError('');
    setConnectOpen(true);
  };
  const startMuse = (text = '', mode = 'general') => {
    if (busy) return;
    if (!museConnected) {
      museDraft.current = { text, mode };
      openMuseConnect();
      return;
    }
    setUsePool(false);
    newChat();
    setModel(models.find((m) => m.id === 'muse-spark-1.3')?.id || models[0]?.id || '');
    setPrompt(text);
    setWorkMode(mode);
  };
  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setFormError('');
    try {
      const r = await fetch('/api/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setProvider(d.provider);
      setModels(d.models);
      setModel(d.models[0]?.id || '');
      setConnected(true);
      setConnectionError('');
      setIncludeContext(false);
      setUsePool(false);
      setChatId(null);
      setChatError('');
      setPrompt(d.provider.brand === 'meta-muse' ? museDraft.current?.text || '' : '');
      if (d.provider.brand === 'meta-muse') setWorkMode(museDraft.current?.mode || 'general');
      museDraft.current = null;
      go('chat');
      contextProvider.current = d.provider.baseUrl;
      setConnectOpen(false);
      setForm((f) => ({ ...f, apiKey: '' }));
      notify('Connected successfully.');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Connection failed.');
    } finally {
      setConnecting(false);
    }
  };
  const send = async (text = prompt, attachments?: PreparedAttachments, branch?: Message[]) => {
    if (!text.trim() || requestInFlight.current) return false;
    if (!usePool && (!connected || !model)) {
      openConnect();
      return false;
    }
    const outgoing: Message[] = [
      ...(branch ?? messages),
      {
        role: 'user',
        content: text.trim(),
        ...(attachments?.images.length ? { images: attachments.images } : {}),
        ...(attachments?.files.length ? { files: attachments.files } : {}),
      },
    ];
    const id = branch ? uid() : chatId || uid();
    const branchTitle = (chat?.title || text.slice(0, 35)).replace(
      /(?: · Variante(?: \d+)?)+$/,
      '',
    );
    const variant =
      chats.filter((c) => c.title.startsWith(branchTitle + ' · variation')).length + 1;
    if (outgoing.length > 78) {
      setChatError('This chat has reached its message limit. Please start a new chat.');
      return false;
    }
    requestInFlight.current = true;
    setBusy(true);
    setChatError('');
    setRequestStartedAt(Date.now());
    setStatus('Preparing attachments and request…');
    const controller = new AbortController();
    abort.current = controller;
    let started = false;
    let reply = '';
    let metadata: Partial<Message> = {};
    const updateReply = (patch: Partial<Message>) => {
      metadata = { ...metadata, ...patch };
      setChats((cs) =>
        cs.map((c) =>
          c.id === id
            ? { ...c, messages: [...outgoing, { role: 'assistant', content: reply, ...metadata }] }
            : c,
        ),
      );
    };
    try {
      if (
        !usePool &&
        model !== '__auto__' &&
        provider.type === 'ollama' &&
        outgoing.some((m) => m.images?.length)
      ) {
        const response = await fetch('/api/model/options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Could not check the model's capabilities.");
        const capabilities = await response.json();
        if (capabilities.vision !== true)
          throw new Error(
            `${modelLabel(model)} cannot read images. Choose Automatic or a model with “Text + images”.`,
          );
      }
      const wireMessages = await Promise.all(
        outgoing.map(async (m) => ({
          role: m.role,
          content: wireContent(m),
          ...(m.images?.length ? { images: await Promise.all(m.images.map(imageDataUrl)) } : {}),
        })),
      );
      if (controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      if (JSON.stringify(wireMessages).length > 10 * 1024 ** 2)
        throw new Error('This chat contains too much image data. Please start a new chat.');
      setChatId(id);
      go('chat');
      setPrompt('');
      started = true;
      followReply.current = true;
      setChats((old) => {
        const existing = old.find((c) => c.id === id);
        return [
          {
            id,
            title: branch
              ? `${branchTitle} · variation ${variant}`
              : existing?.title || text.slice(0, 42),
            messages: [...outgoing, { role: 'assistant', content: '' }],
            updated: Date.now(),
          },
          ...old.filter((c) => c.id !== id),
        ];
      });
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workMode,
          responseLength,
          creativity,
          reasoning: usePool || model === '__auto__' ? 'auto' : reasoning,
          model: usePool ? '__pool__' : model,
          usePool,
          messages: wireMessages,
          context: includeContext,
        }),
        signal: controller.signal,
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || 'No response received.');
      }
      if (!r.body) throw new Error('Streaming is unavailable.');
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;
      const consume = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line);
        if (event.status) setStatus(event.status);
        if (event.selection)
          updateReply({ model: event.selection.model, selectionReason: event.selection.reason });
        if (event.context) updateReply({ omittedMessages: event.context.omittedMessages });
        if (event.assigned) {
          updateReply({ machine: event.assigned.name, model: event.assigned.model });
          void refreshPool();
        }
        if (event.error) throw new Error(event.error);
        if (event.delta) {
          reply += event.delta;
          updateReply({});
        }
        if (event.done) {
          done = true;
          updateReply({
            state: 'complete',
            usage: event.usage,
            truncated: event.finishReason === 'length',
          });
        }
      };
      try {
        while (true) {
          const item = await reader.read();
          if (item.done) break;
          buffer += decoder.decode(item.value, { stream: true });
          let i;
          while ((i = buffer.indexOf('\n')) >= 0) {
            consume(buffer.slice(0, i));
            buffer = buffer.slice(i + 1);
          }
        }
        buffer += decoder.decode();
        if (buffer.trim()) consume(buffer);
        if (!done) throw new Error('The connection was interrupted. Please try again.');
      } finally {
        await reader.cancel().catch(() => {});
      }
    } catch (e) {
      const message = controller.signal.aborted
        ? 'Response stopped.'
        : e instanceof Error
          ? e.message
          : 'Could not load the response.';
      setChatError(message);
      if (started) {
        updateReply({ state: controller.signal.aborted ? 'stopped' : 'error' });
        setChats((cs) =>
          cs.map((c) =>
            c.id === id
              ? { ...c, messages: c.messages.filter((m) => m.role === 'user' || m.content) }
              : c,
          ),
        );
      } else if (attachments && !controller.signal.aborted) throw e;
    } finally {
      requestInFlight.current = false;
      setBusy(false);
      setStatus('');
      void refreshPool();
    }
    return started;
  };
  const retry = (index: number) => {
    const branch = branchAt(messages, index);
    void send(
      branch.message.content,
      { images: branch.message.images || [], files: branch.message.files || [] },
      branch.history,
    ).catch((e) => notify(e.message));
  };
  const saveReplyAsNote = (m: Message) => {
    const note = {
      id: uid(),
      title: chat?.title || 'Chat note',
      body: m.content,
      updated: Date.now(),
    };
    const next = [note, ...notes];
    try {
      storage.write('aevori-notes', next);
      setNotes(next);
      notify('Response saved as a note.');
    } catch {
      notify('Could not save the note. Browser storage is full.');
    }
  };
  const addNote = () => {
    const n = { id: uid(), title: 'New note', body: '', updated: Date.now() };
    setNotes((old) => [n, ...old]);
    setNoteId(n.id);
    go('notes');
  };

  const mainTitle = NAV.find((n) => n.id === view)?.name;
  const composer = (
    <ChatInput
      value={prompt}
      onChange={setPrompt}
      onSend={send}
      busy={busy}
      status={status}
      startedAt={requestStartedAt}
      onStop={() => abort.current?.abort()}
      modelSelect={
        <ModelSelect
          models={models}
          model={model}
          usePool={usePool}
          onSelect={(id) => {
            setUsePool(id === '__pool__');
            if (id !== '__pool__') setModel(id);
          }}
          disabled={busy}
          includeContext={includeContext}
          onContext={setIncludeContext}
          ready={pool.nodes.filter((n) => n.online && n.enabled && n.models.length).length}
          openConnections={openConnect}
          length={responseLength}
          onLength={setResponseLength}
          creativity={creativity}
          onCreativity={setCreativity}
          reasoning={reasoning}
          onReasoning={setReasoning}
          thinking={thinking}
          allowContext={isOwner}
          mode={workMode}
          onMode={setWorkMode}
        />
      }
      caption={
        usePool ? (
          'Your request stays within your Mac pool.'
        ) : museConnected ? (
          <>
            <span>Messages and attachments are sent to Meta.</span>
            <a href="/privacy.html" target="_blank" rel="noreferrer">
              Privacy &amp; terms
            </a>
          </>
        ) : !isOwner ? (
          'Your request is sent to the shared workspace.'
        ) : provider.local ? (
          'Your conversation stays on this Mac.'
        ) : (
          `Messages are sent to ${new URL(provider.baseUrl).hostname}.`
        )
      }
    />
  );
  const navItems = (ids: View[]) =>
    ids
      .filter((id) => isOwner || id !== 'system')
      .map((id) => {
        const item = NAV.find((n) => n.id === id)!;
        return {
          id,
          title: item.name,
          icon: <item.icon size={17} />,
          isActive: view === id,
          badge:
            id === 'tasks'
              ? tasks.filter((t) => !t.done).length
              : id === 'agent'
                ? (agent.state?.messages ?? []).filter(
                    (m) => m.role === 'assistant' && m.created > (agent.state?.readAt ?? 0),
                  ).length
                : undefined,
          onSelect: () => go(id),
        };
      });
  const navGroups: SidebarNavGroup[] = [
    { items: navItems(['chat', 'agent']) },
    { label: 'Workspace', items: navItems(['notes', 'tasks', 'team']) },
    {
      label: 'Connections',
      defaultOpen: false,
      items: navItems(['models', 'muse', 'system', 'pool']),
    },
  ];
  const connectionLabel = usePool
    ? 'Mac pool'
    : connected
      ? museConnected
        ? 'Muse Spark'
        : provider.local
          ? 'Connected locally'
          : 'Provider connected'
      : 'Not connected';
  return (
    <AppShell
      className={`${view === 'chat' ? 'chat-layout' : ''} ${glass ? 'glass-sidebar' : ''} ${busy ? 'is-thinking' : ''} ${!isOwner ? 'team-member' : ''}`}
      title={mainTitle || 'Chat'}
      connected={connected}
      connectionLabel={connectionLabel}
      onConnection={() => go('models')}
      onSettings={() => {
        setSettingsTab('profile');
        go('settings');
      }}
      sidebar={
        <AppSidebar
          groups={navGroups}
          chats={visibleChats}
          activeChat={view === 'chat' ? chatId : null}
          busy={busy}
          profileName={profileName}
          owner={isOwner}
          settingsActive={view === 'settings'}
          onNewChat={newChat}
          onSearch={() => setSearchOpen(true)}
          onSettings={() => {
            setSettingsTab('profile');
            go('settings');
          }}
          onSelectChat={(id) => {
            setChatId(id);
            go('chat');
            setChatError('');
          }}
          onDeleteChat={deleteChat}
        />
      }
    >
      <div className="workspace">
        <section ref={mainContentRef} className={`main-content view-${view}`}>
          {view === 'chat' && (
            <>
              {messages.length > 0 && (
                <div className="chat-companion-bar">
                  {museConnected && !usePool ? (
                    <MuseAvatar appearance={museAppearance} small active={busy} />
                  ) : (
                    <Companion
                      appearance={agent.state?.appearance}
                      tone={agent.state?.tone}
                      active={busy}
                      size={42}
                    />
                  )}
                  <div>
                    <strong>
                      {museConnected && !usePool
                        ? museAppearance.name
                        : agent.state?.name || 'Aeri'}
                    </strong>
                    <small>
                      {busy
                        ? 'Thinking with you.'
                        : museConnected && !usePool
                          ? 'Muse Spark by Meta'
                          : 'Your companion in AEVORI'}
                    </small>
                  </div>
                  <button onClick={() => go('agent')}>
                    Create an assignment
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              )}
              {messages.length ? (
                <div
                  ref={conversation}
                  className="conversation"
                  aria-live="polite"
                  onScroll={(e) => {
                    const box = e.currentTarget;
                    followReply.current = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
                  }}
                >
                  {messages.map((m, i) => (
                    <ChatMessage
                      key={i}
                      avatar={
                        m.model?.startsWith('muse-spark-') ? (
                          <MuseAvatar
                            appearance={museAppearance}
                            small
                            active={busy && i === messages.length - 1}
                          />
                        ) : (
                          <Companion
                            appearance={agent.state?.appearance}
                            tone={agent.state?.tone}
                            active={busy && i === messages.length - 1}
                            size={30}
                          />
                        )
                      }
                      message={m}
                      active={busy && i === messages.length - 1}
                      busy={busy}
                      status={status}
                      onCopy={() =>
                        void navigator.clipboard
                          .writeText(m.content)
                          .then(() => notify('Response copied.'))
                          .catch(() => notify('Copying is unavailable.'))
                      }
                      onRetry={() => retry(i)}
                      onEdit={() => setEditing({ index: i, text: m.content })}
                      onNote={() => saveReplyAsNote(m)}
                      onTask={() => setTaskDraft(m.content)}
                    />
                  ))}
                  {chatError && (
                    <div className="error-banner" role="alert">
                      {chatError}
                      {!busy && messages.some((m) => m.role === 'user') && (
                        <button className="text-button" onClick={() => retry(messages.length - 1)}>
                          Try again
                        </button>
                      )}
                    </div>
                  )}
                  <div ref={end} />
                </div>
              ) : (
                <div className="welcome">
                  <div className="welcome-aevori">
                    {museConnected && !usePool ? (
                      <MuseAvatar appearance={museAppearance} />
                    ) : agent.state?.characterConfigured ? (
                      <Companion appearance={agent.state.appearance} size={78} />
                    ) : (
                      <BrandLogo symbol />
                    )}
                  </div>
                  <h1>What would you like to work on?</h1>
                  <span>
                    Write, design, and build.
                    <br />
                    {museConnected && !usePool
                      ? 'With Muse Spark by Meta.'
                      : 'With AI on your Mac.'}
                  </span>
                  <div className="suggestions">
                    <button
                      onClick={() => {
                        setWorkMode('writing');
                        setPrompt('Help me write a clear, concise text. ');
                      }}
                    >
                      <Activity size={15} />
                      Refine a draft
                      <ArrowUpRight size={13} />
                    </button>
                    <button
                      onClick={() => {
                        setWorkMode('design');
                        setPrompt('Help me design a clear, easy-to-use interface. ');
                      }}
                    >
                      <HardDrive size={15} />
                      Explore a design
                      <ArrowUpRight size={13} />
                    </button>
                    <button
                      onClick={() => {
                        setWorkMode('code');
                        setPrompt('Help me build a small app. ');
                      }}
                    >
                      <Sparkles size={15} />
                      Write some code
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              )}
              {composer}
            </>
          )}
          {view === 'agent' && (
            <AgentWorkspace agent={agent} onOpen={go} onChat={newChat} initialTab={agentSection} />
          )}
          {view === 'settings' && (
            <SettingsPage
              tab={settingsTab}
              onTab={setSettingsTab}
              name={profileName}
              owner={isOwner}
              onName={(name) => {
                setProfileName(name);
                setProfileConfigured(true);
                notify('Your name has been saved.');
              }}
              agent={agent}
              theme={theme}
              onTheme={setTheme}
              glass={glass}
              onGlass={setGlass}
              motion={motion}
              onMotion={setMotion}
              connected={connected}
              providerName={
                provider.type === 'ollama'
                  ? 'Ollama'
                  : provider.brand === 'meta-muse'
                    ? 'Meta Model API'
                    : 'Compatible API'
              }
              modelName={modelLabel(model)}
              nodeCount={pool.nodes.length}
              contentCount={{
                chats: visibleChats.length,
                notes: notes.length,
                tasks: tasks.length,
              }}
              deletedChats={chats.filter((c) => Boolean(c.deletedAt))}
              onRestore={restoreChat}
              onSetup={() => setSetupOpen(true)}
              onOpen={go}
              onOpenAgent={(section) => {
                go('agent');
                setAgentSection(section);
              }}
              notify={notify}
              onExport={() => {
                const blob = new Blob(
                  [JSON.stringify({ version: 1, chats, notes, tasks }, null, 2)],
                  { type: 'application/json' },
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'aevori-content.json';
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                notify('Your content has been exported.');
              }}
            />
          )}
          {view === 'muse' && (
            <MuseWorkspace
              appearance={museAppearance}
              onAppearance={setMuseAppearance}
              storage={storage}
              connected={museConnected}
              busy={busy}
              status={status}
              owner={isOwner}
              cliInstalled={museCliInstalled}
              model={modelLabel(model)}
              tasks={tasks}
              onTask={(id) =>
                setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: true } : t)))
              }
              onOpen={go}
              onStart={startMuse}
              onConnect={openMuseConnect}
            />
          )}
          {view === 'pool' && (
            <PoolPanel
              readOnly={!isOwner}
              pool={pool}
              refresh={refreshPool}
              startChat={() => {
                setUsePool(true);
                newChat();
              }}
            />
          )}
          {view === 'team' && (
            <TeamPanel session={{ ...session, name: profileName, profileConfigured }} />
          )}
          {view === 'system' && (
            <SystemPanel
              stats={stats}
              systemError={systemError}
              history={history}
              onOpenPool={() => go('pool')}
            />
          )}
          {view === 'models' && (
            <>
              <div className="page-heading with-action">
                <div>
                  <span className="eyebrow">Connections</span>
                  <h1>Intelligence. Your choice.</h1>
                  <p>Qwen, Muse Spark, or your own provider. One shared workspace.</p>
                </div>
                <button className="primary" disabled={busy} onClick={openConnect}>
                  <Plus size={16} />
                  Connect
                </button>
              </div>
              <div className="provider-canvas">
                <ModelEcosystem />
                <div className="connection-row">
                  <div className="connection-icon">
                    <Network size={21} />
                  </div>
                  <div>
                    <h3>
                      {provider.type === 'ollama'
                        ? 'Ollama'
                        : provider.brand === 'meta-muse'
                          ? 'Meta Model API'
                          : 'Compatible API'}
                    </h3>
                    <p>{provider.baseUrl}</p>
                  </div>
                  <span className={`connected-pill ${!connected ? 'offline' : ''}`}>
                    <span className={`status-dot ${connected ? 'online' : ''}`} />
                    {connected ? 'Connected' : 'Unavailable'}
                  </span>
                  <button
                    className="icon-button"
                    aria-label="Refresh models"
                    disabled={refreshing || busy}
                    onClick={() => void refreshModels()}
                  >
                    <RefreshCw size={17} className={refreshing ? 'spin' : ''} />
                  </button>
                </div>
              </div>
              {connectionError && (
                <div className="error-banner">
                  {connectionError}
                  <button className="text-button" onClick={openConnect}>
                    Edit connection
                  </button>
                </div>
              )}
              <div className="muse-provider-card">
                <ModelLogo model="muse" size={34} />
                <div>
                  <h3>Muse Spark by Meta</h3>
                  <p>Think, write, and understand images together.</p>
                </div>
                <button className="secondary" onClick={() => go('muse')}>
                  View connection
                  <ChevronRight size={15} />
                </button>
              </div>
              <ModelInstall
                chatBusy={busy}
                available={isOwner && provider.type === 'ollama' && provider.local && connected}
                installed={provider.type === 'ollama' && provider.local ? models : []}
                freeBytes={stats?.disk?.free}
                onComplete={() => void refreshModels()}
                onSelect={(id) => {
                  setModel(id);
                  setUsePool(false);
                  newChat();
                }}
              />
              <div className="section-heading models-heading">
                <h2>Available models</h2>
                <span>{models.length} found</span>
              </div>
              <div className="model-list">
                {models.map((m) => (
                  <button
                    key={m.id}
                    disabled={busy}
                    className={`model-card ${m.id === model ? 'selected' : ''}`}
                    onClick={() => {
                      setModel(m.id);
                      setUsePool(false);
                      notify(`${m.id} selected.`);
                    }}
                  >
                    <div className="model-symbol">
                      <ModelLogo model={m.id} size={27} />
                    </div>
                    <div>
                      <h3>{modelLabel(m.id)}</h3>
                      <p>
                        {[
                          modelInfo(m.id)?.category,
                          m.parameters,
                          m.quantization,
                          m.size ? bytes(m.size) : null,
                          provider.local ? 'On your Mac' : 'At your provider',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    {m.id === model ? (
                      <span className="selected-model">
                        <Check size={15} />
                        Active
                      </span>
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                ))}
              </div>
              {!models.length && (
                <div className="empty-inline">
                  <p>No model available yet.</p>
                  <span>Start Ollama with an installed model or connect another provider.</span>
                </div>
              )}
              <div className="model-footnote">
                <ShieldCheck size={18} />
                <p>
                  Local models run on your device. With other providers, chat messages, attachments,
                  and any Mac context you enable are sent to the configured address. API keys remain
                  in the local service's memory.
                </p>
              </div>
            </>
          )}
          {view === 'notes' && (
            <NotesPanel
              notes={notes}
              noteId={noteId}
              onSelect={setNoteId}
              onAdd={addNote}
              onChange={(updated) =>
                setNotes((ns) => ns.map((n) => (n.id === updated.id ? updated : n)))
              }
              onDelete={(id) => {
                setNotes((ns) => ns.filter((n) => n.id !== id));
                if (noteId === id) setNoteId(null);
              }}
            />
          )}
          {view === 'tasks' && (
            <TasksPanel
              taskText={taskText}
              priority={taskPriority}
              onTextChange={setTaskText}
              onPriorityChange={setTaskPriority}
              tasks={tasks}
              onAdd={(text, priority) =>
                setTasks((old) => [{ id: uid(), text, priority, done: false }, ...old])
              }
              onToggle={(id) =>
                setTasks((old) =>
                  old.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
                )
              }
              onDelete={(id) => setTasks((old) => old.filter((task) => task.id !== id))}
            />
          )}
        </section>
      </div>
      <nav className="mobile-dock" aria-label="Quick navigation">
        {(
          [
            { id: 'chat', name: 'Chat', icon: MessageCircle },
            { id: 'agent', name: 'Agent', icon: Activity },
            { id: 'tasks', name: 'Tasks', icon: CheckCheck },
            { id: 'models', name: 'Connect', icon: Link2 },
          ] as const
        ).map((n) => (
          <button
            key={n.id}
            aria-current={view === n.id ? 'page' : undefined}
            onClick={() => go(n.id)}
          >
            <n.icon size={19} />
            {n.name}
          </button>
        ))}
      </nav>
      <footer className="statusbar">
        <span>
          <span className={`status-dot ${!systemError && stats ? 'online' : ''}`} />
          {stats && !systemError ? 'Connected to this Mac' : 'Connecting'}
        </span>
        <span>
          Aevori Preview <span className="footer-separator">/</span> Intelligence, locally.
        </span>
      </footer>
      <Modal
        open={connectOpen}
        onOpenChange={(b) => {
          if (!connecting) {
            setConnectOpen(b);
            if (!b) {
              setForm((f) => ({ ...f, apiKey: '' }));
              museDraft.current = null;
            }
          }
        }}
        title="A new connection."
        description="Make room for your AI in Aevori."
      >
        <div className="connection-stack">
          <div />
          <div />
          <div>
            <Mark small />
            <span>Your model. Your workspace.</span>
            <ShieldCheck size={16} />
          </div>
        </div>
        <form onSubmit={connect} className="connection-form">
          <label>
            Provider
            <AevoriSelect
              label="Provider"
              value={form.baseUrl === 'https://api.meta.ai/v1' ? 'muse' : form.type}
              onValueChange={(type) =>
                setForm({
                  type: type === 'muse' ? 'compatible' : type,
                  baseUrl:
                    type === 'ollama'
                      ? 'http://127.0.0.1:11434'
                      : type === 'muse'
                        ? 'https://api.meta.ai/v1'
                        : 'http://127.0.0.1:1234/v1',
                  apiKey: '',
                })
              }
              options={[
                { value: 'muse', label: 'Meta Model API · Cloud' },
                { value: 'ollama', label: 'Ollama · local models' },
                { value: 'compatible', label: 'OpenAI-compatible API · e.g. LM Studio' },
              ]}
            />
          </label>
          {form.baseUrl === 'https://api.meta.ai/v1' && (
            <div className="muse-form-notice">
              Muse Spark runs at Meta. Messages and attachments you send leave your Mac. API usage
              may incur charges; AEVORI uses the Standard tier.
              <a href="https://dev.meta.ai/" target="_blank" rel="noreferrer">
                Open Meta Developer Dashboard ↗
              </a>
              Use your own Model API key. Muse Code subscription credentials cannot be used in this
              app.
              <a href="https://dev.meta.ai/legal/terms-of-service" target="_blank" rel="noreferrer">
                API terms ↗
              </a>
              <a
                href="https://dev.meta.ai/legal/acceptable-use-policy"
                target="_blank"
                rel="noreferrer"
              >
                Acceptable use ↗
              </a>
              <a href="/privacy.html" target="_blank" rel="noreferrer">
                Privacy in AEVORI ↗
              </a>
              Meta's terms apply, including country restrictions. AEVORI is an independent API
              client.
            </div>
          )}
          <label>
            Server address
            <input
              readOnly={form.baseUrl === 'https://api.meta.ai/v1'}
              required
              type="url"
              value={form.baseUrl}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
            />
          </label>
          <label>
            API key <span>optional for local providers</span>
            <input
              required={form.baseUrl === 'https://api.meta.ai/v1'}
              type="password"
              value={form.apiKey}
              autoComplete="off"
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder="For this session only"
            />
          </label>
          <p className="fine-print">
            The connection is checked before saving. Switching providers replaces the active
            connection and opens a new chat. Existing conversations are preserved. Keys are not
            stored permanently.
          </p>
          {formError && (
            <p className="error-banner" role="alert">
              {formError}
            </p>
          )}
          <button className="primary wide" disabled={connecting}>
            {connecting ? <RefreshCw className="spin" size={16} /> : <Link2 size={16} />}{' '}
            {connecting ? 'Checking connection…' : 'Check and connect'}
          </button>
        </form>
      </Modal>
      <Modal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Where would you like to go?"
        className="search-dialog"
      >
        <div className="command-search">
          <Search size={18} />
          <input
            autoFocus
            aria-label="Search sections"
            placeholder="Search sections…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd>esc</kbd>
        </div>
        <div className="command-results">
          {NAV.filter(
            (n) =>
              (isOwner || n.id !== 'system') && n.name.toLowerCase().includes(query.toLowerCase()),
          ).map((n) => (
            <button key={n.id} onClick={() => go(n.id)}>
              <n.icon size={18} />
              {n.name}
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
      </Modal>
      <Modal
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="Edit message"
        description="The response will appear in a new chat. Your existing conversation is preserved."
      >
        <form
          className="reply-edit-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!editing) return;
            const branch = branchAt(messages, editing.index);
            const text = editing.text;
            setEditing(null);
            void send(
              text,
              { images: branch.message.images || [], files: branch.message.files || [] },
              branch.history,
            ).catch((e) => notify(e.message));
          }}
        >
          <textarea
            aria-label="Edit message"
            value={editing?.text || ''}
            onChange={(e) => setEditing((old) => (old ? { ...old, text: e.target.value } : null))}
            rows={7}
            maxLength={20000}
          />
          <button className="primary" disabled={!editing?.text.trim() || busy}>
            Send as a new conversation
          </button>
        </form>
      </Modal>
      <Modal
        open={taskDraft !== null}
        onOpenChange={(open) => {
          if (!open) setTaskDraft(null);
        }}
        title="Create task"
        description="Edit the suggestion before adding it to your tasks."
      >
        <form
          className="reply-edit-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!taskDraft?.trim()) return;
            const next = [
              { id: uid(), text: taskDraft.trim(), priority: 'medium' as const, done: false },
              ...tasks,
            ];
            try {
              storage.write('aevori-tasks', next);
              setTasks(next);
              setTaskDraft(null);
              notify('Task saved.');
            } catch {
              notify('Could not save the task.');
            }
          }}
        >
          <textarea
            aria-label="Task description"
            value={taskDraft || ''}
            onChange={(e) => setTaskDraft(e.target.value)}
            rows={7}
            maxLength={10000}
          />
          <button className="primary" disabled={!taskDraft?.trim()}>
            Save task
          </button>
        </form>
      </Modal>
      {setupOpen && (
        <ProfileSetup
          name={profileName}
          theme={theme}
          onTheme={setTheme}
          ready={connected && models.length > 0}
          status={
            connected && models.length
              ? `${models.length} ${models.length === 1 ? 'model ready' : 'models ready'} · ${!isOwner ? 'Through your host' : provider.local ? 'On your Mac' : 'At your provider'}`
              : "You can connect a model whenever you're ready."
          }
          canClose={profileConfigured}
          onClose={() => setSetupOpen(false)}
          onComplete={(name, destination) => {
            setProfileName(name);
            setProfileConfigured(true);
            setSetupOpen(false);
            go(destination);
            notify(`Welcome, ${name}.`);
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={16} />
          {toast}
          {undoChat && <button onClick={() => restoreChat(undoChat)}>Undo</button>}
        </div>
      )}
    </AppShell>
  );
}
