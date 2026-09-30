import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMessages} from '../server/core.mjs';
import {messagesForProvider} from '../server/images.mjs';
import {rankNodes} from '../server/pool.mjs';
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=';
test('Bilder bleiben im Chat erhalten und werden für beide Anbieter richtig übertragen',()=>{
 const messages=validateMessages([{role:'user',content:'Beschreibe das Bild.',images:[image],secret:'discard'}]);
 assert.deepEqual(messages,[{role:'user',content:'Beschreibe das Bild.',images:[image]}]);
 assert.equal(messagesForProvider(messages,'ollama')[0].images[0],image.split(',')[1]);
 assert.deepEqual(messagesForProvider(messages,'compatible')[0].content,[{type:'text',text:'Beschreibe das Bild.'},{type:'image_url',image_url:{url:image}}]);
});
test('Bildprüfung begrenzt Rollen, Anzahl, Größe, Formate und fremde URLs',()=>{
 for(const images of [['https://example.com/private.png'],['data:image/svg+xml;base64,PHN2Zz4='],['data:image/jpeg;base64,aGVsbG8='],['data:image/png;base64,%%%'],Array(4).fill(image),['data:image/png;base64,'+'A'.repeat(3*1024**2)]])assert.throws(()=>validateMessages([{role:'user',content:'x',images}]));
 assert.throws(()=>validateMessages([{role:'assistant',content:'x',images:[image]}]));
 assert.throws(()=>validateMessages(Array.from({length:5},()=>({role:'user',content:'x',images:Array(3).fill(image)}))));
});
test('Mac-Pool wählt für Bilder nur nachweislich bildfähige Modelle',()=>{
 const nodes=[{id:'text',enabled:true,online:true,active:0,models:[{id:'coder',vision:false}]},{id:'vision',enabled:true,online:true,active:1,models:[{id:'gemma',vision:true}]},{id:'unknown',enabled:true,online:true,active:0,models:[{id:'old-peer'}]}];
 assert.deepEqual(rankNodes(nodes,'__pool__',true).map(n=>n.id),['vision']);
 assert.deepEqual(rankNodes(nodes,'coder',true),[]);
 assert.equal(rankNodes(nodes,'coder')[0].id,'text');
});
