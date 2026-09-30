import {useEffect,useState,type ReactNode} from 'react';
import {PromptInput} from './PromptComposer';
import {ShimmeringText} from './ui/shimmering-text';
import {ShieldCheck} from '../MotionIcon';
import {IMAGE_TYPES,storeImage,discardImages,type PreparedAttachments,type ChatImage} from '../attachments';
/** AEVORI input, connected to the streaming chat. */
export default function ChatInput({value,onChange,onSend,busy,status,startedAt,onStop,modelSelect,caption}:{value:string;onChange:(s:string)=>void;onSend:(text:string,attachments?:PreparedAttachments)=>Promise<boolean>;busy:boolean;status:string;startedAt:number|null;onStop:()=>void;modelSelect:ReactNode;caption:string}){
 const [error,setError]=useState('');
 const [elapsed,setElapsed]=useState(0);
 useEffect(()=>{
  if(!busy||startedAt===null){setElapsed(0);return;}
  const update=()=>setElapsed(Math.max(0,Math.floor((Date.now()-startedAt)/1000)));
  update();const timer=setInterval(update,1000);return()=>clearInterval(timer);
 },[busy,startedAt]);
 const duration=elapsed<60?`${elapsed} s`:`${Math.floor(elapsed/60)} min ${elapsed%60} s`;
 return <div className={`original-composer-wrap ${busy?'working':''}`}>
 <div className="composer-activity">
  <span className="composer-activity-label" role="status" aria-live="polite" aria-atomic="true">{busy&&<ShimmeringText text={status||'Anfrage vorbereiten …'} duration={2.4} repeatDelay={.6}/>}</span>
  {busy&&<span className="composer-activity-time" aria-hidden="true" title="Laufzeit dieser Anfrage">{duration}</span>}
 </div>
 <PromptInput value={value} onChange={onChange} busy={busy} onStop={onStop} modelSelector={modelSelect} maxAttachments={3} placeholder="Frag Aevori …" onError={setError} onSubmit={async(text,{attachments})=>{
  setError('');
  const images:ChatImage[]=[];
  try {
   const textFiles=attachments.filter(f=>!IMAGE_TYPES.includes(f.type));
   const contents=await Promise.all(textFiles.map(async f=>({name:f.name,text:await f.text()})));
   if(contents.some(f=>f.text.includes('\0')))throw new Error('Bitte eine lesbare Textdatei auswählen.');
   if(text.length+contents.reduce((sum,f)=>sum+f.text.length,0)>20000)throw new Error('Nachricht und Anhänge dürfen zusammen höchstens 20.000 Zeichen haben.');
   for(const file of attachments.filter(f=>IMAGE_TYPES.includes(f.type)))images.push(await storeImage(file));
   const accepted=await onSend(text|| (images.length?'Beschreibe die angehängten Bilder.':'Lies die angehängten Dateien.'),{images,files:textFiles.map((f,i)=>({name:f.name,size:f.size,text:contents[i].text}))});
   if(!accepted)await discardImages(images);return accepted;
  }catch(e){void discardImages(images);setError(e instanceof Error?e.message:'Anhang konnte nicht gelesen werden.');return false;}
 }}/>
 {error&&<p className="small-error" role="alert">{error}</p>}<p className="composer-caption"><ShieldCheck size={12}/>{caption}</p>
 </div>;
}
