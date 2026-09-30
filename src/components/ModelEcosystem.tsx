import AevoriMark from '../AevoriMark';
import ModelLogo from './ModelLogo';

const providers=[
 {id:'qwen',label:'Qwen'},
 {id:'llama',label:'Meta Llama'},
 {id:'ollama',label:'Ollama'},
];

export default function ModelEcosystem(){
 return <div className="model-ecosystem">
  <div className="model-ecosystem-ring" aria-hidden="true"/>
  {providers.map(provider=><figure key={provider.id} className={`model-ecosystem-node node-${provider.id}`}>
   <div className="model-ecosystem-tile"><ModelLogo model={provider.id} size={28}/></div>
   <figcaption>{provider.label}</figcaption>
  </figure>)}
  <div className="model-ecosystem-center"><AevoriMark/><strong>Deine Modelle.<br/>In deinem Workspace.</strong></div>
 </div>;
}
