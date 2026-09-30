import * as Dialog from '@radix-ui/react-dialog';
import { Check, Glasses, Headphones, Leaf, Shuffle, X } from 'lucide-react';
import { useState, type CSSProperties, type FormEvent } from 'react';
import {
  CHARACTER_ACCESSORIES,
  CHARACTER_COLORS,
  CHARACTER_EYES,
  CHARACTER_SHAPES,
  type CharacterAppearance,
} from '../../shared/character.mjs';
import Companion from './Companion';
import './character-editor.css';

type Props = {
  name: string;
  appearance: CharacterAppearance;
  configured: boolean;
  onClose: () => void;
  onReturnFocus: () => void;
  onSave: (draft: { name: string; appearance: CharacterAppearance }) => Promise<unknown>;
};
export default function CharacterEditor({
  name: initialName,
  appearance: initialAppearance,
  configured,
  onClose,
  onReturnFocus,
  onSave,
}: Props) {
  const [opener] = useState(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );
  const [name, setName] = useState(initialName);
  const [appearance, setAppearance] = useState({ ...initialAppearance });
  const [hex, setHex] = useState(initialAppearance.color);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const patch = (value: Partial<CharacterAppearance>) =>
    setAppearance((current) => ({ ...current, ...value }));
  const colorValid = /^#[0-9a-f]{6}$/i.test(hex);
  const setColor = (color: string) => {
    setHex(color);
    if (/^#[0-9a-f]{6}$/i.test(color)) patch({ color: color.toLowerCase() });
  };
  const randomize = () => {
    const pick = <T,>(values: ReadonlyArray<T>) =>
      values[Math.floor(Math.random() * values.length)];
    const color = pick(CHARACTER_COLORS).color;
    setAppearance({
      shape: pick(CHARACTER_SHAPES).id,
      eyes: pick(CHARACTER_EYES).id,
      accessory: pick(CHARACTER_ACCESSORIES).id,
      color,
    });
    setHex(color);
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !colorValid || busy) return;
    setError('');
    setBusy(true);
    try {
      await onSave({ name: name.trim(), appearance });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your character.');
      setBusy(false);
    }
  };
  const accessoryIcons = { none: X, glasses: Glasses, headphones: Headphones, sprout: Leaf };
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay character-overlay" />
        <Dialog.Content
          className="character-dialog"
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (opener?.isConnected) opener.focus({ preventScroll: true });
            else onReturnFocus();
          }}
        >
          <div className="character-editor-heading">
            <div>
              <Dialog.Title>
                {configured ? 'Your character. Your style.' : 'Make it your own.'}
              </Dialog.Title>
              <Dialog.Description>Give your agent a face of its own.</Dialog.Description>
            </div>
            <Dialog.Close
              className="shell-icon-button"
              aria-label="Close character editor"
              disabled={busy}
            >
              <X size={19} />
            </Dialog.Close>
          </div>
          <form className="character-form" onSubmit={save}>
            <div
              className="character-editor-body"
              style={{ '--character-color': appearance.color } as CSSProperties}
            >
              <section className="character-stage" aria-label="Character preview">
                <span className="character-preview-label">Preview</span>
                <div className="character-stage-figure">
                  <Companion appearance={appearance} size={210} />
                </div>
                <h3>{name.trim() || 'Your character'}</h3>
                <p>Your personal agent.</p>
                <div className="character-chat-preview">
                  <Companion appearance={appearance} size={30} />
                  <span>Ready for your next idea.</span>
                </div>
                <button
                  type="button"
                  className="character-random"
                  onClick={randomize}
                  disabled={busy}
                >
                  <Shuffle size={14} />
                  Surprise me
                </button>
              </section>
              <fieldset className="character-controls" disabled={busy}>
                <legend className="sr-only">Customize character</legend>
                <label className="character-name" htmlFor="character-name">
                  Name
                  <input
                    id="character-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="off"
                    maxLength={32}
                    required
                    placeholder="What's your character's name?"
                  />
                </label>
                <fieldset className="character-options">
                  <legend>Shape</legend>
                  <div className="character-shapes">
                    {CHARACTER_SHAPES.map((shape) => (
                      <button
                        type="button"
                        key={shape.id}
                        aria-pressed={appearance.shape === shape.id}
                        onClick={() => patch({ shape: shape.id })}
                      >
                        <Companion
                          appearance={{ ...appearance, shape: shape.id, accessory: 'none' }}
                          size={43}
                        />
                        <span>{shape.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="character-options">
                  <legend>Color</legend>
                  <div className="character-color-row">
                    <div className="character-swatches">
                      {CHARACTER_COLORS.map((color) => (
                        <button
                          type="button"
                          key={color.color}
                          className="character-swatch"
                          style={{ '--swatch': color.color } as CSSProperties}
                          aria-label={color.label}
                          aria-pressed={appearance.color === color.color}
                          onClick={() => setColor(color.color)}
                        >
                          {appearance.color === color.color && <Check size={13} />}
                        </button>
                      ))}
                    </div>
                    <label className="character-custom-color" title="Custom color">
                      <input
                        type="color"
                        aria-label="Choose a custom color"
                        value={appearance.color}
                        onChange={(e) => setColor(e.target.value)}
                      />
                      <span className="sr-only">Custom color</span>
                    </label>
                  </div>
                  <label className="character-hex">
                    <span>Custom color</span>
                    <input
                      aria-label="Color value"
                      value={hex}
                      maxLength={7}
                      spellCheck={false}
                      onChange={(e) => setColor(e.target.value)}
                      aria-invalid={!colorValid}
                      aria-describedby={!colorValid ? 'character-color-error' : undefined}
                    />
                  </label>
                  {!colorValid && (
                    <p id="character-color-error" className="small-error">
                      For example #a7c9e9 — six characters after the #.
                    </p>
                  )}
                </fieldset>
                <fieldset className="character-options">
                  <legend>Expression</legend>
                  <div className="character-segments">
                    {CHARACTER_EYES.map((eyes) => (
                      <button
                        type="button"
                        key={eyes.id}
                        aria-pressed={appearance.eyes === eyes.id}
                        onClick={() => patch({ eyes: eyes.id })}
                      >
                        {eyes.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="character-options">
                  <legend>Accessory</legend>
                  <div className="character-accessories">
                    {CHARACTER_ACCESSORIES.map((accessory) => {
                      const Icon = accessoryIcons[accessory.id];
                      return (
                        <button
                          type="button"
                          key={accessory.id}
                          aria-pressed={appearance.accessory === accessory.id}
                          onClick={() => patch({ accessory: accessory.id })}
                        >
                          <Icon size={17} />
                          <span>{accessory.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </fieldset>
            </div>
            <footer className="character-editor-footer">
              {error && (
                <p className="error-banner" role="alert">
                  {error}
                </p>
              )}
              <p>Your agent. Always yours to change.</p>
              <div>
                <button type="button" className="secondary" disabled={busy} onClick={onClose}>
                  Cancel
                </button>
                <button className="primary" disabled={busy || !name.trim() || !colorValid}>
                  {busy ? 'Saving…' : 'Save character'}
                  {!busy && <Check size={15} />}
                </button>
              </div>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
