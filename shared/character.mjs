/** Shared, data-only character contract. No markup or external asset URLs. */
export const CHARACTER_SHAPES=Object.freeze([{id:'aeri',label:'Aeri'},{id:'round',label:'Rund'},{id:'cat',label:'Katze'},{id:'bot',label:'Bot'}]);
export const CHARACTER_EYES=Object.freeze([{id:'friendly',label:'Freundlich'},{id:'happy',label:'Fröhlich'},{id:'calm',label:'Gelassen'}]);
export const CHARACTER_ACCESSORIES=Object.freeze([{id:'none',label:'Ohne'},{id:'glasses',label:'Brille'},{id:'headphones',label:'Kopfhörer'},{id:'sprout',label:'Blatt'}]);
export const CHARACTER_COLORS=Object.freeze([{color:'#d0d6dc',label:'Perlmutt'},{color:'#c4aff0',label:'Flieder'},{color:'#edb0c6',label:'Rosé'},{color:'#a9d3bd',label:'Salbei'},{color:'#a7c9e9',label:'Himmel'},{color:'#e7c58e',label:'Honig'}]);
export const DEFAULT_APPEARANCE=Object.freeze({shape:'aeri',color:'#d0d6dc',eyes:'friendly',accessory:'none'});
export function appearanceForTone(tone){return {...DEFAULT_APPEARANCE,color:tone==='rose'?'#df84b2':tone==='lilac'?'#a99cda':DEFAULT_APPEARANCE.color};}
export function validateAppearance(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>!Object.hasOwn(DEFAULT_APPEARANCE,key)))throw new Error('Ungültiger Charakter.');
 for(const [key,choices] of [['shape',CHARACTER_SHAPES],['eyes',CHARACTER_EYES],['accessory',CHARACTER_ACCESSORIES]])if(!choices.some(choice=>choice.id===input[key]))throw new Error('Wähle eine gültige Form, ein Gesicht und ein Accessoire.');
 if(typeof input.color!=='string'||!/^#[0-9a-f]{6}$/i.test(input.color))throw new Error('Die Farbe muss ein sechsstelliger Hex-Wert sein.');
 return {shape:input.shape,color:input.color.toLowerCase(),eyes:input.eyes,accessory:input.accessory};
}
