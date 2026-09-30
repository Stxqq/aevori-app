import * as Icons from 'lucide-react';
import { useEffect, useRef, type CSSProperties } from 'react';
type Props = { size?: number; className?: string; fill?: string; style?: CSSProperties };
/** Lucide artwork (ISC), with AEVORI's interaction motion. No remote assets. */
function animated(Icon: Icons.LucideIcon) {
  return function MotionIcon({ size = 18, className = '', style }: Props) {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const target = el.closest('button,label,a') || el;
      let animation: Animation | undefined;
      const play = () => {
        if (
          matchMedia('(prefers-reduced-motion: reduce)').matches ||
          document.documentElement.dataset.motion === 'off'
        )
          return;
        animation?.cancel();
        animation = el.animate(
          [
            { transform: 'translateY(0) scale(1)' },
            { transform: 'translateY(-1px) scale(1.09)', offset: 0.4 },
            { transform: 'translateY(0) scale(1)' },
          ],
          { duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)' },
        );
      };
      target.addEventListener('pointerenter', play);
      target.addEventListener('focusin', play);
      target.addEventListener('click', play);
      return () => {
        animation?.cancel();
        target.removeEventListener('pointerenter', play);
        target.removeEventListener('focusin', play);
        target.removeEventListener('click', play);
      };
    }, []);
    return (
      <span
        aria-hidden="true"
        className={`motion-icon ${className}`}
        style={{ width: size, height: size, ...style }}
      >
        <span ref={ref}>
          <Icon size={size} strokeWidth={1.7} />
        </span>
      </span>
    );
  };
}
export const LayoutDashboard = animated(Icons.LayoutDashboard);
export const MessageCircle = animated(Icons.MessageCircle);
export const Monitor = animated(Icons.Monitor);
export const Network = animated(Icons.Network);
export const Settings = animated(Icons.Settings);
export const Search = animated(Icons.Search);
export const Cpu = animated(Icons.Cpu);
export const MemoryStick = animated(Icons.MemoryStick);
export const HardDrive = animated(Icons.HardDrive);
export const ShieldCheck = animated(Icons.ShieldCheck);
export const StickyNote = animated(Icons.StickyNote);
export const FileText = animated(Icons.FileText);
export const Trash2 = animated(Icons.Trash2);
export const RefreshCw = animated(Icons.RefreshCw);
export const Menu = animated(Icons.Menu);
export const PanelLeft = animated(Icons.PanelLeft);
export const Sparkles = animated(Icons.Sparkles);
export const Activity = animated(Icons.Activity);
export const AudioLines = animated(Icons.AudioLines);
export const Wifi = animated(Icons.Wifi);
export const Link2 = animated(Icons.Link2);
export const Copy = animated(Icons.Copy);
export const Plus = animated(Icons.Plus);
export const X = animated(Icons.X);
export const Check = animated(Icons.Check);
export const CheckCheck = animated(Icons.CheckCheck);
export const CheckCircle2 = animated(Icons.CheckCircle2);
export const Square = animated(Icons.Square);
export const ArrowUp = animated(Icons.ArrowUp);
export const Send = animated(Icons.Send);
export const ArrowUpRight = animated(Icons.ArrowUpRight);
export const ChevronRight = animated(Icons.ChevronRight);
export const ChevronDown = animated(Icons.ChevronDown);
export const ChevronUp = animated(Icons.ChevronUp);
export const ArrowLeft = animated(Icons.ArrowLeft);
export const Command = animated(Icons.Command);
export const MoreHorizontal = animated(Icons.MoreHorizontal);
export const Timer = animated(Icons.Timer);
