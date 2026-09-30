import {useState} from 'react';
import * as Popover from '@radix-ui/react-popover';
import {Check,ChevronDown,Plus,Sparkles} from '../MotionIcon';
import ModelLogo from './ModelLogo';
import AevoriSelect from './AevoriSelect';
import {modelLabel} from '../model-catalog';

type Model={id:string;parameters?:string;quantization?:string;vision?:boolean|null;tools?:boolean|null;completion?:boolean|null};
type Props={models:Model[];model:string;usePool:boolean;onSelect:(id:string)=>void;disabled:boolean;includeContext:boolean;onContext:(b:boolean)=>void;ready:number;openConnections:()=>void;length:string;onLength:(s:string)=>void;creativity:string;onCreativity:(s:string)=>void;reasoning:string;onReasoning:(s:string)=>void;thinking:(string|boolean)[];allowContext?:boolean;mode:string;onMode:(s:string)=>void};
const modeLabels:Record<string,string>={general:'Allgemein',code:'Code',design:'Design',writing:'Schreiben'};
export default function ModelSelect(p:Props){
 const [open,setOpen]=useState(false);
 const active=p.usePool?'__pool__':p.model;
 const names:Record<string,string>={__auto__:'Automatisch',__pool__:'Mac-Pool'};
 const choices=[{id:'__auto__',label:'Automatisch',description:'Passend zur Aufgabe und zu deinen Anhängen.',disabled:!p.models.length},...p.models.filter(m=>m.completion!==false).map(m=>({id:m.id,label:modelLabel(m.id),description:[m.vision===true?'Text + Bilder':m.vision===false?'Text':'Fähigkeiten nicht gemeldet',m.parameters].filter(Boolean).join(' · '),disabled:false})),{id:'__pool__',label:'Mac-Pool',description:`Auf verfügbare Macs verteilen · ${p.ready} bereit`,disabled:!p.ready}];
 return <Popover.Root open={open} onOpenChange={setOpen}>
  <Popover.Trigger data-slot="model-selector-trigger" className="aevori-model-trigger" disabled={p.disabled} aria-label="Modell und Arbeitsweise auswählen">
   {active==='__auto__'?<Sparkles size={17}/>:<ModelLogo model={active} size={18}/>}
   <span>{names[active]||modelLabel(active)||'Modell wählen'}</span><small>{modeLabels[p.mode]}</small><ChevronDown size={12}/>
  </Popover.Trigger>
  <Popover.Portal><Popover.Content data-slot="model-selector-content" className="aevori-model-popover" side="top" align="start" sideOffset={12} collisionPadding={12} aria-label="Modelle und Antwortoptionen">
   <div className="model-menu-heading"><strong>Dein Modell</strong><button onClick={()=>{setOpen(false);p.openConnections();}} aria-label="Modellverbindung einrichten"><Plus size={15}/></button></div>
   <div className="model-menu-list" role="group" aria-label="Verfügbare Modelle">{choices.map(m=><button key={m.id} disabled={m.disabled} aria-pressed={active===m.id} onClick={()=>p.onSelect(m.id)}>
    {m.id==='__auto__'?<Sparkles size={20}/>:<ModelLogo model={m.id} size={20}/>}<span><strong>{m.label}</strong><small>{m.description}</small></span>{active===m.id&&<Check size={16}/>}
   </button>)}</div>
   <div className="model-menu-settings">
    <label>Arbeitsweise<AevoriSelect label="Arbeitsweise" value={p.mode} onValueChange={p.onMode} disabled={p.disabled} options={Object.entries(modeLabels).map(([value,label])=>({value,label}))}/></label>
    <fieldset><legend>Antwortumfang</legend><div className="answer-length">{[['short','Kurz'],['normal','Normal'],['long','Ausführlich']].map(([id,label])=><button key={id} aria-pressed={p.length===id} onClick={()=>p.onLength(id)}>{label}</button>)}</div></fieldset>
    <details><summary>Weitere Einstellungen</summary>
     <label>Formulierung<AevoriSelect label="Formulierung" value={p.creativity} onValueChange={p.onCreativity} disabled={p.disabled} options={[{value:"precise",label:"Präzise"},{value:"balanced",label:"Ausgewogen"},{value:"creative",label:"Kreativ"}]}/></label>
     {!p.usePool&&p.model!=='__auto__'&&p.thinking.length>0&&<label>Denkaufwand<AevoriSelect label="Denkaufwand" value={p.reasoning} onValueChange={p.onReasoning} disabled={p.disabled} options={[{value:"auto",label:"Modellstandard"},...p.thinking.map(v=>({value:v===true?"on":v===false?"off":v,label:v===true?"Nachdenken":v===false?"Direkt antworten":v==="low"?"Niedrig":v==="medium"?"Mittel":"Hoch"}))]}/></label>}
     {p.allowContext&&<label className="context-toggle"><input type="checkbox" checked={p.includeContext} onChange={e=>p.onContext(e.target.checked)}/><span>Mac-Systemwerte mitsenden<small>Gerät, CPU, Speicher und Laufzeit</small></span></label>}
    </details>
   </div>
   <p className="model-menu-footnote">Gilt für die nächste Antwort. Dein konkreter Auftrag hat Vorrang.</p>
  </Popover.Content></Popover.Portal>
 </Popover.Root>;
}
