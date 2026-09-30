import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync,renameSync} from 'node:fs';
import path from 'node:path';
import {allowedRequest} from './core.mjs';
const sessionToken=req=>String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('aevori_session='))?.slice('aevori_session='.length)||String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('orbit_session='))?.slice('orbit_session='.length)||'';
const hash=s=>createHash('sha256').update(s).digest('hex');
export function createTeam({port,file}){
 let data={publicUrl:'',members:[],invites:[],sessions:[]};
 try{const saved=JSON.parse(readFileSync(file,'utf8'));if(saved&&Array.isArray(saved.members)&&Array.isArray(saved.sessions)&&Array.isArray(saved.invites))data={...data,...saved};}catch{}
 const save=()=>{mkdirSync(path.dirname(file),{recursive:true,mode:0o700});writeFileSync(file+'.tmp',JSON.stringify(data),{mode:0o600});renameSync(file+'.tmp',file);};
 const online=new Map(),jobs=new Map(),history=[];const owner={id:'owner',name:data.ownerName||'Du',role:'owner',profileConfigured:data.ownerProfileConfigured===true};
 const gate=req=>{
  const forwarded=req.headers['x-forwarded-for']||req.headers['forwarded']||req.headers['x-forwarded-host'];
  if(!forwarded&&allowedRequest(req,port))return {allowed:true,actor:owner,local:true};
  let url;try{url=new URL(data.publicUrl);}catch{return {allowed:false};}
  if(req.headers.host!==url.host||req.headers['sec-fetch-site']==='cross-site'||req.headers.origin&&req.headers.origin!==url.origin)return {allowed:false};
  const token=sessionToken(req);
  const session=data.sessions.find(s=>s.hash===hash(token)&&s.expires>Date.now());
  const member=session&&data.members.find(m=>m.id===session.member&&!m.revoked);
  return {allowed:true,actor:member?{...member,role:'member'}:null,local:false};
 };
 return {gate,
  info(access){return {authenticated:!!access.actor,id:access.actor?.id,role:access.actor?.role,name:access.actor?.name,profileConfigured:access.actor?.profileConfigured===true,publicUrl:access.local?data.publicUrl:undefined};},
  profile(actor,input){
   const name=typeof input.name==='string'?input.name.trim():'';
   if(!name||name.length>40||/[\u0000-\u001f\u007f]/.test(name))throw new Error('Bitte einen Namen mit 1 bis 40 Zeichen eingeben.');
   const member=actor.id==='owner'&&actor.role==='owner'?owner:data.members.find(m=>m.id===actor.id&&!m.revoked);
   if(!member)throw new Error('Dein Zugang ist nicht mehr gültig.');
   const previous={name:member.name,profileConfigured:member.profileConfigured,ownerName:data.ownerName,ownerProfileConfigured:data.ownerProfileConfigured};
   member.name=name;member.profileConfigured=true;
   if(member===owner){data.ownerName=name;data.ownerProfileConfigured=true;}
   try{save();}catch(error){member.name=previous.name;member.profileConfigured=previous.profileConfigured;data.ownerName=previous.ownerName;data.ownerProfileConfigured=previous.ownerProfileConfigured;throw error;}
   for(const job of jobs.values())if(job.member===actor.id)job.name=name;
   return {name,profileConfigured:true};
  },
  configure(input){if(typeof input.publicUrl!=='string')throw new Error('HTTPS-Adresse fehlt.');if(input.publicUrl){const u=new URL(input.publicUrl);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.pathname!=='/')throw new Error('Bitte die HTTPS-Hauptadresse ohne Pfad eingeben.');data.publicUrl=u.origin;}else data.publicUrl='';save();return {ok:true};},
  invite(input){const name=typeof input.name==='string'?input.name.trim():'';if(!name||name.length>40)throw new Error('Bitte einen Namen eingeben (max. 40 Zeichen).');if(!data.publicUrl)throw new Error('Zuerst die HTTPS-Adresse einrichten.');if(data.invites.filter(i=>i.expires>Date.now()).length>=30)throw new Error('Zu viele offene Einladungen.');const token=randomBytes(32).toString('base64url');data.invites=data.invites.filter(i=>i.expires>Date.now());data.invites.push({hash:hash(token),name,expires:Date.now()+86400000});save();return {url:data.publicUrl+'/#invite='+token,expires:Date.now()+86400000};},
  join(input,res){const token=typeof input.token==='string'?input.token:'';const index=data.invites.findIndex(i=>i.hash===hash(token)&&i.expires>Date.now());if(index<0)throw new Error('Diese Einladung ist ungültig, abgelaufen oder bereits verwendet.');const invite=data.invites.splice(index,1)[0];const member={id:randomUUID(),name:invite.name,revoked:false};data.members.push(member);const session=randomBytes(32).toString('base64url');data.sessions=data.sessions.filter(s=>s.expires>Date.now());data.sessions.push({hash:hash(session),member:member.id,expires:Date.now()+7*86400000});save();res.setHeader('Set-Cookie',`aevori_session=${session}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`);return {ok:true};},
  revoke(id){const member=data.members.find(m=>m.id===id);if(!member)throw new Error('Mitglied nicht gefunden.');member.revoked=true;data.sessions=data.sessions.filter(s=>s.member!==id);online.delete(id);for(const j of jobs.values())if(j.member===id)j.abort?.();save();return {ok:true};},
  heartbeat(actor){online.set(actor.id,Date.now());return {ok:true};},
  logout(req,res){const token=sessionToken(req);if(token){data.sessions=data.sessions.filter(s=>s.hash!==hash(token));save();}res.setHeader('Set-Cookie',['aevori_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0','orbit_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0']);return {ok:true};},
  begin(actor,model,abort){if([...jobs.values()].filter(j=>j.member===actor.id).length>=(actor.role==='owner'?4:2))throw new Error('Deine laufenden Anfragen werden noch bearbeitet.');const job={id:randomUUID(),member:actor.id,name:actor.name,model,started:Date.now(),abort};jobs.set(job.id,job);online.set(actor.id,Date.now());return job.id;},
  assigned(id,machine,model){const job=jobs.get(id);if(job)Object.assign(job,{machine,model});},
  finish(id,usage,status){const job=jobs.get(id);if(!job)return;const {abort,...record}=job;history.unshift({...record,...usage,durationMs:Date.now()-job.started,status});history.splice(200);jobs.delete(id);},
  state(actor){const members=[owner,...data.members.filter(m=>!m.revoked)].map(m=>({id:m.id,name:m.name,role:m.id==='owner'?'owner':'member',online:Date.now()-(online.get(m.id)||0)<45000,active:[...jobs.values()].filter(j=>j.member===m.id).length}));return {members,active:[...jobs.values()].map(({abort,...j})=>j),history:history.slice(0,50),publicUrl:actor.role==='owner'?data.publicUrl:undefined,configured:!!data.publicUrl};}
 };
}
