import * as Popover from '@radix-ui/react-popover';
import { useState } from 'react';
import { modelLabel } from '../model-catalog';
import { Check, ChevronDown, Plus, Sparkles } from '../MotionIcon';
import AevoriSelect from './AevoriSelect';
import ModelLogo from './ModelLogo';

type Model = {
  id: string;
  parameters?: string;
  quantization?: string;
  vision?: boolean | null;
  tools?: boolean | null;
  completion?: boolean | null;
};
type Props = {
  models: Model[];
  model: string;
  usePool: boolean;
  onSelect: (id: string) => void;
  disabled: boolean;
  includeContext: boolean;
  onContext: (b: boolean) => void;
  ready: number;
  openConnections: () => void;
  length: string;
  onLength: (s: string) => void;
  creativity: string;
  onCreativity: (s: string) => void;
  reasoning: string;
  onReasoning: (s: string) => void;
  thinking: (string | boolean)[];
  allowContext?: boolean;
  mode: string;
  onMode: (s: string) => void;
};
const modeLabels: Record<string, string> = {
  general: 'General',
  code: 'Code',
  design: 'Design',
  writing: 'Writing',
};
export default function ModelSelect(p: Props) {
  const [open, setOpen] = useState(false);
  const active = p.usePool ? '__pool__' : p.model;
  const names: Record<string, string> = { __auto__: 'Automatic', __pool__: 'Mac pool' };
  const choices = [
    {
      id: '__auto__',
      label: 'Automatic',
      description: 'Matched to your task and attachments.',
      disabled: !p.models.length,
    },
    ...p.models
      .filter((m) => m.completion !== false)
      .map((m) => ({
        id: m.id,
        label: modelLabel(m.id),
        description: [
          m.vision === true
            ? 'Text + images'
            : m.vision === false
              ? 'Text'
              : 'Capabilities not reported',
          m.parameters,
        ]
          .filter(Boolean)
          .join(' · '),
        disabled: false,
      })),
    {
      id: '__pool__',
      label: 'Mac pool',
      description: `Distribute across available Macs · ${p.ready} ready`,
      disabled: !p.ready,
    },
  ];
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        data-slot="model-selector-trigger"
        className="aevori-model-trigger"
        disabled={p.disabled}
        aria-label="Choose a model and mode"
      >
        {active === '__auto__' ? <Sparkles size={17} /> : <ModelLogo model={active} size={18} />}
        <span>{names[active] || modelLabel(active) || 'Choose model'}</span>
        <small>{modeLabels[p.mode]}</small>
        <ChevronDown size={12} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          data-slot="model-selector-content"
          className="aevori-model-popover"
          side="top"
          align="start"
          sideOffset={12}
          collisionPadding={12}
          aria-label="Models and response options"
        >
          <div className="model-menu-heading">
            <strong>Your model</strong>
            <button
              onClick={() => {
                setOpen(false);
                p.openConnections();
              }}
              aria-label="Set up model connection"
            >
              <Plus size={15} />
            </button>
          </div>
          <div className="model-menu-list" role="group" aria-label="Available models">
            {choices.map((m) => (
              <button
                key={m.id}
                disabled={m.disabled}
                aria-pressed={active === m.id}
                onClick={() => p.onSelect(m.id)}
              >
                {m.id === '__auto__' ? (
                  <Sparkles size={20} />
                ) : (
                  <ModelLogo model={m.id} size={20} />
                )}
                <span>
                  <strong>{m.label}</strong>
                  <small>{m.description}</small>
                </span>
                {active === m.id && <Check size={16} />}
              </button>
            ))}
          </div>
          <div className="model-menu-settings">
            <label>
              Mode
              <AevoriSelect
                label="Mode"
                value={p.mode}
                onValueChange={p.onMode}
                disabled={p.disabled}
                options={Object.entries(modeLabels).map(([value, label]) => ({ value, label }))}
              />
            </label>
            <fieldset>
              <legend>Response length</legend>
              <div className="answer-length">
                {[
                  ['short', 'Short'],
                  ['normal', 'Normal'],
                  ['long', 'Detailed'],
                ].map(([id, label]) => (
                  <button key={id} aria-pressed={p.length === id} onClick={() => p.onLength(id)}>
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <details>
              <summary>More settings</summary>
              <label>
                Style
                <AevoriSelect
                  label="Style"
                  value={p.creativity}
                  onValueChange={p.onCreativity}
                  disabled={p.disabled}
                  options={[
                    { value: 'precise', label: 'Precise' },
                    { value: 'balanced', label: 'Balanced' },
                    { value: 'creative', label: 'Creative' },
                  ]}
                />
              </label>
              {!p.usePool && p.model !== '__auto__' && p.thinking.length > 0 && (
                <label>
                  Reasoning effort
                  <AevoriSelect
                    label="Reasoning effort"
                    value={p.reasoning}
                    onValueChange={p.onReasoning}
                    disabled={p.disabled}
                    options={[
                      { value: 'auto', label: 'Model default' },
                      ...p.thinking.map((v) => ({
                        value: v === true ? 'on' : v === false ? 'off' : v,
                        label:
                          v === true
                            ? 'Think it through'
                            : v === false
                              ? 'Answer directly'
                              : v === 'low'
                                ? 'Low'
                                : v === 'medium'
                                  ? 'Medium'
                                  : 'High',
                      })),
                    ]}
                  />
                </label>
              )}
              {p.allowContext && (
                <label className="context-toggle">
                  <input
                    type="checkbox"
                    checked={p.includeContext}
                    onChange={(e) => p.onContext(e.target.checked)}
                  />
                  <span>
                    Include Mac system readings<small>Device, CPU, memory, and uptime</small>
                  </span>
                </label>
              )}
            </details>
          </div>
          <p className="model-menu-footnote">
            Applies to the next response. Your specific request takes priority.
          </p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
