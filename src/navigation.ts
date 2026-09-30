import type { View } from './components/app-shared';
import {
  Activity,
  CheckCheck,
  Cpu,
  MessageCircle,
  Monitor,
  Network,
  Settings,
  ShieldCheck,
  Sparkles,
  StickyNote,
} from './MotionIcon';

export const NAV: { id: View; name: string; icon: typeof Cpu }[] = [
  { id: 'chat', name: 'Chat', icon: MessageCircle },
  { id: 'agent', name: 'Your agent', icon: Activity },
  { id: 'muse', name: 'Cloud AI', icon: Sparkles },
  { id: 'notes', name: 'Notes', icon: StickyNote },
  { id: 'tasks', name: 'Tasks', icon: CheckCheck },
  { id: 'models', name: 'Models', icon: Cpu },
  { id: 'system', name: 'Your Mac', icon: Monitor },
  { id: 'pool', name: 'Mac pool', icon: Network },
  { id: 'team', name: 'Team', icon: ShieldCheck },
  { id: 'settings', name: 'Settings', icon: Settings },
];
