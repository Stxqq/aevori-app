import {useEffect,useState,type ReactNode} from 'react';
import BrandLogo from './BrandLogo';
import type {Session} from './TeamPanel';
export default function SessionGate({children}:{children:(session:Session)=>ReactNode}){
 const [session,setSession]=useState<Session|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[token]=useState(()=>new URLSearchParams(location.hash.slice(1)).get('invite')||'');
 const load=async()=>{try{const r=await fetch('/api/session');if(!r.ok)throw new Error('Dieser Zugang ist noch nicht freigegeben. Öffne Aevori am Haupt-Mac.');setSession(await r.json());}catch(e){setError(e instanceof Error?e.message:'Aevori ist nicht erreichbar.');}};
 useEffect(()=>{if(token)history.replaceState(null,'',location.pathname+location.search);void load();},[]);
 if(session?.authenticated)return children(session);
 if(!session&&!error)return <main className="access-page"><BrandLogo/><p role="status">Dein Arbeitsplatz wird geöffnet …</p></main>;
 return <main className="access-page"><BrandLogo/><div className="access-card"><span className="eyebrow">Aevori · Privater Arbeitsplatz</span><h1>{token?'Du bist eingeladen.':'Dein Team wartet auf dich.'}</h1><p>{token?'Nimm deine persönliche Einladung an und nutze die freigegebenen KI-Modelle.':'Der Zugang ist nur mit einer persönlichen Einladung des Gastgebers möglich.'}</p>{error&&<p className="small-error" role="alert">{error}</p>}{token&&<button className="primary" disabled={busy} onClick={()=>{setBusy(true);setError('');void fetch('/api/team/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);await load();}).catch(e=>setError(e.message)).finally(()=>setBusy(false));}}>{busy?'Zugang öffnen …':'Einladung annehmen'}</button>}</div></main>;
}
