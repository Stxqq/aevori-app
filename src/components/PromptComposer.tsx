import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUp, FileText, Mic, Plus, Square, X } from 'lucide-react';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type ReactNode,
} from 'react';
import { ATTACHMENT_ACCEPT, IMAGE_TYPES, attachmentError, fileSize } from '../attachments';
import './prompt-composer.css';

type Attachment = { id: string; file: File; url: string };
type SpeechEvent = {
  resultIndex: number;
  results: { isFinal: boolean; 0: { transcript: string } }[];
};
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string, meta: { attachments: File[] }) => Promise<boolean>;
  busy: boolean;
  onStop: () => void;
  modelSelector: ReactNode;
  placeholder?: string;
  maxAttachments?: number;
  onError: (message: string) => void;
};

/** AEVORI composer. Controlled drafts survive failed sends; focus never follows a timer. */
export function PromptInput({
  value,
  onChange,
  onSubmit,
  busy,
  onStop,
  modelSelector,
  placeholder = 'Ask Aevori…',
  maxAttachments = 3,
  onError,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [previewText, setPreviewText] = useState('');
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [textHeight, setTextHeight] = useState(56);
  const text = useRef<HTMLTextAreaElement>(null);
  const collapse = useRef<HTMLButtonElement>(null);
  const upload = useRef<HTMLInputElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const speech = useRef<Recognition | null>(null);
  const fileRef = useRef(files);
  const sendLock = useRef(false);
  const valueRef = useRef(value);
  fileRef.current = files;
  valueRef.current = value;
  const expanded = focused || Boolean(value) || files.length > 0 || busy || sending || recording;
  const disabled = busy || sending;
  useLayoutEffect(() => {
    const el = text.current;
    if (!el) return;
    el.style.height = '0px';
    const height = Math.min(220, Math.max(56, el.scrollHeight));
    el.style.height = height + 'px';
    setTextHeight(height);
  }, [value, expanded]);
  useEffect(
    () => () => {
      speech.current?.stop();
      fileRef.current.forEach((file) => URL.revokeObjectURL(file.url));
    },
    [],
  );
  useEffect(() => {
    let current = true;
    setPreviewText('');
    if (preview && !IMAGE_TYPES.includes(preview.file.type))
      void preview.file
        .text()
        .then((value) => {
          if (current) setPreviewText(value);
        })
        .catch(() => {
          if (current) setPreviewText('Preview unavailable.');
        });
    return () => {
      current = false;
    };
  }, [preview]);
  useEffect(() => {
    if (busy && speech.current) speech.current.stop();
  }, [busy]);
  const add = (incoming: File[]) => {
    if (disabled) return;
    onError('');
    const available = maxAttachments - fileRef.current.length;
    if (incoming.length > available) {
      onError(`Up to ${maxAttachments} attachments per message.`);
      return;
    }
    const invalid = incoming.map(attachmentError).find(Boolean);
    if (invalid) {
      onError(invalid);
      return;
    }
    const next = incoming.map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    }));
    setFiles((previous) => [...previous, ...next]);
    setFocused(true);
  };
  const remove = (id: string) =>
    setFiles((previous) => {
      const file = previous.find((file) => file.id === id);
      if (file) URL.revokeObjectURL(file.url);
      return previous.filter((file) => file.id !== id);
    });
  const send = async () => {
    if (sendLock.current || disabled || (!value.trim() && !files.length)) return;
    sendLock.current = true;
    setSending(true);
    onError('');
    speech.current?.stop();
    const submitted = [...files];
    try {
      if (await onSubmit(value.trim(), { attachments: submitted.map((item) => item.file) })) {
        submitted.forEach((item) => URL.revokeObjectURL(item.url));
        setFiles((previous) =>
          previous.filter((item) => !submitted.some((sent) => sent.id === item.id)),
        );
        setPreview(null);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not send the message.');
    } finally {
      sendLock.current = false;
      setSending(false);
    }
  };
  const voice = () => {
    if (recording) {
      speech.current?.stop();
      return;
    }
    const api = window as typeof window & {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Recognizer = api.SpeechRecognition || api.webkitSpeechRecognition;
    if (!Recognizer) {
      onError("This browser doesn't support voice input. Please type your message.");
      return;
    }
    onError('');
    setFocused(true);
    const recognition = new Recognizer();
    speech.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    let baseline = valueRef.current;
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) baseline += (baseline ? ' ' : '') + result[0].transcript;
        else interim += result[0].transcript;
      }
      onChange((baseline + (interim ? ' ' + interim : '')).slice(0, 20000));
    };
    recognition.onend = () => {
      speech.current = null;
      setRecording(false);
    };
    recognition.onerror = (event) => {
      if (event.error !== 'aborted')
        onError(
          event.error === 'not-allowed'
            ? 'Microphone access denied.'
            : 'Voice input interrupted. You can keep typing.',
        );
      setRecording(false);
    };
    try {
      recognition.start();
      setRecording(true);
    } catch {
      speech.current = null;
      setRecording(false);
      onError('Could not start voice input.');
    }
  };
  const paste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = Array.from(event.clipboardData.files);
    if (pasted.length) {
      event.preventDefault();
      add(pasted);
    }
  };
  return (
    <>
      <div
        ref={container}
        className={`aevori-prompt ${expanded ? 'expanded' : ''} ${dragging ? 'dragging' : ''}`}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node) && !preview)
            setFocused(false);
        }}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes('Files')) {
            event.preventDefault();
            setDragging(true);
          }
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          add(Array.from(event.dataTransfer.files));
        }}
      >
        {!expanded && (
          <button
            ref={collapse}
            type="button"
            className="prompt-collapsed"
            aria-label="Write a message"
            onClick={() => {
              setFocused(true);
              requestAnimationFrame(() => text.current?.focus());
            }}
          >
            <span>{placeholder}</span>
            <Plus size={18} />
          </button>
        )}
        <div
          className="prompt-expanded"
          style={{ height: expanded ? textHeight + 60 + (files.length ? 82 : 0) : 0 }}
          inert={!expanded}
          aria-hidden={!expanded}
        >
          {files.length > 0 && (
            <div className="prompt-files">
              {files.map((item) => (
                <div className="prompt-file" key={item.id}>
                  <button
                    type="button"
                    aria-label={`View ${item.file.name}`}
                    onClick={() => setPreview(item)}
                  >
                    {IMAGE_TYPES.includes(item.file.type) ? (
                      <img src={item.url} alt="" />
                    ) : (
                      <FileText size={22} />
                    )}
                    <span>
                      <strong>{item.file.name}</strong>
                      <small>{fileSize(item.file.size)}</small>
                    </span>
                  </button>
                  <button
                    className="prompt-file-remove"
                    type="button"
                    disabled={disabled}
                    aria-label={`Remove ${item.file.name}`}
                    onClick={() => remove(item.id)}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <textarea
            ref={text}
            aria-label="Message"
            placeholder={placeholder}
            value={value}
            maxLength={20000}
            readOnly={sending}
            rows={2}
            onFocus={() => setFocused(true)}
            onChange={(event) => onChange(event.target.value)}
            onPaste={paste}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void send();
              }
              if (event.key === 'Escape' && !value && !files.length && !disabled) {
                setFocused(false);
                requestAnimationFrame(() => collapse.current?.focus());
              }
            }}
          />
          <div className="prompt-tools">
            <div className="prompt-model">{modelSelector}</div>
            <div className="prompt-actions">
              <button
                type="button"
                disabled={disabled}
                aria-label="Attach files"
                title="Attach files"
                onClick={() => upload.current?.click()}
              >
                <Plus size={19} />
              </button>
              {busy ? (
                <button
                  className="prompt-send"
                  type="button"
                  aria-label="Stop response"
                  onClick={onStop}
                >
                  <Square size={14} fill="currentColor" />
                </button>
              ) : value.trim() || files.length ? (
                <button
                  className="prompt-send"
                  type="button"
                  disabled={sending}
                  aria-label="Send message"
                  onClick={() => void send()}
                >
                  <ArrowUp size={18} />
                </button>
              ) : (
                <button
                  className={`prompt-send ${recording ? 'recording' : ''}`}
                  type="button"
                  aria-label={recording ? 'Stop voice input' : 'Start voice input'}
                  title="Voice input through your browser; may use a cloud service"
                  onClick={voice}
                >
                  {recording ? <Square size={14} fill="currentColor" /> : <Mic size={17} />}
                </button>
              )}
            </div>
          </div>
        </div>
        <input
          ref={upload}
          className="sr-only"
          type="file"
          multiple
          accept={ATTACHMENT_ACCEPT}
          aria-label="Choose attachments"
          onChange={(event) => {
            add(Array.from(event.target.files || []));
            event.target.value = '';
          }}
        />
      </div>
      {preview && (
        <Dialog.Root
          open
          onOpenChange={(open) => {
            if (!open) setPreview(null);
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="attachment-preview-overlay" />
            <Dialog.Content className="attachment-preview">
              <Dialog.Title>{preview.file.name}</Dialog.Title>
              <Dialog.Description>
                {fileSize(preview.file.size)} · Sent only with your message
              </Dialog.Description>
              <Dialog.Close className="attachment-preview-close" aria-label="Close preview">
                <X size={18} />
              </Dialog.Close>
              {IMAGE_TYPES.includes(preview.file.type) ? (
                <img src={preview.url} alt={preview.file.name} />
              ) : (
                <pre>{previewText}</pre>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
}
