import {useRef,useState,type FormEvent,type ReactNode} from 'react';
import {Tabs} from 'radix-ui';
import {ArrowUpRight,Check,ChevronRight,Download,Monitor,Network,Palette,ShieldCheck,Sparkles,UserRound,Users} from 'lucide-react';
import {ProfileForm} from './ProfileSetup';
import CharacterEditor from './CharacterEditor';
import Companion from './Companion';
import ThemePreview from './ThemePreview';
import type {useAgent} from './AgentWorkspace';
import {appearanceForTone} from '../../shared/character.mjs';
import './settings-page.css';

export type SettingsTab='profile'|'agent'|'appearance'|'connections'|'data';
type Props={
 tab:SettingsTab;onTab:(tab:SettingsTab)=>void;name:string;owner:boolean;onName:(name:string)=>void;
 agent:ReturnType<typeof useAgent>;theme:string;onTheme:(theme:string)=>void;glass:boolean;onGlass:(value:boolean)=>void;motion:boolean;onMotion:(value:boolean)=>void;
 connected:boolean;providerName:string;modelName:string;nodeCount:number;contentCount:{chats:number;notes:number;tasks:number};deletedChats:{id:string;title:string}[];
 onRestore:(id:string)=>void;onExport:()=>void;onSetup:()=>void;onOpen:(view:'models'|'pool'|'team')=>void;onOpenAgent:(section:'memory'|'rules')=>void;notify:(message:string)=>void;
};
const sections:[SettingsTab,string][]=[['profile','Profil'],['agent','Dein Agent'],['appearance','Erscheinungsbild'],['connections','Verbindungen'],['data','Daten']];
function SettingsSection({title,description,children}:{title:string;description:string;children:ReactNode}){
 return <section className="settings-section"><div className="settings-section-label"><h2>{title}</h2><p>{description}</p></div><div className="settings-section-body">{children}</div></section>;
}
function SettingsSwitch({label,description,value,onChange,disabled=false}:{label:string;description:string;value:boolean;onChange:(value:boolean)=>void;disabled?:boolean}){
 return <div className="preference-row"><div><strong>{label}</strong><p>{description}</p></div><button type="button" role="switch" aria-label={label} aria-checked={value} disabled={disabled} className={`toggle ${value?'on':''}`} onClick={()=>onChange(!value)}><i/></button></div>;
}
function AgentNameForm({name,onSave}:{name:string;onSave:(name:string)=>Promise<void>}){
 const [draft,setDraft]=useState(name),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const save=async(e:FormEvent)=>{e.preventDefault();if(busy||!draft.trim())return;setBusy(true);setError('');try{await onSave(draft.trim());}catch(e){setError(e instanceof Error?e.message:'Der Name konnte nicht gespeichert werden.');}finally{setBusy(false);}};
 return <form className="settings-name-form" onSubmit={save}><label htmlFor="settings-agent-name">Name deines Agenten</label><div><input id="settings-agent-name" required maxLength={32} autoComplete="off" value={draft} disabled={busy} onChange={e=>setDraft(e.target.value)}/><button className="primary" disabled={busy||!draft.trim()||draft.trim()===name}>{busy?'Speichert …':'Speichern'}</button></div>{error&&<p className="small-error" role="alert">{error}</p>}</form>;
}
export default function SettingsPage(props:Props){
 const {agent}=props,state=agent.state;
 const [editing,setEditing]=useState(false),[savingMemory,setSavingMemory]=useState(false),[error,setError]=useState('');
 const editButton=useRef<HTMLButtonElement>(null);
 const memory=async(value:boolean)=>{setSavingMemory(true);setError('');try{await agent.action('profile',{memoryEnabled:value});props.notify(value?'Erinnerungen sind aktiviert.':'Erinnerungen werden nicht mehr verwendet.');}catch(e){setError(e instanceof Error?e.message:'Die Einstellung konnte nicht gespeichert werden.');}finally{setSavingMemory(false);}};
 const openCharacter=()=>{setError('');setEditing(true);};
 const agentPreview=state?<div className="settings-agent-identity"><span className="settings-companion"><Companion appearance={state.appearance} tone={state.tone} size={82}/></span><div><strong>{state.name}</strong><p>Dein persönlicher Agent.</p></div><button ref={props.tab==='agent'?editButton:undefined} className="secondary" onClick={openCharacter}>{state.characterConfigured?'Charakter bearbeiten':'Charakter erstellen'}<Palette size={14}/></button></div>:<p role="status" className="settings-loading">{agent.error||'Dein Agent wird geladen …'}</p>;
 return <div className="settings-page">
  <header className="settings-page-heading"><h1>Einstellungen</h1><p>Dein Profil, dein Agent und dein Arbeitsplatz.</p></header>
  <Tabs.Root value={props.tab} onValueChange={value=>props.onTab(value as SettingsTab)} className="settings-tabs-root">
   <Tabs.List className="settings-tabs" aria-label="Einstellungsbereiche">{sections.map(([id,label])=><Tabs.Trigger key={id} value={id}>{label}</Tabs.Trigger>)}</Tabs.List>
   <Tabs.Content value="profile" className="settings-panel">
    <SettingsSection title="Dein Profil" description="So erscheinst du in deinem Arbeitsplatz und im Team."><div className="settings-profile-identity"><span className="settings-profile-avatar">{props.name.slice(0,1).toUpperCase()||<UserRound size={25}/>}</span><div><strong>{props.name||'Dein Profil'}</strong><p>{props.owner?'Persönlicher Arbeitsplatz':'Team-Arbeitsplatz'}</p></div><span className="settings-badge"><ShieldCheck size={13}/>{props.owner?'Auf diesem Mac':'Dein Zugang'}</span></div></SettingsSection>
    <SettingsSection title="Anzeigename" description="Wähle den Namen, den deine Freunde und dein Team sehen."><ProfileForm key={props.name} name={props.name} onSave={props.onName}/></SettingsSection>
    <SettingsSection title="Dein Agent" description="Ein eigener Name. Ein Charakter, der zu dir passt.">{agentPreview}<button className="settings-text-link" onClick={()=>props.onTab('agent')}>Agent-Einstellungen öffnen<ChevronRight size={14}/></button></SettingsSection>
    <SettingsSection title="Dein Einstieg" description="Name, Erscheinungsbild und Einrichtung noch einmal ansehen."><div className="settings-action-row"><div><strong>Willkommen bei AEVORI</strong><p>Öffne die persönliche Einrichtung erneut.</p></div><button className="secondary" onClick={props.onSetup}>Einrichtung ansehen<ArrowUpRight size={14}/></button></div></SettingsSection>
   </Tabs.Content>
   <Tabs.Content value="agent" className="settings-panel">
    <SettingsSection title="Identität" description="Gestalte deinen Begleiter. Name und Figur erscheinen im Agentenbereich und im lokalen Chat.">{agentPreview}{state&&<AgentNameForm key={state.name} name={state.name} onSave={async name=>{await agent.action('profile',{name});props.notify('Der Name deines Agenten wurde gespeichert.');}}/>}</SettingsSection>
    <SettingsSection title="Gedächtnis" description="Dein Agent kann bestätigte Vorlieben und Informationen berücksichtigen.">{state&&<SettingsSwitch label="Erinnerungen verwenden" description={`${state.memories.length} bestätigte ${state.memories.length===1?'Erinnerung':'Erinnerungen'}. Beim Ausschalten bleiben sie gespeichert.`} value={state.memoryEnabled} onChange={value=>void memory(value)} disabled={savingMemory}/>}<button className="settings-text-link" onClick={()=>props.onOpenAgent('memory')}>Erinnerungen verwalten<ChevronRight size={14}/></button>{error&&<p className="small-error" role="alert">{error}</p>}</SettingsSection>
    <SettingsSection title="Aktionsregeln" description="Du bestimmst, was dein Agent übernehmen darf."><div className="settings-action-row"><div><strong>Deine Freigaben</strong><p>Notizen und Aufgaben prüfen, automatisch speichern oder blockieren.</p></div><button className="secondary" onClick={()=>props.onOpenAgent('rules')}>Regeln verwalten<ArrowUpRight size={14}/></button></div></SettingsSection>
   </Tabs.Content>
   <Tabs.Content value="appearance" className="settings-panel">
    <SettingsSection title="Farbschema" description="Wähle die Oberfläche, in der du dich wohlfühlst."><div className="theme-choices settings-theme-choices" role="group" aria-label="Farbschema">{[{id:'dark',name:'Dunkel'},{id:'light',name:'Hell'},{id:'sand',name:'Sand'}].map(theme=><button aria-pressed={props.theme===theme.id} className={`theme-choice ${theme.id} ${props.theme===theme.id?'selected':''}`} key={theme.id} onClick={()=>props.onTheme(theme.id)}><ThemePreview theme={theme.id}/><span>{theme.name}{props.theme===theme.id&&<Check size={14}/>}</span></button>)}</div></SettingsSection>
    <SettingsSection title="Darstellung" description="Feine Details für deinen Arbeitsplatz."><SettingsSwitch label="Transparente Seitenleiste" description="Eine leicht durchscheinende Navigationsfläche." value={props.glass} onChange={props.onGlass}/><SettingsSwitch label="Animationen" description="Sanfte Übergänge und lebendige Charaktere." value={props.motion} onChange={props.onMotion}/></SettingsSection>
   </Tabs.Content>
   <Tabs.Content value="connections" className="settings-panel">
    <SettingsSection title="Intelligenz" description="Deine Modelle und der aktive KI-Anbieter."><div className="settings-action-row"><span className="settings-row-icon"><Sparkles size={20}/></span><div><strong>{props.providerName}</strong><p>{props.connected?props.modelName:'Nicht verbunden'}</p></div><button className="secondary" onClick={()=>props.onOpen('models')}>Modelle verwalten<ArrowUpRight size={14}/></button></div></SettingsSection>
    <SettingsSection title="Geräte & Team" description="Arbeite mit deinen Macs und den Menschen, die du einlädst."><div className="settings-action-row"><span className="settings-row-icon"><Network size={20}/></span><div><strong>Mac-Pool</strong><p>{props.nodeCount} {props.nodeCount===1?'Mac im Arbeitsplatz':'Macs im Arbeitsplatz'}</p></div><button className="secondary" onClick={()=>props.onOpen('pool')}>Mac-Pool öffnen<ArrowUpRight size={14}/></button></div><div className="settings-action-row"><span className="settings-row-icon"><Users size={20}/></span><div><strong>Dein Team</strong><p>Mitglieder und persönliche Zugänge ansehen.</p></div><button className="secondary" onClick={()=>props.onOpen('team')}>Team öffnen<ArrowUpRight size={14}/></button></div></SettingsSection>
    <SettingsSection title="Auf deinem Handy" description="Deinen Agenten direkt vom Home-Bildschirm öffnen."><div className="settings-action-row"><span className="settings-row-icon"><Monitor size={20}/></span><div><strong>AEVORI als Web-App</strong><p>Die Anleitung zeigt dir die nächsten Schritte.</p></div><a className="secondary" href="/?install=1">Anleitung öffnen<ArrowUpRight size={14}/></a></div></SettingsSection>
   </Tabs.Content>
   <Tabs.Content value="data" className="settings-panel">
    <SettingsSection title="Deine Inhalte" description="Chats, Notizen und Aufgaben sind in diesem Browser gespeichert."><div className="settings-content-counts">{[[props.contentCount.chats,'Chats'],[props.contentCount.notes,'Notizen'],[props.contentCount.tasks,'Aufgaben']].map(([count,label])=><div key={label}><strong>{count}</strong><span>{label}</span></div>)}</div><div className="settings-action-row"><div><strong>Sicherung herunterladen</strong><p>Exportiere deine Inhalte als JSON-Datei.</p></div><button className="secondary" onClick={props.onExport}><Download size={15}/>Inhalte exportieren</button></div></SettingsSection>
    <SettingsSection title="Agent-Speicher" description="Dein Charakter, Erinnerungen, Regeln und Aufträge bleiben auf dem Haupt-Mac."><div className="settings-action-row"><div><strong>Nach Teamzugang getrennt</strong><p>Der Betreiber des Haupt-Macs kann die lokale Speicherdatei lesen.</p></div><button className="secondary" onClick={()=>props.onOpenAgent('memory')}>Speicher ansehen<ArrowUpRight size={14}/></button></div><p className="settings-note">Bei externen KI-Anbietern werden die von dir gesendeten Nachrichten und Anhänge an den Anbieter übertragen. API-Schlüssel bleiben nur im Arbeitsspeicher des Dienstes.</p></SettingsSection>
    <SettingsSection title="Gelöschte Chats" description="Hier kannst du entfernte Gespräche wiederherstellen.">{props.deletedChats.length?<div className="settings-restore-list">{props.deletedChats.map(chat=><div key={chat.id}><span>{chat.title}</span><button className="secondary" onClick={()=>props.onRestore(chat.id)}>Wiederherstellen</button></div>)}</div>:<p className="settings-empty">Keine gelöschten Chats.</p>}</SettingsSection>
   </Tabs.Content>
  </Tabs.Root>
  {editing&&state&&<CharacterEditor name={state.name} appearance={state.appearance??appearanceForTone(state.tone)} configured={state.characterConfigured} onClose={()=>setEditing(false)} onReturnFocus={()=>editButton.current?.focus({preventScroll:true})} onSave={async draft=>{await agent.action('profile',draft);props.notify('Dein Charakter wurde gespeichert.');}}/>}
 </div>;
}
