import {useState,type CSSProperties,type FormEvent} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {Check,Glasses,Headphones,Leaf,Shuffle,X} from 'lucide-react';
import {CHARACTER_SHAPES,CHARACTER_EYES,CHARACTER_ACCESSORIES,CHARACTER_COLORS,type CharacterAppearance} from '../../shared/character.mjs';
import Companion from './Companion';
import './character-editor.css';

type Props={name:string;appearance:CharacterAppearance;configured:boolean;onClose:()=>void;onReturnFocus:()=>void;onSave:(draft:{name:string;appearance:CharacterAppearance})=>Promise<unknown>};
export default function CharacterEditor({name:initialName,appearance:initialAppearance,configured,onClose,onReturnFocus,onSave}:Props){
 const [opener]=useState(()=>document.activeElement instanceof HTMLElement?document.activeElement:null);
 const [name,setName]=useState(initialName),[appearance,setAppearance]=useState({...initialAppearance}),[hex,setHex]=useState(initialAppearance.color),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const patch=(value:Partial<CharacterAppearance>)=>setAppearance(current=>({...current,...value}));
 const colorValid=/^#[0-9a-f]{6}$/i.test(hex);
 const setColor=(color:string)=>{setHex(color);if(/^#[0-9a-f]{6}$/i.test(color))patch({color:color.toLowerCase()});};
 const randomize=()=>{const pick=<T,>(values:ReadonlyArray<T>)=>values[Math.floor(Math.random()*values.length)];const color=pick(CHARACTER_COLORS).color;setAppearance({shape:pick(CHARACTER_SHAPES).id,eyes:pick(CHARACTER_EYES).id,accessory:pick(CHARACTER_ACCESSORIES).id,color});setHex(color);};
 const save=async(event:FormEvent)=>{event.preventDefault();if(!name.trim()||!colorValid||busy)return;setError('');setBusy(true);try{await onSave({name:name.trim(),appearance});onClose();}catch(e){setError(e instanceof Error?e.message:'Dein Charakter konnte nicht gespeichert werden.');setBusy(false);}};
 const accessoryIcons={none:X,glasses:Glasses,headphones:Headphones,sprout:Leaf};
 return <Dialog.Root open onOpenChange={open=>{if(!open&&!busy)onClose();}}><Dialog.Portal>
  <Dialog.Overlay className="modal-overlay character-overlay"/>
  <Dialog.Content className="character-dialog" onInteractOutside={event=>event.preventDefault()} onEscapeKeyDown={event=>{if(busy)event.preventDefault();}} onCloseAutoFocus={event=>{event.preventDefault();if(opener?.isConnected)opener.focus({preventScroll:true});else onReturnFocus();}}>
   <div className="character-editor-heading"><div><Dialog.Title>{configured?'Dein Charakter. Dein Stil.':'Mach ihn zu deinem.'}</Dialog.Title><Dialog.Description>Gib deinem Agenten ein eigenes Gesicht.</Dialog.Description></div><Dialog.Close className="shell-icon-button" aria-label="Charakter-Editor schließen" disabled={busy}><X size={19}/></Dialog.Close></div>
   <form className="character-form" onSubmit={save}>
    <div className="character-editor-body" style={{'--character-color':appearance.color} as CSSProperties}>
     <section className="character-stage" aria-label="Charakter-Vorschau">
      <span className="character-preview-label">Vorschau</span><div className="character-stage-figure"><Companion appearance={appearance} size={210}/></div>
      <h3>{name.trim()||'Dein Charakter'}</h3><p>Dein persönlicher Agent.</p>
      <div className="character-chat-preview"><Companion appearance={appearance} size={30}/><span>Bereit für deine nächste Idee.</span></div>
      <button type="button" className="character-random" onClick={randomize} disabled={busy}><Shuffle size={14}/>Überrasch mich</button>
     </section>
     <fieldset className="character-controls" disabled={busy}><legend className="sr-only">Charakter gestalten</legend>
      <label className="character-name" htmlFor="character-name">Name<input id="character-name" value={name} onChange={e=>setName(e.target.value)} autoComplete="off" maxLength={32} required placeholder="Wie heißt dein Charakter?"/></label>
      <fieldset className="character-options"><legend>Form</legend><div className="character-shapes">{CHARACTER_SHAPES.map(shape=><button type="button" key={shape.id} aria-pressed={appearance.shape===shape.id} onClick={()=>patch({shape:shape.id})}><Companion appearance={{...appearance,shape:shape.id,accessory:'none'}} size={43}/><span>{shape.label}</span></button>)}</div></fieldset>
      <fieldset className="character-options"><legend>Farbe</legend><div className="character-color-row"><div className="character-swatches">{CHARACTER_COLORS.map(color=><button type="button" key={color.color} className="character-swatch" style={{'--swatch':color.color} as CSSProperties} aria-label={color.label} aria-pressed={appearance.color===color.color} onClick={()=>setColor(color.color)}>{appearance.color===color.color&&<Check size={13}/>}</button>)}</div><label className="character-custom-color" title="Eigene Farbe"><input type="color" aria-label="Eigene Farbe auswählen" value={appearance.color} onChange={e=>setColor(e.target.value)}/><span className="sr-only">Eigene Farbe</span></label></div><label className="character-hex"><span>Eigene Farbe</span><input aria-label="Farbwert" value={hex} maxLength={7} spellCheck={false} onChange={e=>setColor(e.target.value)} aria-invalid={!colorValid} aria-describedby={!colorValid?'character-color-error':undefined}/></label>{!colorValid&&<p id="character-color-error" className="small-error">Zum Beispiel #a7c9e9 – sechs Zeichen nach dem #.</p>}</fieldset>
      <fieldset className="character-options"><legend>Gesicht</legend><div className="character-segments">{CHARACTER_EYES.map(eyes=><button type="button" key={eyes.id} aria-pressed={appearance.eyes===eyes.id} onClick={()=>patch({eyes:eyes.id})}>{eyes.label}</button>)}</div></fieldset>
      <fieldset className="character-options"><legend>Accessoire</legend><div className="character-accessories">{CHARACTER_ACCESSORIES.map(accessory=>{const Icon=accessoryIcons[accessory.id];return <button type="button" key={accessory.id} aria-pressed={appearance.accessory===accessory.id} onClick={()=>patch({accessory:accessory.id})}><Icon size={17}/><span>{accessory.label}</span></button>;})}</div></fieldset>
     </fieldset>
    </div>
    <footer className="character-editor-footer">{error&&<p className="error-banner" role="alert">{error}</p>}<p>Nur dein Agent. Jederzeit veränderbar.</p><div><button type="button" className="secondary" disabled={busy} onClick={onClose}>Abbrechen</button><button className="primary" disabled={busy||!name.trim()||!colorValid}>{busy?'Wird gespeichert …':'Charakter speichern'}{!busy&&<Check size={15}/>}</button></div></footer>
   </form>
  </Dialog.Content>
 </Dialog.Portal></Dialog.Root>;
}
