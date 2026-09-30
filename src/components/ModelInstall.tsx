import {useState,useRef,useEffect} from 'react';
import {Plus,X,Check,ArrowUpRight} from '../MotionIcon';
import ModelLogo from './ModelLogo';
import {MODEL_CATALOG} from '../model-catalog';
type Props={available:boolean;chatBusy:boolean;installed:{id:string}[];freeBytes?:number;onComplete:()=>void;onSelect:(id:string)=>void};
export default function ModelInstall({available,chatBusy,installed,freeBytes,onComplete,onSelect}:Props){
 const [name,setName]=useState(''),[downloading,setDownloading]=useState(''),[status,setStatus]=useState(''),[progress,setProgress]=useState<number|null>(null),[error,setError]=useState('');
 const controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 const install=async(model:string)=>{
  if(controller.current||!available)return;
  const abort=new AbortController();controller.current=abort;
  setDownloading(model);setError('');setProgress(null);setStatus('Download wird vorbereitet …');
  try{
   const r=await fetch('/api/models/install',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model}),signal:abort.signal});
   if(!r.ok){const d=await r.json();throw new Error(d.error);}
   const reader=r.body!.getReader(),decoder=new TextDecoder();let buffer='',success=false;
   const read=(line:string)=>{
    if(!line.trim())return;const d=JSON.parse(line);if(d.error)throw new Error(d.error);
    if(d.status)setStatus(d.status==='success'?'Modell ist bereit.':d.status.startsWith('pulling')?'Modell wird geladen …':'Download wird geprüft …');
    if(d.total)setProgress(Math.min(100,100*(d.completed||0)/d.total));
    if(d.status==='success')success=true;
   };
   while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});let i;while((i=buffer.indexOf('\n'))>=0){read(buffer.slice(0,i));buffer=buffer.slice(i+1);}}
   buffer+=decoder.decode();if(buffer.trim())read(buffer);
   if(!success)throw new Error('Download wurde nicht vollständig abgeschlossen.');
   setStatus('Modell installiert und bereit.');setProgress(100);onComplete();
  }catch(e){setError(abort.signal.aborted?'Download angehalten.':e instanceof Error?e.message:'Download fehlgeschlagen.');setStatus('');}
  finally{setDownloading('');controller.current=null;}
 };
 return <section className="model-library" aria-labelledby="model-library-title">
  <div className="section-heading models-heading"><div><h2 id="model-library-title">Für das, was du vorhast.</h2><p>Coding, Frontend und neue Ideen. Wähle dein Werkzeug.</p></div>{freeBytes!==undefined&&<span>{Math.floor(freeBytes/1e9)} GB frei</span>}</div>
  <div className="model-catalog">{MODEL_CATALOG.map(item=>{
   const ready=installed.some(m=>m.id===item.id),loading=downloading===item.id;
   const enoughSpace=freeBytes===undefined||freeBytes>(item.downloadGB+4)*1e9;
   return <article key={item.id} className="catalog-card">
    <div className="catalog-top"><span className="catalog-logo"><ModelLogo model={item.id} size={25}/></span><span>{item.category}</span>{ready&&<span className="catalog-ready"><Check size={12}/>Bereit</span>}</div>
    <h3>{item.name}</h3><p>{item.description}</p>
    <div className="catalog-spec"><span>~{item.downloadGB.toLocaleString('de-DE')} GB Download</span><span>{item.ramGB} GB RAM empfohlen</span></div>
    <div className="catalog-actions">{ready?<button className="secondary" disabled={chatBusy} onClick={()=>onSelect(item.id)}>Im Chat nutzen<ArrowUpRight size={14}/></button>:<button className="secondary" disabled={!available||!!downloading||!enoughSpace} onClick={()=>void install(item.id)}>{loading?'Wird geladen …':enoughSpace?'Installieren':'Mehr Speicher nötig'}{!loading&&enoughSpace&&<Plus size={14}/>}</button>}<a href={item.source} target="_blank" rel="noreferrer" aria-label={`Informationen zu ${item.name}`}>Details<ArrowUpRight size={12}/></a></div>
   </article>;
  })}</div>
  <div className="model-install"><h3>Ein anderes Modell hinzufügen</h3><p>Ollama-Modellnamen eingeben. Der Download bleibt auf diesem Mac.</p>
   <form onSubmit={e=>{e.preventDefault();void install(name.trim());}}><label className="sr-only" htmlFor="install-model">Ollama-Modellname</label><input id="install-model" disabled={!!downloading||!available} placeholder="z. B. qwen3.5:4b" value={name} onChange={e=>setName(e.target.value)} required pattern="[A-Za-z0-9][A-Za-z0-9._:\/\-]*" maxLength={120}/><button className="secondary" disabled={!available||!!downloading||!name.trim()}><Plus size={15}/>Hinzufügen</button></form>
   {!available&&<p>Verbinde zum Installieren das lokale Ollama am Haupt-Mac.</p>}
   {status&&<div className="model-download-status"><p role="status">{downloading&&<strong>{downloading} · </strong>}{status}{progress!==null?` ${Math.round(progress)} %`:''}</p>{downloading&&<button className="text-button" onClick={()=>controller.current?.abort()}><X size={14}/>Stoppen</button>}</div>}
   {downloading&&progress!==null&&<progress value={progress} max="100" aria-label="Modelldownload"/>}
   {error&&<p className="small-error" role="alert">{error}</p>}
  </div>
 </section>;
}
