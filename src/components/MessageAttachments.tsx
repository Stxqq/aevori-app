import {useEffect,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {FileText,X} from '../MotionIcon';
import {readImage,fileSize,type ChatImage,type ChatFile} from '../attachments';
function SavedImage({image}:{image:ChatImage}){
 const [url,setUrl]=useState('');
 useEffect(()=>{let active=true,local='';void readImage(image.id).then(blob=>{if(active){local=URL.createObjectURL(blob);setUrl(local);}}).catch(()=>{});return()=>{active=false;if(local)URL.revokeObjectURL(local);};},[image.id]);
 return url?<Dialog.Root><Dialog.Trigger className="message-image" aria-label={`${image.name} ansehen`}><img src={url} alt={image.name}/></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="attachment-preview-overlay"/><Dialog.Content className="attachment-preview"><Dialog.Title>{image.name}</Dialog.Title><Dialog.Description className="sr-only">Bildanhang aus diesem Chat</Dialog.Description><Dialog.Close className="attachment-preview-close" aria-label="Vorschau schließen"><X size={18}/></Dialog.Close><img src={url} alt={image.name}/></Dialog.Content></Dialog.Portal></Dialog.Root>:<span className="message-file">{image.name}</span>;
}
export default function MessageAttachments({images=[],files=[]}:{images?:ChatImage[];files?:ChatFile[]}){
 if(!images.length&&!files.length)return null;
 return <div className="message-attachments">{images.map(image=><SavedImage key={image.id} image={image}/>)}{files.map((f,i)=><span className="message-file" key={i} title={f.name}><FileText size={15}/><span>{f.name}<small>{fileSize(f.size)}</small></span></span>)}</div>;
}
