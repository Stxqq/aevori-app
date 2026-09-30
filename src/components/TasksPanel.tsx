import type { FormEvent } from 'react';
import { Check, CheckCircle2, Plus, X } from '../MotionIcon';
import type { Task } from '../types';
import AevoriSelect from './AevoriSelect';

type Props = {
  tasks: Task[];
  taskText: string;
  priority: Task['priority'];
  onTextChange: (text: string) => void;
  onPriorityChange: (priority: Task['priority']) => void;
  onAdd: (text: string, priority: Task['priority']) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};
export default function TasksPanel({
  tasks,
  taskText,
  priority,
  onTextChange,
  onPriorityChange,
  onAdd,
  onToggle,
  onDelete,
}: Props) {
  function addTask(event: FormEvent) {
    event.preventDefault();
    const text = taskText.trim();
    if (!text) return;
    onAdd(text, priority);
    onTextChange('');
  }
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">Tasks</span>
        <h1>One less thing on your mind.</h1>
        <p>
          {tasks.length
            ? `${tasks.filter((t) => !t.done).length} open. ${tasks.filter((t) => t.done).length} completed.`
            : 'What would you like to get done today?'}
        </p>
      </div>
      <form className="task-form" onSubmit={addTask}>
        <Plus size={19} />
        <input
          aria-label="New task"
          placeholder="Add a task…"
          maxLength={250}
          value={taskText}
          onChange={(e) => onTextChange(e.target.value)}
        />
        <AevoriSelect
          label="Priority"
          value={priority}
          onValueChange={(value) => onPriorityChange(value as Task['priority'])}
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
        />
        <button className="primary" disabled={!taskText.trim()}>
          Add
        </button>
      </form>
      <div className="task-list">
        {tasks.map((t) => (
          <div className={`task ${t.done ? 'done' : ''}`} key={t.id}>
            <button
              className="task-check"
              aria-label={t.done ? 'Reopen task' : 'Complete task'}
              onClick={() => onToggle(t.id)}
            >
              {t.done && <Check size={14} />}
            </button>
            <span>{t.text}</span>
            <span className={`priority ${t.priority}`}>
              <i />
              {t.priority === 'high' ? 'High' : t.priority === 'low' ? 'Low' : 'Medium'}
            </span>
            <button className="icon-button" aria-label="Delete task" onClick={() => onDelete(t.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      {!tasks.length && (
        <div className="empty-state">
          <CheckCircle2 size={38} />
          <h2>A fresh start.</h2>
          <p>Add your first task above.</p>
        </div>
      )}
    </>
  );
}
