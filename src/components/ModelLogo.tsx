import {Network,Sparkles} from '../MotionIcon';
export default function ModelLogo({model,size=21}:{model:string;size?:number}){
 const id=model.toLowerCase();
 if(id.startsWith('muse-spark')||id==='muse')return <img src="/ai-logos/meta-color.svg" width={size} height={size} alt="" aria-hidden="true"/>;
 const asset=id==='ollama'?'ollama':id.includes('qwen')?'qwen-color':id.includes('claude')?'claude-color':id.includes('gemini')?'gemini-color':id.includes('gemma')?'gemma-color':id.includes('deepseek')?'deepseek-color':id.includes('llama')||id==='meta'?'meta-color':id.includes('mistral')||id.includes('mixtral')||id.includes('devstral')?'mistral-color':/^(openai|gpt-|o[134](?:-|$)|chatgpt)/.test(id)?'openai':null;
 return asset?<img className={`ai-brand-icon ${asset==='ollama'||asset==='openai'?'monochrome':''}`} src={`/ai-logos/${asset}.svg`} width={size} height={size} alt="" aria-hidden="true"/>:id==='__pool__'?<Network size={size}/>:<Sparkles size={size}/>;
}
