import type { Message } from './chat-state';

export type Model = { id: string; size?: number; parameters?: string; quantization?: string };
export type Provider = {
  type: 'ollama' | 'compatible';
  baseUrl: string;
  local: boolean;
  hasKey: boolean;
  brand?: string | null;
};
export type Stats = {
  hardware: { name: string; chip: string; cores: number; os: string };
  cpu: number;
  memory: { total: number; used: number };
  disk: null | { total: number; used: number; free: number };
  uptime: number;
  processes: { pid: number; cpu: number; memory: number; name: string; icon?: string }[];
  at: string;
};
export type Chat = {
  id: string;
  title: string;
  messages: Message[];
  updated: number;
  deletedAt?: number;
};
export type Task = { id: string; text: string; priority: 'low' | 'medium' | 'high'; done: boolean };
export type Note = { id: string; title: string; body: string; updated: number };
