import {useEffect,useRef,useState,type FormEvent} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {ArrowLeft,ArrowUpRight,Check,ChevronRight,MessageCircle,ShieldCheck,Users,X} from 'lucide-react';
import BrandLogo from './BrandLogo';
import AevoriMark from '../AevoriMark';
import SmoothHeight from './SmoothHeight';
import ThemePreview from './ThemePreview';

export async function saveProfile(name:string):Promise<string>{
 const response=await fetch('/api/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
 const result=await response.json();
 if(!response.ok)throw new Error(result.error||'Dein Profil konnte nicht gespeichert werden.');
 return result.name;
}

export function ProfileForm({name,onSave}:{name:string;onSave:(name:string)=>void}){
 const [draft,setDraft]=useState(name),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{const saved=await saveProfile(draft);setDraft(saved);onSave(saved);}catch(e){setError(e instanceof Error?e.message:'Speichern fehlgeschlagen.');}finally{setBusy(false);}};
 return <form className="profile-form" onSubmit={submit}><label htmlFor="profile-display-name">Dein Name</label><div><input id="profile-display-name" autoComplete="nickname" value={draft} required maxLength={40} onChange={e=>setDraft(e.target.value)} aria-describedby="profile-name-help"/><button className="secondary" disabled={busy||!draft.trim()||draft.trim()===name}>{busy?'Speichert …':'Speichern'}</button></div><p id="profile-name-help">So sehen dich deine Freunde im Team. Dein Name ist jederzeit änderbar.</p>{error&&<p className="small-error" role="alert">{error}</p>}</form>;
}

type Props={name:string;theme:string;onTheme:(theme:string)=>void;ready:boolean;status:string;canClose:boolean;onClose:()=>void;onComplete:(name:string,destination:'chat'|'team')=>void};
export default function ProfileSetup({name:initialName,theme,onTheme,ready,status,canClose,onClose,onComplete}:Props){
 const [step,setStep]=useState(0),[name,setName]=useState(initialName),[destination,setDestination]=useState<'chat'|'team'>('chat'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{if(step>0)heading.current?.focus();},[step]);
 const submit=async(e:FormEvent)=>{
  e.preventDefault();setError('');
  if(!name.trim()){setStep(0);setError('Wie dürfen wir dich nennen?');return;}
  if(step<2){setStep(step+1);return;}
  setBusy(true);
  try{const saved=await saveProfile(name);onComplete(saved,destination);}catch(e){setError(e instanceof Error?e.message:'Speichern fehlgeschlagen.');}finally{setBusy(false);}
 };
 return <Dialog.Root open onOpenChange={open=>{if(!open&&canClose&&!busy)onClose();}}><Dialog.Portal>
  <Dialog.Overlay className="setup-overlay"/>
  <Dialog.Content className="setup-dialog" onInteractOutside={e=>e.preventDefault()} onEscapeKeyDown={e=>{if(!canClose||busy)e.preventDefault();}}>
   <div className="setup-top"><BrandLogo/><span>Dein Start · {step+1} von 3</span>{canClose&&<Dialog.Close className="icon-button" disabled={busy} aria-label="Einrichtung schließen"><X size={17}/></Dialog.Close>}</div>
   <div className="setup-progress" aria-label={`Schritt ${step+1} von 3`}>{[0,1,2].map(i=><span key={i} className={i<=step?'complete':''}/>)}</div>
   <SmoothHeight><form onSubmit={submit}>
    <div className="setup-page" key={step}>
     <div className="setup-mark"><AevoriMark/></div>
     <Dialog.Title ref={heading} tabIndex={-1}>{['Ein Raum für deine Ideen.','Fühlt sich nach dir an.','Bereit für deinen nächsten Gedanken.'][step]}</Dialog.Title>
     <Dialog.Description>{['Willkommen bei Aevori. Wie dürfen wir dich nennen?','Wähle das Erscheinungsbild für deinen Arbeitsplatz.',`Schön, dass du da bist, ${name.trim()}. Wie möchtest du starten?`][step]}</Dialog.Description>
     {step===0&&<div className="setup-name"><label htmlFor="setup-name">Dein Name</label><input id="setup-name" placeholder="z. B. Alex" autoComplete="nickname" autoFocus required maxLength={40} value={name} onChange={e=>setName(e.target.value)} aria-describedby="setup-name-help"/><p id="setup-name-help">Dieser Name erscheint auch im Team, wenn du mit Freunden zusammenarbeitest. Kein Konto nötig.</p></div>}
     {step===1&&<><div className="theme-choices setup-themes" role="group" aria-label="Farbschema">{[{id:'dark',name:'Dunkel'},{id:'light',name:'Hell'},{id:'sand',name:'Sand'}].map(t=><button type="button" aria-pressed={theme===t.id} className={`theme-choice ${t.id} ${theme===t.id?'selected':''}`} key={t.id} onClick={()=>onTheme(t.id)}><ThemePreview theme={t.id}/><span>{t.name}</span></button>)}</div><p className="setup-hint">Du kannst das später in den Einstellungen ändern.</p></>}
     {step===2&&<><div className="setup-destinations" role="group" aria-label="Dein Einstieg"><button type="button" aria-pressed={destination==='chat'} onClick={()=>setDestination('chat')}><MessageCircle size={22}/><span><strong>Für mich starten</strong><small>Chat, Notizen und deine Ideen.</small></span></button><button type="button" aria-pressed={destination==='team'} onClick={()=>setDestination('team')}><Users size={22}/><span><strong>Mit Freunden arbeiten</strong><small>Dein Team ansehen und den Zugang einrichten.</small></span></button></div><div className="setup-model-status"><span className={`status-dot ${ready?'online':''}`}/><span>{status}</span></div></>}
    </div>
    {error&&<p className="error-banner" role="alert">{error}</p>}
    <div className="setup-actions">{step>0?<button type="button" className="text-button" disabled={busy} onClick={()=>{setError('');setStep(step-1);}}><ArrowLeft size={15}/>Zurück</button>:<span className="setup-local"><ShieldCheck size={14}/>Dein eigener Arbeitsplatz</span>}<button className="primary" disabled={busy||(step===0&&!name.trim())}>{busy?'Wird eingerichtet …':step===2?'Aevori öffnen':'Weiter'}{step===2?<ArrowUpRight size={16}/>:<ChevronRight size={16}/>}</button></div>
   </form></SmoothHeight>
   <p className="setup-footer">Aevori — Intelligence, locally.</p>
  </Dialog.Content>
 </Dialog.Portal></Dialog.Root>;
}
