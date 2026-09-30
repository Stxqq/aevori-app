import type { ReactNode } from 'react';

export type View =
  | 'agent'
  | 'muse'
  | 'chat'
  | 'system'
  | 'models'
  | 'notes'
  | 'tasks'
  | 'pool'
  | 'team'
  | 'settings';
export type SidebarNavItem = {
  id: View;
  title: string;
  icon: ReactNode;
  isActive: boolean;
  badge?: number;
  onSelect: () => void;
};
export type SidebarNavGroup = { label?: string; items: SidebarNavItem[]; defaultOpen?: boolean };
