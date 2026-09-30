import {useEffect,useRef,type CSSProperties} from 'react';
import * as Icons from 'lucide-react';
type Props={size?:number;className?:string;fill?:string;style?:CSSProperties};
/** Lucide artwork (ISC), with AEVORI's interaction motion. No remote assets. */
function animated(Icon:Icons.LucideIcon){return function MotionIcon({size=18,className='',style}:Props){
 const ref=useRef<HTMLSpanElement>(null);
 useEffect(()=>{const el=ref.current;if(!el)return;const target=el.closest('button,label,a')||el;let animation:Animation|undefined;
  const play=()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='off')return;animation?.cancel();animation=el.animate([{transform:'translateY(0) scale(1)'},{transform:'translateY(-1px) scale(1.09)',offset:.4},{transform:'translateY(0) scale(1)'}],{duration:360,easing:'cubic-bezier(.2,.8,.2,1)'});};
  target.addEventListener('pointerenter',play);target.addEventListener('focusin',play);target.addEventListener('click',play);
  return()=>{animation?.cancel();target.removeEventListener('pointerenter',play);target.removeEventListener('focusin',play);target.removeEventListener('click',play);};
 },[]);
 return <span aria-hidden="true" className={`motion-icon ${className}`} style={{width:size,height:size,...style}}><span ref={ref}><Icon size={size} strokeWidth={1.7}/></span></span>;
};}
export const LayoutDashboard=animated(Icons.LayoutDashboard),MessageCircle=animated(Icons.MessageCircle),Monitor=animated(Icons.Monitor),Network=animated(Icons.Network),Settings=animated(Icons.Settings),Search=animated(Icons.Search),Cpu=animated(Icons.Cpu),MemoryStick=animated(Icons.MemoryStick),HardDrive=animated(Icons.HardDrive),ShieldCheck=animated(Icons.ShieldCheck),StickyNote=animated(Icons.StickyNote),FileText=animated(Icons.FileText),Trash2=animated(Icons.Trash2),RefreshCw=animated(Icons.RefreshCw),Menu=animated(Icons.Menu),PanelLeft=animated(Icons.PanelLeft),Sparkles=animated(Icons.Sparkles),Activity=animated(Icons.Activity),AudioLines=animated(Icons.AudioLines),Wifi=animated(Icons.Wifi),Link2=animated(Icons.Link2),Copy=animated(Icons.Copy),Plus=animated(Icons.Plus),X=animated(Icons.X),Check=animated(Icons.Check),CheckCheck=animated(Icons.CheckCheck),CheckCircle2=animated(Icons.CheckCircle2),Square=animated(Icons.Square),ArrowUp=animated(Icons.ArrowUp),Send=animated(Icons.Send),ArrowUpRight=animated(Icons.ArrowUpRight),ChevronRight=animated(Icons.ChevronRight),ChevronDown=animated(Icons.ChevronDown),ChevronUp=animated(Icons.ChevronUp),ArrowLeft=animated(Icons.ArrowLeft),Command=animated(Icons.Command),MoreHorizontal=animated(Icons.MoreHorizontal),Timer=animated(Icons.Timer);
