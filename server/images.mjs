export function validateImages(images){
 if(images===undefined)return undefined;
 if(!Array.isArray(images)||images.length>3)throw new Error('Bis zu drei Bilder pro Nachricht sind möglich.');
 return images.map(value=>{
  if(typeof value!=='string'||value.length>2.8*1024**2)throw new Error('Ein Bild ist zu groß.');
  const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if(!match)throw new Error('Ungültiges Bild. Verwende PNG, JPG oder WebP.');
  const bytes=Buffer.from(match[2],'base64');
  if(bytes.length>2*1024**2||bytes.toString('base64')!==match[2])throw new Error('Ungültige Bilddaten.');
  const valid=match[1]==='png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):match[1]==='jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
  if(!valid)throw new Error('Das Bildformat stimmt nicht mit der Datei überein.');
  return value;
 });
}
export const hasImages=messages=>messages.some(m=>m.images?.length);
export function messagesForProvider(messages,type){
 return messages.map(({role,content,images})=>!images?.length?{role,content}:type==='ollama'?{role,content,images:images.map(image=>image.slice(image.indexOf(',')+1))}:{role,content:[{type:'text',text:content},...images.map(url=>({type:'image_url',image_url:{url}}))]});
}
