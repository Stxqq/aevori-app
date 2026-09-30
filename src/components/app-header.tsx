import {PanelLeft,Settings} from 'lucide-react';
import {useSidebar} from './ui/sidebar';
import {AppBreadcrumbs} from './app-breadcrumbs';
export type HeaderProps={title:string;connected:boolean;connectionLabel:string;onConnection:()=>void;onSettings:()=>void};
export function AppHeader({title,connected,connectionLabel,onConnection,onSettings}:HeaderProps){
 const {toggleSidebar,open,isMobile,openMobile}=useSidebar();
 return <header className="shell-toolbar">
  <div><button id="aevori-sidebar-toggle" className="shell-icon-button" onClick={toggleSidebar} aria-label={isMobile?'Menü öffnen':open?'Seitenleiste einklappen':'Seitenleiste ausklappen'} aria-expanded={isMobile?openMobile:open} title="Seitenleiste · ⌘B"><PanelLeft size={18}/></button><span className="shell-toolbar-divider"/><AppBreadcrumbs title={title}/></div>
  <div><button className="shell-connection" onClick={onConnection} aria-label={`Verbindungen öffnen: ${connectionLabel}`}><i className={`status-dot ${connected?'online':''}`}/><span>{connectionLabel}</span></button><button className="shell-icon-button" aria-label="Einstellungen öffnen" onClick={onSettings}><Settings size={17}/></button></div>
 </header>;
}
