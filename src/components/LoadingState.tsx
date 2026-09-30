import OriginalLoadingState from "./ActivityIndicator";
export function LoadingState({label,compact=false}:{label:string;compact?:boolean}){return <div className={"aevori-loading "+(compact?"compact":"")} role="status"><OriginalLoadingState label={label} variant="Drive"/></div>;}
