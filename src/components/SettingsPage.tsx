import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Download,
  Monitor,
  Network,
  Palette,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';
import { Tabs } from 'radix-ui';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { appearanceForTone } from '../../shared/character.mjs';
import type { useAgent } from './AgentWorkspace';
import CharacterEditor from './CharacterEditor';
import Companion from './Companion';
import { ProfileForm } from './ProfileSetup';
import './settings-page.css';
import ThemePreview from './ThemePreview';

export type SettingsTab = 'profile' | 'agent' | 'appearance' | 'connections' | 'data';
type Props = {
  tab: SettingsTab;
  onTab: (tab: SettingsTab) => void;
  name: string;
  owner: boolean;
  onName: (name: string) => void;
  agent: ReturnType<typeof useAgent>;
  theme: string;
  onTheme: (theme: string) => void;
  glass: boolean;
  onGlass: (value: boolean) => void;
  motion: boolean;
  onMotion: (value: boolean) => void;
  connected: boolean;
  providerName: string;
  modelName: string;
  nodeCount: number;
  contentCount: { chats: number; notes: number; tasks: number };
  deletedChats: { id: string; title: string }[];
  onRestore: (id: string) => void;
  onExport: () => void;
  onSetup: () => void;
  onOpen: (view: 'models' | 'pool' | 'team') => void;
  onOpenAgent: (section: 'memory' | 'rules') => void;
  notify: (message: string) => void;
};
const sections: [SettingsTab, string][] = [
  ['profile', 'Profile'],
  ['agent', 'Your agent'],
  ['appearance', 'Appearance'],
  ['connections', 'Connections'],
  ['data', 'Data'],
];
function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="settings-section">
      <div className="settings-section-label">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="settings-section-body">{children}</div>
    </section>
  );
}
function SettingsSwitch({
  label,
  description,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="preference-row">
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={value}
        disabled={disabled}
        className={`toggle ${value ? 'on' : ''}`}
        onClick={() => onChange(!value)}
      >
        <i />
      </button>
    </div>
  );
}
function AgentNameForm({
  name,
  onSave,
}: {
  name: string;
  onSave: (name: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !draft.trim()) return;
    setBusy(true);
    setError('');
    try {
      await onSave(draft.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your name.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="settings-name-form" onSubmit={save}>
      <label htmlFor="settings-agent-name">Your agent's name</label>
      <div>
        <input
          id="settings-agent-name"
          required
          maxLength={32}
          autoComplete="off"
          value={draft}
          disabled={busy}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="primary" disabled={busy || !draft.trim() || draft.trim() === name}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error && (
        <p className="small-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
export default function SettingsPage(props: Props) {
  const { agent } = props;
  const state = agent.state;
  const [editing, setEditing] = useState(false);
  const [savingMemory, setSavingMemory] = useState(false);
  const [error, setError] = useState('');
  const editButton = useRef<HTMLButtonElement>(null);
  const memory = async (value: boolean) => {
    setSavingMemory(true);
    setError('');
    try {
      await agent.action('profile', { memoryEnabled: value });
      props.notify(value ? 'Memory is now enabled.' : 'Memories will no longer be used.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the setting.');
    } finally {
      setSavingMemory(false);
    }
  };
  const openCharacter = () => {
    setError('');
    setEditing(true);
  };
  const agentPreview = state ? (
    <div className="settings-agent-identity">
      <span className="settings-companion">
        <Companion appearance={state.appearance} tone={state.tone} size={82} />
      </span>
      <div>
        <strong>{state.name}</strong>
        <p>Your personal agent.</p>
      </div>
      <button
        ref={props.tab === 'agent' ? editButton : undefined}
        className="secondary"
        onClick={openCharacter}
      >
        {state.characterConfigured ? 'Edit character' : 'Create character'}
        <Palette size={14} />
      </button>
    </div>
  ) : (
    <p role="status" className="settings-loading">
      {agent.error || 'Loading your agent…'}
    </p>
  );
  return (
    <div className="settings-page">
      <header className="settings-page-heading">
        <h1>Settings</h1>
        <p>Your profile, your agent, and your workspace.</p>
      </header>
      <Tabs.Root
        value={props.tab}
        onValueChange={(value) => props.onTab(value as SettingsTab)}
        className="settings-tabs-root"
      >
        <Tabs.List className="settings-tabs" aria-label="Settings sections">
          {sections.map(([id, label]) => (
            <Tabs.Trigger key={id} value={id}>
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="profile" className="settings-panel">
          <SettingsSection
            title="Your profile"
            description="How you appear in your workspace and team."
          >
            <div className="settings-profile-identity">
              <span className="settings-profile-avatar">
                {props.name.slice(0, 1).toUpperCase() || <UserRound size={25} />}
              </span>
              <div>
                <strong>{props.name || 'Your profile'}</strong>
                <p>{props.owner ? 'Personal workspace' : 'Team workspace'}</p>
              </div>
              <span className="settings-badge">
                <ShieldCheck size={13} />
                {props.owner ? 'On this Mac' : 'Your access'}
              </span>
            </div>
          </SettingsSection>
          <SettingsSection
            title="Display name"
            description="Choose the name your friends and team will see."
          >
            <ProfileForm key={props.name} name={props.name} onSave={props.onName} />
          </SettingsSection>
          <SettingsSection
            title="Your agent"
            description="A name of its own. A character that feels like you."
          >
            {agentPreview}
            <button className="settings-text-link" onClick={() => props.onTab('agent')}>
              Open agent settings
              <ChevronRight size={14} />
            </button>
          </SettingsSection>
          <SettingsSection
            title="Your starting point"
            description="Revisit your name, appearance, and setup."
          >
            <div className="settings-action-row">
              <div>
                <strong>Welcome to AEVORI</strong>
                <p>Open your personal setup again.</p>
              </div>
              <button className="secondary" onClick={props.onSetup}>
                Review setup
                <ArrowUpRight size={14} />
              </button>
            </div>
          </SettingsSection>
        </Tabs.Content>
        <Tabs.Content value="agent" className="settings-panel">
          <SettingsSection
            title="Identity"
            description="Customize your companion. Its name and character appear in the agent workspace and local chat."
          >
            {agentPreview}
            {state && (
              <AgentNameForm
                key={state.name}
                name={state.name}
                onSave={async (name) => {
                  await agent.action('profile', { name });
                  props.notify("Your agent's name has been saved.");
                }}
              />
            )}
          </SettingsSection>
          <SettingsSection
            title="Memory"
            description="Your agent can use the preferences and information you confirm."
          >
            {state && (
              <SettingsSwitch
                label="Use memories"
                description={`${state.memories.length} confirmed ${state.memories.length === 1 ? 'memory' : 'memories'}. Turning them off keeps them saved.`}
                value={state.memoryEnabled}
                onChange={(value) => void memory(value)}
                disabled={savingMemory}
              />
            )}
            <button className="settings-text-link" onClick={() => props.onOpenAgent('memory')}>
              Manage memories
              <ChevronRight size={14} />
            </button>
            {error && (
              <p className="small-error" role="alert">
                {error}
              </p>
            )}
          </SettingsSection>
          <SettingsSection title="Action rules" description="You decide what your agent can save.">
            <div className="settings-action-row">
              <div>
                <strong>Your permissions</strong>
                <p>Review, automatically save, or block notes and tasks.</p>
              </div>
              <button className="secondary" onClick={() => props.onOpenAgent('rules')}>
                Manage rules
                <ArrowUpRight size={14} />
              </button>
            </div>
          </SettingsSection>
        </Tabs.Content>
        <Tabs.Content value="appearance" className="settings-panel">
          <SettingsSection
            title="Color scheme"
            description="Choose the look that feels right for you."
          >
            <div
              className="theme-choices settings-theme-choices"
              role="group"
              aria-label="Color scheme"
            >
              {[
                { id: 'dark', name: 'Dark' },
                { id: 'light', name: 'Light' },
                { id: 'sand', name: 'Sand' },
              ].map((theme) => (
                <button
                  aria-pressed={props.theme === theme.id}
                  className={`theme-choice ${theme.id} ${props.theme === theme.id ? 'selected' : ''}`}
                  key={theme.id}
                  onClick={() => props.onTheme(theme.id)}
                >
                  <ThemePreview theme={theme.id} />
                  <span>
                    {theme.name}
                    {props.theme === theme.id && <Check size={14} />}
                  </span>
                </button>
              ))}
            </div>
          </SettingsSection>
          <SettingsSection title="Display" description="Small details for your workspace.">
            <SettingsSwitch
              label="Translucent sidebar"
              description="A slightly transparent navigation surface."
              value={props.glass}
              onChange={props.onGlass}
            />
            <SettingsSwitch
              label="Animations"
              description="Gentle transitions and lively characters."
              value={props.motion}
              onChange={props.onMotion}
            />
          </SettingsSection>
        </Tabs.Content>
        <Tabs.Content value="connections" className="settings-panel">
          <SettingsSection title="Intelligence" description="Your models and active AI provider.">
            <div className="settings-action-row">
              <span className="settings-row-icon">
                <Sparkles size={20} />
              </span>
              <div>
                <strong>{props.providerName}</strong>
                <p>{props.connected ? props.modelName : 'Not connected'}</p>
              </div>
              <button className="secondary" onClick={() => props.onOpen('models')}>
                Manage models
                <ArrowUpRight size={14} />
              </button>
            </div>
          </SettingsSection>
          <SettingsSection
            title="Devices &amp; team"
            description="Work with your Macs and the people you invite."
          >
            <div className="settings-action-row">
              <span className="settings-row-icon">
                <Network size={20} />
              </span>
              <div>
                <strong>Mac pool</strong>
                <p>
                  {props.nodeCount}{' '}
                  {props.nodeCount === 1 ? 'Mac in your workspace' : 'Macs in your workspace'}
                </p>
              </div>
              <button className="secondary" onClick={() => props.onOpen('pool')}>
                Open Mac pool
                <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="settings-action-row">
              <span className="settings-row-icon">
                <Users size={20} />
              </span>
              <div>
                <strong>Your team</strong>
                <p>See members and their personal access.</p>
              </div>
              <button className="secondary" onClick={() => props.onOpen('team')}>
                Open team
                <ArrowUpRight size={14} />
              </button>
            </div>
          </SettingsSection>
          <SettingsSection
            title="On your phone"
            description="Open your agent directly from your Home Screen."
          >
            <div className="settings-action-row">
              <span className="settings-row-icon">
                <Monitor size={20} />
              </span>
              <div>
                <strong>AEVORI as a web app</strong>
                <p>The guide walks you through the next steps.</p>
              </div>
              <a className="secondary" href="/?install=1">
                Open guide
                <ArrowUpRight size={14} />
              </a>
            </div>
          </SettingsSection>
        </Tabs.Content>
        <Tabs.Content value="data" className="settings-panel">
          <SettingsSection
            title="Your content"
            description="Chats, notes, and tasks are stored in this browser."
          >
            <div className="settings-content-counts">
              {[
                [props.contentCount.chats, 'Chats'],
                [props.contentCount.notes, 'Notes'],
                [props.contentCount.tasks, 'Tasks'],
              ].map(([count, label]) => (
                <div key={label}>
                  <strong>{count}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="settings-action-row">
              <div>
                <strong>Download a backup</strong>
                <p>Export your content as a JSON file.</p>
              </div>
              <button className="secondary" onClick={props.onExport}>
                <Download size={15} />
                Export content
              </button>
            </div>
          </SettingsSection>
          <SettingsSection
            title="Agent storage"
            description="Your character, memories, rules, and assignments stay on the main Mac."
          >
            <div className="settings-action-row">
              <div>
                <strong>Separate for each team member</strong>
                <p>The main Mac's operator can read the local storage file.</p>
              </div>
              <button className="secondary" onClick={() => props.onOpenAgent('memory')}>
                View storage
                <ArrowUpRight size={14} />
              </button>
            </div>
            <p className="settings-note">
              When using external AI providers, the messages and attachments you send are
              transferred to that provider. API keys remain only in the service's memory.
            </p>
          </SettingsSection>
          <SettingsSection
            title="Deleted chats"
            description="Restore conversations you have removed."
          >
            {props.deletedChats.length ? (
              <div className="settings-restore-list">
                {props.deletedChats.map((chat) => (
                  <div key={chat.id}>
                    <span>{chat.title}</span>
                    <button className="secondary" onClick={() => props.onRestore(chat.id)}>
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="settings-empty">No deleted chats.</p>
            )}
          </SettingsSection>
        </Tabs.Content>
      </Tabs.Root>
      {editing && state && (
        <CharacterEditor
          name={state.name}
          appearance={state.appearance ?? appearanceForTone(state.tone)}
          configured={state.characterConfigured}
          onClose={() => setEditing(false)}
          onReturnFocus={() => editButton.current?.focus({ preventScroll: true })}
          onSave={async (draft) => {
            await agent.action('profile', draft);
            props.notify('Your character has been saved.');
          }}
        />
      )}
    </div>
  );
}
