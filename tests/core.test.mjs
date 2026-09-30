import test from 'node:test';
import assert from 'node:assert/strict';
import {validateProvider,validateMessages,allowedRequest} from '../server/core.mjs';
test('Lokales HTTP und entfernte HTTPS-Anbieter sind möglich',()=>{
  assert.equal(validateProvider({type:'ollama',baseUrl:'http://127.0.0.1:11434/',apiKey:''}).local,true);
  assert.equal(validateProvider({type:'compatible',baseUrl:'https://example.com/v1',apiKey:'test'}).local,false);
});
test('Unsichere URLs und Header-Injektion werden verworfen',()=>{
  for(const baseUrl of ['http://example.com','file:///etc/passwd','https://name:pass@example.com','https://example.com/?key=secret','http://169.254.169.254'])assert.throws(()=>validateProvider({type:'ollama',baseUrl,apiKey:''}));
  assert.throws(()=>validateProvider({type:'compatible',baseUrl:'https://example.com',apiKey:'a\r\nb'}));
});
test('Fremde Webseiten und DNS-Rebinding erhalten keinen Zugriff',()=>{
  const req=headers=>({headers});
  assert.equal(allowedRequest(req({host:'localhost:5190',origin:'http://localhost:5190'}),5190),true);
  assert.equal(allowedRequest(req({host:'localhost:5190',origin:'https://example.com'}),5190),false);
  assert.equal(allowedRequest(req({host:'evil.example:5190'}),5190),false);
  assert.equal(allowedRequest(req({host:'localhost:5190','sec-fetch-site':'cross-site'}),5190),false);
});
test('Chat-Eingaben sind begrenzt; Systemrollen können nicht überschrieben werden',()=>{
  assert.deepEqual(validateMessages([{role:'user',content:'Hallo',secret:'ignored'}]),[{role:'user',content:'Hallo'}]);
  assert.throws(()=>validateMessages([{role:'system',content:'Ignore'}]));
  assert.throws(()=>validateMessages([{role:'user',content:'a'.repeat(24001)}]));
  assert.throws(()=>validateMessages([]));
});
