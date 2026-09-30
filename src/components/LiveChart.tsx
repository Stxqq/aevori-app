import {useId} from 'react';
import {motion,useReducedMotion} from 'framer-motion';
export default function LiveChart({values,compact=false}:{values:number[];compact?:boolean}){
 const id=useId().replaceAll(':',''),reduce=useReducedMotion()||document.documentElement.dataset.motion==='off';
 const width=400,height=100;
 const points=values.map((v,i)=>({x:width*(40-values.length+i)/39,y:height-Math.max(0,Math.min(100,v))*.92-4}));
 const line=points.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
 const area=points.length>1?`${line} L400,100 L${points[0].x},100Z`:'';
 return <div className={`live-chart ${compact?'compact':''}`}><svg viewBox="0 0 400 104" preserveAspectRatio="none" role="img" aria-label={`CPU-Verlauf, ${values.length} echte Messpunkte`}><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="currentColor" stopOpacity=".15"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>{[4,50,96].map(y=><path key={y} d={`M0 ${y}H400`} stroke="currentColor" opacity=".08" strokeDasharray="2 5"/>)}{area&&<motion.path animate={{d:area}} transition={{duration:reduce?0:.7,ease:'easeOut'}} fill={`url(#${id})`}/>} {line&&<motion.path animate={{d:line}} transition={{duration:reduce?0:.7,ease:'easeOut'}} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>}{points.length>0&&<motion.circle cx="400" animate={{cy:points.at(-1)!.y}} transition={{duration:reduce?0:.7}} r="2.5" fill="currentColor"/>}</svg>{!compact&&<div className="chart-axis"><span>Vor {Math.max(0,(values.length-1)*3)} s</span><span>Jetzt</span></div>}</div>;
}
