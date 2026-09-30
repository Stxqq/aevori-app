import {MessageSquare,PanelLeftClose,Search,Settings,SquarePen,Trash2,ChevronRight} from 'lucide-react';
import BrandLogo from './BrandLogo';
import {Sidebar,SidebarContent,SidebarFooter,SidebarGroup,SidebarHeader,SidebarMenu,SidebarMenuButton,SidebarMenuItem,useSidebar} from './ui/sidebar';
import {NavGroup} from './nav-group';
import type {SidebarNavGroup} from './app-shared';

type Props={groups:SidebarNavGroup[];chats:{id:string;title:string}[];activeChat:string|null;busy:boolean;profileName:string;owner:boolean;settingsActive?:boolean;onNewChat:()=>void;onSearch:()=>void;onSettings:()=>void;onSelectChat:(id:string)=>void;onDeleteChat:(id:string)=>void};
export function AppSidebar({groups,chats,activeChat,busy,profileName,owner,settingsActive=false,onNewChat,onSearch,onSettings,onSelectChat,onDeleteChat}:Props){
 const {setOpenMobile,isMobile,state}=useSidebar();
 const act=(callback:()=>void)=>{setOpenMobile(false);callback();};
 const compact=!isMobile&&state==='collapsed';
 return <Sidebar collapsible="icon" variant="inset" className="aevori-navigation" aria-label="Seitenleiste">
  <SidebarHeader className="shell-sidebar-header">
   <div className="shell-brand"><BrandLogo symbol={compact}/><button className="shell-icon-button shell-search" aria-label="Suchen" title="Suchen · ⌘K" onClick={()=>act(onSearch)}><Search size={17}/></button>{isMobile&&<button className="shell-icon-button" aria-label="Menü schließen" onClick={()=>setOpenMobile(false)}><PanelLeftClose size={18}/></button>}</div>
   <SidebarMenu><SidebarMenuItem><SidebarMenuButton className="shell-new-chat" tooltip="Neuer Chat" aria-label="Neuer Chat" disabled={busy} onClick={()=>act(onNewChat)}><SquarePen size={17}/><span>Neuer Chat</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
  </SidebarHeader>
  <SidebarContent>
   <nav aria-label="Hauptnavigation">{groups.map((group,index)=><NavGroup key={group.label||index} {...group}/>)}</nav>
   <SidebarGroup className="shell-chats"><div className="shell-group-heading"><span>Letzte Chats</span><span className="shell-chat-total">{chats.length||''}</span></div><SidebarMenu>
    {chats.map(chat=><SidebarMenuItem className="shell-chat-row" key={chat.id}>
     <SidebarMenuButton tooltip={chat.title} aria-label={chat.title} isActive={activeChat===chat.id} aria-current={activeChat===chat.id?'page':undefined} disabled={busy} onClick={()=>act(()=>onSelectChat(chat.id))}><MessageSquare size={15}/><span>{chat.title}</span></SidebarMenuButton>
     <button className="shell-chat-delete" aria-label={`Chat löschen: ${chat.title}`} disabled={busy&&activeChat===chat.id} onClick={()=>onDeleteChat(chat.id)}><Trash2 size={13}/></button>
    </SidebarMenuItem>)}
   </SidebarMenu>{!chats.length&&<p className="shell-empty-chats">Deine Gespräche erscheinen hier.</p>}</SidebarGroup>
  </SidebarContent>
  <SidebarFooter className="shell-sidebar-footer">
   <SidebarMenu><SidebarMenuItem><SidebarMenuButton tooltip="Einstellungen" aria-label="Einstellungen" isActive={settingsActive} aria-current={settingsActive?'page':undefined} onClick={()=>act(onSettings)}><Settings size={17}/><span>Einstellungen</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
   <button className="shell-profile" aria-label="Dein Profil bearbeiten" title={profileName||'Dein Profil'} onClick={()=>act(onSettings)}><span className="shell-avatar">{profileName.slice(0,1).toUpperCase()||'A'}</span><span className="shell-profile-copy"><strong>{profileName||'Dein Profil'}</strong><small>{owner?'Persönlicher Arbeitsplatz':'Team-Arbeitsplatz'}</small></span><ChevronRight size={14}/></button>
  </SidebarFooter>
 </Sidebar>;
}
