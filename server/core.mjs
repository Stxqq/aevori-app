import os from 'node:os';
import {isMuseProvider,museModels,museError} from './muse.mjs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {processIcon} from './app-icons.mjs';
import {validateImages} from './images.mjs';
const exec = promisify(execFile);
export function validateProvider(input) {
  if (!input || !['ollama','compatible'].includes(input.type)) throw new Error('Wähle Ollama oder eine kompatible API.');
  const url = new URL(input.baseUrl);
  const local = ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || (!local && url.protocol !== 'https:') || !['https:','http:'].includes(url.protocol)) throw new Error('Verwende HTTPS oder eine lokale Adresse ohne Zugangsdaten in der URL.');
  if (/^169\.254\.|^0\./.test(url.hostname)) throw new Error('Diese Adresse ist nicht erlaubt.');
  if (typeof input.apiKey !== 'string' || input.apiKey.length > 4096 || /[\r\n]/.test(input.apiKey)) throw new Error('Ungültiger API-Schlüssel.');
  const provider={type:input.type,baseUrl:url.toString().replace(/\/$/,''),apiKey:input.apiKey.trim(),local};
  if(isMuseProvider(provider)&&!provider.apiKey)throw new Error('Gib deinen Meta-API-Schlüssel ein.');
  return provider;
}
export function validateMessages(messages) {
  if (!Array.isArray(messages) || !messages.length || messages.length > 80 || messages.some(m=>!m || !['user','assistant'].includes(m.role) || typeof m.content !== 'string' || m.content.length > 24000)) throw new Error('Der Chat ist zu lang oder enthält ungültige Nachrichten. Bitte einen neuen Chat starten.');
  let imageCount=0,imageBytes=0;
  return messages.map(({role,content,images})=>{
    if(images!==undefined&&role!=='user')throw new Error('Bilder können nur an eigene Nachrichten angehängt werden.');
    const validated=validateImages(images);imageCount+=validated?.length||0;imageBytes+=validated?.reduce((sum,image)=>sum+image.length,0)||0;
    if(imageCount>12||imageBytes>10*1024**2)throw new Error('Dieser Chat enthält zu viele Bilddaten. Bitte einen neuen Chat starten.');
    return {role,content,...(validated?.length?{images:validated}:{})};
  });
}
export function allowedRequest(req, port) {
  const hosts = new Set([`127.0.0.1:${port}`,`localhost:${port}`,`[::1]:${port}`]);
  if (!hosts.has(req.headers.host)) return false;
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin=req.headers.origin;
  if (!origin) return true;
  try { return hosts.has(new URL(origin).host) && new URL(origin).protocol === 'http:'; } catch { return false; }
}
let previous=os.cpus();
let hardware={name:'Dieser Mac',chip:os.cpus()[0]?.model||os.arch(),cores:os.cpus().length,os:os.release()};
if(os.platform()==='darwin'){
  exec('/usr/sbin/system_profiler',['SPHardwareDataType','-json'],{timeout:6000,maxBuffer:1024*1024}).then(({stdout})=>{const h=JSON.parse(stdout).SPHardwareDataType[0];hardware={...hardware,name:h.machine_name||'Dieser Mac',chip:h.chip_type||hardware.chip};}).catch(()=>{});
  exec('/usr/bin/sw_vers',['-productVersion']).then(({stdout})=>hardware.os=stdout.trim()).catch(()=>{});
}
export async function systemSnapshot(){
  const cpus=os.cpus();let total=0,idle=0;
  cpus.forEach((cpu,i)=>{const prev=previous[i]||cpu;for(const key in cpu.times)total+=cpu.times[key]-prev.times[key];idle+=cpu.times.idle-prev.times.idle;});previous=cpus;
  let disk=null,processes=[];
  const checks=await Promise.allSettled([
    exec('/bin/df',['-k',os.homedir()],{timeout:3000,maxBuffer:16384}),
    exec('/bin/ps',['-Ao','pid,pcpu,rss,comm'],{timeout:3000,maxBuffer:2*1024*1024})
  ]);
  if(checks[0].status==='fulfilled'){
    const fields=checks[0].value.stdout.trim().split('\n').at(-1).trim().split(/\s+/);
    const capacity=Number(fields[1])*1024,available=Number(fields[3])*1024;
    if(Number.isFinite(capacity)&&capacity>0&&Number.isFinite(available))disk={total:capacity,free:available,used:capacity-available};
  }
  if(checks[1].status==='fulfilled')processes=checks[1].value.stdout.trim().split('\n').slice(1).map(line=>{
    const m=line.trim().match(/^(\d+)\s+([\d.]+)\s+(\d+)\s+(.+)$/);return m?{pid:Number(m[1]),cpu:Number(m[2]),memory:Number(m[3])*1024,name:m[4].split('/').at(-1),command:m[4]}:null;
  }).filter(Boolean).sort((a,b)=>b.cpu-a.cpu).slice(0,16).map(({command,...p})=>({...p,icon:os.platform()==='darwin'?processIcon(command):undefined}));
  return {hardware,cpu:total?Math.round(100*(1-idle/total)):0,memory:{total:os.totalmem(),used:os.totalmem()-os.freemem()},disk,uptime:os.uptime(),processes,at:new Date().toISOString()};
}
export function modelRequest(provider,path,options={}) {
  return fetch(provider.baseUrl+path,{...options,redirect:'error',headers:{'Content-Type':'application/json',...(provider.apiKey?{Authorization:`Bearer ${provider.apiKey}`} : {}),...options.headers}});
}
export async function modelsFor(provider) {
  const response=await modelRequest(provider,provider.type==='ollama'?'/api/tags':'/models',{signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error(isMuseProvider(provider)?museError(response.status):`Anbieter antwortet mit ${response.status}. Adresse und Schlüssel prüfen.`);
  const data=await response.json();
  if(isMuseProvider(provider))return museModels(data);
  return provider.type==='ollama'?(data.models||[]).map(m=>({id:m.name,size:m.size,parameters:m.details?.parameter_size,quantization:m.details?.quantization_level})):(data.data||[]).map(m=>({id:m.id}));
}
