import { modelLabel } from '../model-catalog';
import { ArrowUpRight, Check, CheckCheck, Monitor, Network, Plus, StickyNote } from '../MotionIcon';
import BrandLogo from './BrandLogo';
import LiveChart from './LiveChart';
import ModelLogo from './ModelLogo';
type Props = {
  model: string;
  connected: boolean;
  ready: number;
  cpu: number | null;
  memory: string;
  history: number[];
  notes: number;
  noteTitle: string;
  tasks: number;
  done: number;
  open: (view: 'models' | 'system' | 'notes' | 'tasks' | 'pool') => void;
  addNote: () => void;
};
export default function QuickTools({
  model,
  connected,
  ready,
  cpu,
  memory,
  history,
  notes,
  noteTitle,
  tasks,
  done,
  open,
  addNote,
}: Props) {
  return (
    <section className="workspace-tools">
      <div className="workspace-tools-heading">
        <h2>Your workspace.</h2>
        <span>Everything within reach</span>
      </div>
      <div className="workspace-tool-grid">
        <button className="workspace-tool model-workspace" onClick={() => open('models')}>
          <div className="workspace-tool-top">
            <span>
              <Network size={17} />
              Intelligence
            </span>
            <ArrowUpRight size={16} />
          </div>
          <div className="model-connection-art" aria-hidden="true">
            <span className="connection-mark">
              <BrandLogo symbol />
            </span>
            <i />
            <span className="connection-model">
              <ModelLogo model={model} size={25} />
            </span>
            <span className="connection-line" />
            <span className="connection-peer">
              <Monitor size={19} />
            </span>
          </div>
          <div className="workspace-tool-copy">
            <h3>{connected ? modelLabel(model) : 'Your models. Your space.'}</h3>
            <p>
              {connected ? 'Ready for your next thought.' : 'Connect local models or your own API.'}
            </p>
          </div>
          <div className="workspace-tool-foot">
            <span>
              <i className={`status-dot ${connected ? 'online' : ''}`} />
              {connected ? 'Connected' : 'Set up connection'}
            </span>
            <span>
              {ready ? `${ready} ${ready === 1 ? 'Mac ready' : 'Macs ready'}` : 'Open models'}
            </span>
          </div>
        </button>
        <button className="workspace-tool device-workspace" onClick={() => open('system')}>
          <div className="workspace-tool-top">
            <span>
              <Monitor size={17} />
              Your Mac
            </span>
            <ArrowUpRight size={16} />
          </div>
          <div className="device-readout">
            <strong>
              {cpu === null ? '—' : cpu}
              <span>{cpu !== null ? '%' : ''}</span>
            </strong>
            <span>CPU usage</span>
          </div>
          <LiveChart values={history} compact />
          <div className="workspace-tool-foot">
            <span>Memory</span>
            <span>{memory}</span>
          </div>
        </button>
        <button
          className="workspace-tool compact-workspace notes-workspace-link"
          onClick={() => (notes ? open('notes') : addNote())}
        >
          <span className="workspace-tool-icon">
            <StickyNote size={23} />
          </span>
          <div>
            <h3>Capture a thought</h3>
            <p>{notes ? noteTitle || 'Open your notes' : 'Start a new note'}</p>
          </div>
          <span className="workspace-tool-count">{notes || <Plus size={17} />}</span>
        </button>
        <button
          className="workspace-tool compact-workspace tasks-workspace-link"
          onClick={() => open('tasks')}
        >
          <span className="workspace-tool-icon">
            <CheckCheck size={23} />
          </span>
          <div>
            <h3>Clear your mind</h3>
            <p>
              {tasks
                ? `${tasks - done} open · ${done} completed`
                : 'What would you like to get done today?'}
            </p>
          </div>
          <span
            className="workspace-task-progress"
            style={{ '--progress': `${tasks ? (done / tasks) * 100 : 0}%` } as React.CSSProperties}
          >
            {tasks && done === tasks ? <Check size={14} /> : tasks - done}
          </span>
        </button>
      </div>
    </section>
  );
}
