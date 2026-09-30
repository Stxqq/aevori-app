import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import {createPool,rankNodes} from '../server/pool.mjs';
const stats=()=>({hardware:{name:'Test Mac',chip:'Test Chip',cores:8},cpu:12,memory:{total:24000000000,used:9000000000},at:new Date().toISOString()});
test('Pool verteilt nach Auslastung, rotiert und berücksichtigt Modell/Status',()=>{
 const base={enabled:true,online:true,models:[{id:'qwen'}],active:0,lastUsed:0};
 const list=[{...base,id:'a',active:1},{...base,id:'b',lastUsed:10},{...base,id:'c',lastUsed:0},{...base,id:'d',enabled:false},{...base,id:'e',online:false}];
 assert.deepEqual(rankNodes(list,'qwen').map(n=>n.id),['c','b','a']);assert.deepEqual(rankNodes(list,'missing'),[]);
});
test('Echte HTTP-Peers: Verbindung, parallele Verteilung, Failover und Token-Schutz',async()=>{
 const key='a'.repeat(64);let failFirst=false,peerImage;const servers=[];
 const peer=async id=>{const server=http.createServer(async(req,res)=>{
  if(req.headers.authorization!==`Bearer ${key}`){res.writeHead(401);return res.end();}
  if(req.url==='/peer/health'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({aevoriNode:1,instanceId:id,...stats(),models:[{id:'fixture',vision:id==='b'}]}));}
  if(req.url==='/peer/chat'){let raw='';for await(const chunk of req)raw+=chunk;peerImage=JSON.parse(raw).messages?.at(-1)?.images?.[0];if(id==='a'&&failFirst){res.writeHead(503);return res.end();}res.setHeader('Content-Type','application/x-ndjson');return res.end(JSON.stringify({message:{content:id},done:true})+'\n');}
  res.writeHead(404);res.end();
 });server.listen(0,'127.0.0.1');await once(server,'listening');servers.push(server);return `http://127.0.0.1:${server.address().port}`;};
 try{
  const a=await peer('a'),b=await peer('b'),pool=createPool(stats);pool.update({id:'local',enabled:false});
  await assert.rejects(pool.add({name:'a',baseUrl:a,token:'b'.repeat(64)}),/nicht akzeptiert/);
  const na=await pool.add({name:'a',baseUrl:a,token:key}),nb=await pool.add({name:'b',baseUrl:b,token:key});
  await assert.rejects(pool.add({name:'again',baseUrl:a,token:key}),/bereits/);
  assert.equal(JSON.stringify(await pool.list()).includes(key),false);
  const first=await pool.open('fixture',[{role:'user',content:'hi'}],new AbortController().signal);assert.equal(first.assignment.name,'a');
  const second=await pool.open('fixture',[{role:'user',content:'hi'}],new AbortController().signal);assert.equal(second.assignment.name,'b');
  await first.response.text();await second.response.text();first.release();first.release();second.release();
  assert.ok((await pool.list()).nodes.every(n=>n.active===0));
  const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=';
  const vision=await pool.open('__pool__',[{role:'user',content:'Bild',images:[image]}],new AbortController().signal);assert.equal(vision.assignment.name,'b');assert.equal(peerImage,image);await vision.response.text();vision.release();
  failFirst=true;
  const fallback=await pool.open('fixture',[{role:'user',content:'hi'}],new AbortController().signal);assert.equal(fallback.assignment.name,'b');assert.equal(fallback.assignment.fallback,true);await fallback.response.text();fallback.release();
  pool.update({id:na.id,enabled:false});pool.update({id:nb.id,enabled:false});await assert.rejects(pool.open('fixture',[],new AbortController().signal),/Kein aktiver Mac/);
  const share=pool.share(true);assert.equal(pool.authorized({headers:{authorization:'Bearer '+share.token}}),true);assert.equal(pool.authorized({headers:{authorization:'Bearer '+'é'.repeat(64)}}),false);pool.share(false);assert.equal(pool.authorized({headers:{authorization:'Bearer '+share.token}}),false);
  pool.update({id:na.id,remove:true});assert.equal((await pool.list()).nodes.length,2);
 }finally{servers.forEach(s=>{s.closeAllConnections();s.close();});}
});
