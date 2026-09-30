import Companion from './Companion';

/** A miniature of the actual workspace, independently themed from its parent. */
export default function ThemePreview({theme}:{theme:string}){
 return <span className={`appearance-preview preview-${theme}`} aria-hidden="true">
  <span className="preview-window"><span className="preview-sidebar"><span className="preview-traffic"><i/><i/><i/></span><b/><i/><i/><i/><span/></span><span className="preview-content"><span className="preview-toolbar"><i/><i/></span><Companion size={31} tone={theme==='sand'?'rose':'pearl'}/><span className="preview-greeting"/><span className="preview-caption"/><span className="preview-bubbles"><i/><i/></span><span className="preview-input"><i/><b/></span></span></span>
 </span>;
}
