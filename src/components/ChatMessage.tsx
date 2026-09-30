import { Pencil } from 'lucide-react';
import { CheckCheck, Copy, RefreshCw, StickyNote } from '../MotionIcon';
import type { Message } from '../chat-state';
import { modelLabel } from '../model-catalog';
import { ChatActivityAvatar } from './ChatActivity';
import ChatMarkdown from './ChatMarkdown';
import MessageAttachments from './MessageAttachments';
import SmoothHeight from './SmoothHeight';
type Props = {
  avatar?: React.ReactNode;
  message: Message;
  active: boolean;
  busy: boolean;
  status: string;
  onCopy: () => void;
  onRetry: () => void;
  onEdit: () => void;
  onNote: () => void;
  onTask: () => void;
};
export default function ChatMessage({
  avatar,
  message: m,
  active,
  busy,
  status,
  onCopy,
  onRetry,
  onEdit,
  onNote,
  onTask,
}: Props) {
  return (
    <article className={`message ${m.role}`}>
      {m.role === 'assistant' && (avatar || <ChatActivityAvatar active={active} />)}
      <div className="message-stack">
        <SmoothHeight>
          <div className={`message-body ${active ? 'is-streaming' : ''}`}>
            {m.role === 'assistant' ? (
              <>
                {m.content ? (
                  <div className="reply-content">
                    <ChatMarkdown>{m.content}</ChatMarkdown>
                  </div>
                ) : (
                  <div
                    className="typing-dots"
                    role="status"
                    aria-label={status || 'Preparing a response.'}
                  >
                    <i />
                    <i />
                    <i />
                  </div>
                )}
                {m.content && (
                  <div className="reply-details">
                    {m.model && <span title={m.selectionReason}>{modelLabel(m.model)}</span>}
                    {m.machine && <span>on {m.machine}</span>}
                    {m.usage && (
                      <span>
                        {(m.usage.durationMs / 1000).toFixed(1)} s
                        {m.usage.outputTokens != null ? ` · ${m.usage.outputTokens} Tokens` : ''}
                        {m.usage.tokensPerSecond != null
                          ? ` · ${m.usage.tokensPerSecond} tokens/s`
                          : ''}
                      </span>
                    )}
                  </div>
                )}
                {!!m.omittedMessages && (
                  <p className="reply-notice">
                    {m.omittedMessages} earlier messages were shortened for this response. The full
                    conversation is still available here.
                  </p>
                )}
                {m.truncated && (
                  <p className="reply-notice">
                    The output limit was reached. You can ask for a continuation.
                  </p>
                )}
                {m.state === 'stopped' && <p className="reply-notice">Response stopped.</p>}
                {m.state === 'error' && (
                  <p className="reply-notice">This response is incomplete.</p>
                )}
              </>
            ) : (
              <>
                <MessageAttachments images={m.images} files={m.files} />
                <p>{m.content}</p>
              </>
            )}
          </div>
        </SmoothHeight>
        {m.role === 'assistant' && m.content && !busy && (
          <div className="message-actions">
            <button onClick={onCopy} aria-label="Copy response" title="Copy response">
              <Copy size={14} />
            </button>
            <button
              onClick={onRetry}
              aria-label="Regenerate response"
              title="Regenerate · new conversation"
            >
              <RefreshCw size={14} />
            </button>
            <button onClick={onNote} aria-label="Save as a note" title="Save as a note">
              <StickyNote size={14} />
            </button>
            <button onClick={onTask} aria-label="Create task from response" title="Create task">
              <CheckCheck size={14} />
            </button>
          </div>
        )}
        {m.role === 'user' && !busy && (
          <div className="message-actions">
            <button onClick={onEdit} aria-label="Edit message" title="Edit · new conversation">
              <Pencil size={13} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
