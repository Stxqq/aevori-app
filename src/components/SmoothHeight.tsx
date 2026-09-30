import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {motion,useReducedMotion} from 'framer-motion';

/** Measure real content; only the container animates, so text never scales. */
export default function SmoothHeight({children}:{children:ReactNode}){
 const inner=useRef<HTMLDivElement>(null),[height,setHeight]=useState<number>(),[motionOff,setMotionOff]=useState(document.documentElement.dataset.motion==='off');
 const reduced=useReducedMotion();
 useLayoutEffect(()=>{
  // Layout height excludes the dialog's entrance scale. Measuring its transformed
  // rectangle during opening permanently clips the bottom of long dialogs.
  const measure=()=>{if(inner.current)setHeight(inner.current.offsetHeight);};
  const preference=()=>setMotionOff(document.documentElement.dataset.motion==='off');
  measure();const observer=new ResizeObserver(measure);if(inner.current)observer.observe(inner.current);
  window.addEventListener('aevori-motion-change',preference);
  return()=>{observer.disconnect();window.removeEventListener('aevori-motion-change',preference);};
 },[]);
 return <motion.div className="smooth-height" initial={false} animate={{height:height??'auto'}} transition={{duration:reduced||motionOff?0:.38,ease:[.22,1,.36,1]}}><div ref={inner} className="smooth-height-content">{children}</div></motion.div>;
}
