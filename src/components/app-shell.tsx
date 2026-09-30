import type {CSSProperties,ReactNode} from 'react';
import {SidebarInset,SidebarProvider} from '@/components/ui/sidebar';
import {AppHeader,type HeaderProps} from './app-header';
import './app-shell.css';

/** Adapted from @efferd/app-shell-3: inset canvas, collapsible navigation, fixed header. */
export function AppShell({children,sidebar,className='',...header}:HeaderProps&{children:ReactNode;sidebar:ReactNode;className?:string}){
 return <SidebarProvider className={`app aevori-shell ${className}`} style={{'--sidebar-width':'254px','--sidebar-width-icon':'44px'} as CSSProperties}>
  {sidebar}
  <SidebarInset className="main-shell"><AppHeader {...header}/>{children}</SidebarInset>
 </SidebarProvider>;
}
