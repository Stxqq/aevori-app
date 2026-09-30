import { formatBytes as bytes } from '../lib/format-bytes';
import AevoriMark from '../AevoriMark';
import { ArrowUpRight, Cpu, HardDrive, MemoryStick, Network } from '../MotionIcon';
import type { Stats } from '../types';
import LiveChart from './LiveChart';
import MacImage from './MacImage';
import ProcessIcon from './ProcessIcon';

const GB = 1024 ** 3;
type Props = {
  stats: Stats | null;
  systemError: string;
  history: number[];
  onOpenPool: () => void;
};
export default function SystemPanel({ stats, systemError, history, onOpenPool }: Props) {
  const health = stats ? Math.round((stats.memory.used / stats.memory.total) * 100) : 0;
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">This Mac</span>
        <h1>Everything, working together.</h1>
        <p>Live readings from your device. Updated every 3 seconds.</p>
        <button className="text-button" onClick={onOpenPool}>
          <Network size={16} />
          Connect more Macs
          <ArrowUpRight size={14} />
        </button>
      </div>
      {systemError ? (
        <div className="error-banner">{systemError}</div>
      ) : stats ? (
        <>
          <div className="system-summary">
            <div className="machine-art">
              <MacImage name={stats.hardware.name} />
            </div>
            <div>
              <span className="connected-pill">
                <span className="status-dot online" />
                Connected
              </span>
              <h2>{stats.hardware.name}</h2>
              <p>
                {stats.hardware.chip} · {stats.hardware.cores} cores
              </p>
              <p>
                macOS {stats.hardware.os} · {bytes(stats.memory.total)} Memory
              </p>
              <span className="subtle">
                Up for {Math.floor(stats.uptime / 3600)}{' '}
                {Math.floor(stats.uptime / 3600) === 1 ? 'hour' : 'hours'}
              </span>
            </div>
          </div>
          <div className="metrics-grid">
            <div>
              <Cpu size={19} />
              <label>CPU usage</label>
              <strong>
                {stats.cpu}
                <small>%</small>
              </strong>
              <LiveChart values={history} />
            </div>
            <div>
              <MemoryStick size={19} />
              <label>Memory</label>
              <strong>{bytes(stats.memory.used)}</strong>
              <p>of {bytes(stats.memory.total)} · including cache</p>
              <div className="usage-bar">
                <i style={{ width: health + '%' }} />
              </div>
            </div>
            <div>
              <HardDrive size={19} />
              <label>Free storage</label>
              <strong>{stats.disk ? bytes(stats.disk.free) : 'Unavailable'}</strong>
              <p>
                {stats.disk ? `of ${bytes(stats.disk.total)}` : 'Could not read drive information.'}
              </p>
              <div className="usage-bar">
                <i
                  style={{
                    width: stats.disk ? (100 * stats.disk.free) / stats.disk.total + '%' : '0',
                  }}
                />
              </div>
            </div>
          </div>
          <div className="process-header">
            <h2>Running processes</h2>
            <span>Sorted by CPU · read only</span>
          </div>
          <div className="process-table">
            <div className="process-row table-label">
              <span>Process</span>
              <span>CPU</span>
              <span>Memory</span>
            </div>
            {stats.processes.map((p) => (
              <div className="process-row" key={p.pid}>
                <span>
                  <ProcessIcon icon={p.icon} />
                  {p.name}
                </span>
                <span>{p.cpu.toFixed(1)} %</span>
                <span>
                  {p.memory > GB ? bytes(p.memory) : `${Math.round(p.memory / 1024 ** 2)} MB`}
                </span>
              </div>
            ))}
          </div>
          <p className="fine-print">
            A process can use multiple CPU cores and exceed 100%. Aevori never stops processes
            automatically.
          </p>
        </>
      ) : (
        <div className="empty-state">
          <AevoriMark busy />
          <p>Connecting your Mac…</p>
        </div>
      )}
    </>
  );
}
