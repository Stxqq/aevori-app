import { useState } from 'react';
import Markdown from 'react-markdown';
import { Check, FileText, Plus, Search, StickyNote, Trash2 } from '../MotionIcon';
export type Note = { id: string; title: string; body: string; updated: number };
export default function NotesPanel({
  notes,
  noteId,
  onSelect,
  onChange,
  onAdd,
  onDelete,
}: {
  notes: Note[];
  noteId: string | null;
  onSelect: (id: string) => void;
  onChange: (note: Note) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState(false);
  const shown = notes.filter((n) =>
    `${n.title} ${n.body}`.toLowerCase().includes(query.toLowerCase()),
  );
  const current = shown.find((n) => n.id === noteId) || shown[0];
  const add = () => {
    setQuery('');
    setPreview(false);
    onAdd();
  };
  return (
    <section className="notes-studio">
      <header className="notes-page-title">
        <div>
          <span className="eyebrow">Your notebook</span>
          <h1>Thoughts. In good hands.</h1>
          <p>A quiet place for everything worth keeping.</p>
        </div>
        <button className="primary" onClick={add}>
          <Plus size={16} />
          New note
        </button>
      </header>
      <div className="notes-desk">
        <aside className="notes-index">
          <div className="notes-index-heading">
            <span>All notes</span>
            <small>{notes.length}</small>
          </div>
          <label className="notes-search">
            <Search size={15} />
            <input
              aria-label="Search notes"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="notes-index-list">
            {shown.map((n) => (
              <button
                key={n.id}
                className={current?.id === n.id ? 'selected' : ''}
                onClick={() => onSelect(n.id)}
              >
                <span className="note-item-heading">
                  <strong>{n.title || 'Untitled'}</strong>
                  <FileText size={13} />
                </span>
                <p>{n.body.replace(/[#*`]/g, '').slice(0, 85) || 'Your next idea starts here.'}</p>
                <time>
                  {new Date(n.updated).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </time>
              </button>
            ))}
            {!shown.length && (
              <p className="notes-no-results">
                {query ? 'No matching notes.' : 'A blank page, for now.'}
              </p>
            )}
          </div>
          <div className="notes-local">
            <span className="status-dot online" />
            Private on this device
          </div>
        </aside>
        {current ? (
          <article className="notes-paper">
            <div className="notes-paper-toolbar">
              <span>
                <Check size={13} />
                Saved automatically
              </span>
              <div>
                <button className={!preview ? 'selected' : ''} onClick={() => setPreview(false)}>
                  Writing
                </button>
                <button className={preview ? 'selected' : ''} onClick={() => setPreview(true)}>
                  Read
                </button>
                <button
                  className="icon-button"
                  aria-label="Delete note"
                  onClick={() => onDelete(current.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="notes-writing-area">
              <span className="notes-date">
                {new Date(current.updated).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <input
                className="notes-title-input"
                aria-label="Note title"
                placeholder="Untitled"
                maxLength={100}
                value={current.title}
                onChange={(e) =>
                  onChange({ ...current, title: e.target.value, updated: Date.now() })
                }
              />
              {preview ? (
                <div className="note-markdown">
                  <Markdown skipHtml disallowedElements={['img']}>
                    {current.body || 'No thoughts captured yet.'}
                  </Markdown>
                </div>
              ) : (
                <textarea
                  className="notes-body-input"
                  aria-label="Note content"
                  placeholder="Start writing…"
                  maxLength={50000}
                  value={current.body}
                  onChange={(e) =>
                    onChange({ ...current, body: e.target.value, updated: Date.now() })
                  }
                />
              )}
            </div>
            <footer className="notes-paper-footer">
              <span>{current.body.trim() ? current.body.trim().split(/\s+/).length : 0} words</span>
              <span>Markdown supported · Just for you</span>
            </footer>
          </article>
        ) : (
          <div className="notes-blank">
            <StickyNote size={32} />
            <h2>{query ? 'No matching notes.' : 'Room for a new idea.'}</h2>
            <p>
              {query
                ? 'Try a different search or show all notes.'
                : 'A thought, a list, or your next big project.'}
            </p>
            {query ? (
              <button className="secondary" onClick={() => setQuery('')}>
                Clear search
              </button>
            ) : (
              <button className="secondary" onClick={add}>
                Write your first note
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
