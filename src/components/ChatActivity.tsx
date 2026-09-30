import OriginalLoadingState from './ActivityIndicator';
/** One small, persistent pixel marker. No surrounding light or second loader. */
export function ChatActivityAvatar({active}:{active:boolean}){
 return <span className={`chat-activity-avatar ${active?'active':''}`} aria-hidden="true">{active?<OriginalLoadingState label="" variant="Drive"/>:<span className="idle-pixel-grid">{Array.from({length:9},(_,i)=><i key={i}/>)}</span>}</span>;
}
