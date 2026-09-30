import type { ChatFile, ChatImage } from './attachments';
export type Message = {
  role: 'user' | 'assistant';
  content: string;
  images?: ChatImage[];
  files?: ChatFile[];
  machine?: string;
  model?: string;
  selectionReason?: string;
  omittedMessages?: number;
  state?: 'complete' | 'stopped' | 'error';
  truncated?: boolean;
  usage?: {
    inputTokens?: number | null;
    outputTokens?: number | null;
    durationMs: number;
    tokensPerSecond?: number | null;
  };
};
export function wireContent(message: Message) {
  const files = message.files?.filter((f) => typeof f.text === 'string') || [];
  return [
    message.content,
    ...files.map(
      (f) =>
        `<attachment-data>\n${JSON.stringify({ filename: f.name, text: f.text })}\n</attachment-data>`,
    ),
    message.role === 'assistant' && message.state && message.state !== 'complete'
      ? '[This response was not completed.]'
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}
export function branchAt(messages: Message[], index: number) {
  let lastUser = Math.min(index, messages.length - 1);
  while (lastUser >= 0 && messages[lastUser].role !== 'user') lastUser--;
  if (lastUser < 0) throw new Error('No matching message found.');
  return { history: messages.slice(0, lastUser), message: messages[lastUser] };
}
