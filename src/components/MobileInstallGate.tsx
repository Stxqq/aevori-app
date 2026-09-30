import {useEffect,useState,type ReactNode} from 'react';
import {ArrowUpRight,Download,Plus,Share,Smartphone} from 'lucide-react';
import BrandLogo from './BrandLogo';
import Companion from './Companion';
import './mobile-install.css';
type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
const standalone=()=>matchMedia('(display-mode: standalone)').matches||(navigator as Navigator&{standalone?:boolean}).standalone===true;
export default function MobileInstallGate({children}:{children:ReactNode}){
 const [installed,setInstalled]=useState(standalone),[prompt,setPrompt]=useState<InstallPrompt|null>(null),[error,setError]=useState('');
 const mobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&matchMedia('(max-width:1024px)').matches);
 const requested=new URLSearchParams(location.search).get('install')==='1';
 const [preview,setPreview]=useState(requested);
 useEffect(()=>{
  const ready=(e:Event)=>{e.preventDefault();setPrompt(e as InstallPrompt);};
  const opened=()=>setInstalled(standalone());const done=()=>{setInstalled(true);setPrompt(null);};
  const media=matchMedia('(display-mode: standalone)');
  window.addEventListener('beforeinstallprompt',ready);window.addEventListener('appinstalled',done);media.addEventListener('change',opened);
  return()=>{window.removeEventListener('beforeinstallprompt',ready);window.removeEventListener('appinstalled',done);media.removeEventListener('change',opened);};
 },[]);
 if(installed||(!mobile&&!preview))return children;
 const ios=!/Android/i.test(navigator.userAgent);
 return <main className="mobile-install"><header><BrandLogo/><span>Dein Agent. Immer griffbereit.</span></header><div className="install-intro"><span className="install-app-icon"><Companion size={116}/></span><span className="install-eyebrow">AEVORI FÜR DEIN HANDY</span><h1>Ein Platz auf<br/>deinem Home-Bildschirm.</h1><p>Öffne deinen persönlichen Agenten wie eine App. Die KI arbeitet auf deinem Mac.</p></div><section className="install-sheet"><h2><Smartphone size={19}/>Aevori hinzufügen</h2>{prompt?<button className="primary wide" onClick={async()=>{setError('');try{await prompt.prompt();await prompt.userChoice;setPrompt(null);}catch{setError('Öffne das Browser-Menü und wähle „App installieren“.');}}}><Download size={17}/>App installieren</button>:<ol><li><span>1</span><div>{ios?<>Öffne diese Seite in <strong>Safari</strong>.</>:<>Öffne diese Seite in <strong>Chrome</strong>.</>}</div></li><li><span>2</span><div>{ios?<>Tippe auf <strong>Teilen</strong> <Share size={15}/>.</>:<>Öffne das <strong>⋮ Menü</strong>.</>}</div></li><li><span>3</span><div>Wähle <strong>{ios?'Zum Home-Bildschirm':'App installieren'}</strong> <Plus size={15}/> und öffne Aevori über das neue Symbol.</div></li></ol>}{error&&<p className="small-error" role="alert">{error}</p>}<p className="install-connection">Mac und AEVORI müssen laufen. Verwende die sichere HTTPS-Adresse deines Arbeitsplatzes und deine persönliche Einladung.</p></section><footer>Aevori — Intelligence, locally.{!mobile&&<button className="text-button" onClick={()=>{setPreview(false);history.replaceState(null,'',location.pathname);}}>Zur Desktop-App<ArrowUpRight size={14}/></button>}</footer></main>;
}
