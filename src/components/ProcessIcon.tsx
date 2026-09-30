import {useState} from 'react';
import {Cpu} from '../MotionIcon';
export default function ProcessIcon({icon}:{icon?:string}){
 const [failed,setFailed]=useState(false);
 return <span className="process-app-icon">{icon&&!failed?<img src={icon} alt="" onError={()=>setFailed(true)}/>:<Cpu size={17}/>}</span>;
}
