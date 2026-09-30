import {Network,Sparkles,Cpu,Cloud} from 'lucide-react';
export default function ModelLogo({model,size=21}:{model:string;size?:number}){
 const id=model.toLowerCase();
 // Neutral capability icons. A package's code license does not grant brand rights.
 const Icon=id==='__pool__'?Network:id.startsWith('muse')||id==='meta'||/^(openai|gpt-|claude|gemini|chatgpt)/.test(id)?Cloud:id==='__auto__'?Sparkles:Cpu;
 return <Icon size={size} strokeWidth={1.65} aria-hidden="true"/>;
}
