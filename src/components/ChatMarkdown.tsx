import { Children, isValidElement, useState, type ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from '../MotionIcon';
function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const child = Children.toArray(children).find(isValidElement);
  const props = child?.props as { children?: ReactNode; className?: string } | undefined;
  const text = String(props?.children ?? '').replace(/\n$/, '');
  const language = props?.className?.replace('language-', '') || 'Code';
  return (
    <div className="chat-code-block">
      <div>
        <span>{language}</span>
        <button
          onClick={() =>
            void navigator.clipboard
              .writeText(text)
              .then(() => {
                setCopied(true);
                setError(false);
                setTimeout(() => setCopied(false), 1800);
              })
              .catch(() => setError(true))
          }
          aria-label="Copy code"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{error ? 'Copying unavailable' : copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  );
}
export default function ChatMarkdown({ children }: { children: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      disallowedElements={['img']}
      skipHtml
      components={{
        pre: CodeBlock,
        table: ({ children }) => (
          <div className="chat-table-scroll">
            <table>{children}</table>
          </div>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {children}
    </Markdown>
  );
}
