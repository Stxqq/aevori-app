import {useId} from 'react';

/** User-supplied AEVORI lettering. Asset rights are documented in ASSETS.md. */
export default function BrandLogo({symbol=false,className=''}:{symbol?:boolean;className?:string}){
 const filterId=`aevori-wordmark-${useId().replace(/:/g,'')}`;
 return <span className={`aevori-brand ${symbol?'symbol':''} ${className}`}>
  {symbol?<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path fill="currentColor" fillRule="evenodd" d="M9 43C14 33 22 20 28 15C32 11 37 12 40 17C43 23 46 34 54 44C58 51 49 55 43 49L36 42C33 39 30 40 27 43L20 50C12 56 5 50 9 43ZM29 29C25 35 33 37 37 31C41 25 33 22 29 29Z"/></svg>:<svg viewBox="85 205 1880 385" role="img" aria-label="AEVORI" focusable="false">
   <defs><filter id={filterId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
    {/* Subtract blue as well: the supplied background includes green grain. */}
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.12 1.12 -1.12 0 -0.08"/>
   </filter><mask id={`${filterId}-mask`} maskUnits="userSpaceOnUse" x="85" y="205" width="1880" height="385" style={{maskType:'alpha'}}><image href="/brand/aevori-original.png" width="2042" height="770" filter={`url(#${filterId})`}/></mask></defs>
   <rect x="85" y="205" width="1880" height="385" fill="currentColor" mask={`url(#${filterId}-mask)`}/>
  </svg>}
 </span>;
}
