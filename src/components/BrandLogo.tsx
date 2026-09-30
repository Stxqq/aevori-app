/** Original geometric AEVORI lettering, drawn for this project. */
export const brandMark='M12 49 29 14Q32 8 35 14L52 49M22 36H42';
export const brandLettering='M6 42 20 10 34 42M12 30H28M72 10H48V42H72M48 26H67M88 10 102 42 116 10M145 9C125 9 125 43 145 43S165 9 145 9M181 42V10H196C213 10 213 28 196 28H181M196 28 210 42M230 10V42';
export default function BrandLogo({symbol=false,className=''}:{symbol?:boolean;className?:string}){
 return <span className={`aevori-brand ${symbol?'symbol':''} ${className}`}><svg viewBox={symbol?'0 0 64 64':'0 0 240 52'} role="img" aria-label="AEVORI" focusable="false"><path d={symbol?brandMark:brandLettering} fill="none" stroke="currentColor" strokeWidth={symbol?7:6} strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
}
