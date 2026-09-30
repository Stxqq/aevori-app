import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createTeam} from '../server/team.mjs';
test('Einmalige Einladungen, sichere Sitzungen, Widerruf und private Nutzungsdaten',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'aevori-team-test-')),file=path.join(dir,'team.json');
 try{
 const team=createTeam({port:5199,file});
 const local={headers:{host:'localhost:5199'}};
 assert.equal(team.gate(local).actor.role,'owner');
 assert.equal(team.gate({headers:{host:'localhost:5199','x-forwarded-for':'1.2.3.4'}}).allowed,false);
 assert.throws(()=>team.configure({publicUrl:'http://public.example'}));
 team.configure({publicUrl:'https://aevori.example'});
 const guest={headers:{host:'aevori.example','x-forwarded-for':'1.2.3.4',origin:'https://aevori.example'}};
 assert.equal(team.gate(guest).actor,null);
 assert.equal(team.gate({...guest,headers:{...guest.headers,origin:'https://evil.example'}}).allowed,false);
 const invitation=team.invite({name:'Testfreund'}),token=new URL(invitation.url).hash.slice(8);let cookie;
 team.join({token},{setHeader(k,v){assert.equal(k,'Set-Cookie');cookie=v;}});
 assert.match(cookie,/HttpOnly; Secure; SameSite=Strict/);
 assert.throws(()=>team.join({token},{setHeader(){}}),/bereits verwendet/);
 guest.headers.cookie=cookie.split(';')[0];const member=team.gate(guest).actor;
 assert.equal(member.role,'member');assert.equal(member.name,'Testfreund');
 assert.equal(team.info(team.gate(guest)).id,member.id);
 const oldGuest={headers:{...guest.headers,cookie:guest.headers.cookie.replace('aevori_session=','orbit_session=')}};
 assert.equal(team.gate(oldGuest).actor.id,member.id,'Legacy session cookies retain access during migration');
 const stored=readFileSync(file,'utf8');assert.ok(!stored.includes(token));assert.ok(!stored.includes(cookie.split('=')[1].split(';')[0]));
 team.heartbeat(member);let stopped=false;
 const j=team.begin(member,'qwen3',()=>{stopped=true;});team.assigned(j,'Mac Studio','qwen3');
 const live=team.state(member);assert.equal(live.active[0].machine,'Mac Studio');assert.ok(!('abort' in live.active[0]));assert.ok(!JSON.stringify(live).includes('prompt'));
 team.finish(j,{inputTokens:12,outputTokens:24},'done');assert.equal(team.state(member).history[0].outputTokens,24);
 team.begin(member,'qwen3',()=>{stopped=true;});team.revoke(member.id);assert.equal(stopped,true);assert.equal(team.gate(guest).actor,null);
 const restored=createTeam({port:5199,file});assert.equal(restored.gate(guest).actor,null);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('Profile names persist, onboarding completes once, and members edit only themselves',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'aevori-profile-test-')),file=path.join(dir,'team.json');
 try{
  const local={headers:{host:'localhost:5199'}},team=createTeam({port:5199,file});
  const owner=team.gate(local).actor;
  assert.equal(team.info(team.gate(local)).profileConfigured,false);
  for(const name of ['', '   ', 'a'.repeat(41), 'bad\nname', null])assert.throws(()=>team.profile(owner,{name}));
  assert.deepEqual(team.profile(owner,{name:'  Alex  '}),{name:'Alex',profileConfigured:true});
  assert.equal(team.state(owner).members[0].name,'Alex');
  const restored=createTeam({port:5199,file});
  assert.equal(restored.info(restored.gate(local)).name,'Alex');
  assert.equal(restored.info(restored.gate(local)).profileConfigured,true);
  team.configure({publicUrl:'https://aevori.example'});
  const invitation=team.invite({name:'Friend'}),token=new URL(invitation.url).hash.slice(8);let cookie;
  team.join({token},{setHeader(_,value){cookie=value.split(';')[0];}});
  const guest={headers:{host:'aevori.example','x-forwarded-for':'1.2.3.4',origin:'https://aevori.example',cookie}};
  const member=team.gate(guest).actor;
  assert.equal(team.info(team.gate(guest)).profileConfigured,false);
  team.profile(member,{id:'owner',name:'Sam'});
  assert.equal(team.state(owner).members[0].name,'Alex','Body cannot choose another identity');
  assert.equal(team.info(team.gate(guest)).name,'Sam');
  assert.equal(team.info(team.gate(guest)).profileConfigured,true);
  const job=team.begin(team.gate(guest).actor,'fixture',()=>{});
  assert.equal(team.state(owner).active[0].name,'Sam');
  team.profile(team.gate(guest).actor,{name:'Samira'});
  assert.equal(team.state(owner).active[0].name,'Samira');
  team.finish(job,{},'done');
  const reloaded=createTeam({port:5199,file});
  assert.equal(reloaded.info(reloaded.gate(guest)).name,'Samira');
  assert.equal(reloaded.info(reloaded.gate(guest)).profileConfigured,true);
  team.revoke(member.id);
  assert.throws(()=>team.profile(member,{name:'Revoked'}),/gültig/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
