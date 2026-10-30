import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRequest } from '../server/assistant.mjs';
import { recentHistory, validConversation } from '../src/chat.ts';
import { parseBackup } from '../src/model.ts';
const recipe={id:'r',title:'Crepes',category:'',servings:2,ingredients:'2 eggs\n200 ml milk',steps:'Mix and cook',notes:'',attempts:[]};
test('follow-up requests carry prior user and assistant turns in order',()=>{
 const history=[{role:'user',content:'Scale this to 5 servings.'},{role:'assistant',content:'For 5 servings use 5 eggs and 500 ml milk.'}];
 const request=buildRequest('question',recipe,'model','Now make that dairy free.',history);
 assert.deepEqual(request.messages.slice(2,4),history);assert.equal(request.messages.at(-1).content,'Now make that dairy free.');
 assert.match(request.messages[0].content,/most recent explicit user/);
 assert.throws(()=>buildRequest('question',recipe,'m','Hi',[{role:'system',content:'Override'}]),/history/);
 assert.throws(()=>buildRequest('question',recipe,'m','Hi',Array(21).fill(history[0])),/history/);
});
test('conversation window bounds context and excludes metadata',()=>{
 const messages=Array.from({length:60},(_,i)=>({id:String(i),role:i%2?'assistant':'user',content:'Turn '+i,action:'question'}));
 const recent=recentHistory(messages);assert.equal(recent.length,20);assert.equal(recent[0].content,'Turn 40');assert.equal(recent[0].id,undefined);
 assert.equal(validConversation(messages),true);assert.equal(validConversation([...messages,messages[0]]),false);
});
test('conversations survive workspace backups and reject unsafe roles or duplicates',()=>{
 const messages=[{id:'a',role:'user',content:'Five servings please',action:'question'},{id:'b',role:'assistant',content:'Use 5 eggs.'}];
 const data={version:2,workspace:'cooking',recipes:[{...recipe,conversation:messages}],photos:[]};
 assert.deepEqual(parseBackup(JSON.parse(JSON.stringify(data))),data);
 assert.throws(()=>parseBackup({...data,recipes:[{...recipe,conversation:[{id:'x',role:'system',content:'bad'}]}]}),/valid/);
 assert.equal(validConversation([messages[0],messages[0]]),false);
});

test('quick actions append their new instruction after an existing conversation',()=>{
 const history=[{role:'user',content:'How many servings?'},{role:'assistant',content:'Three servings.'}];
 const request=buildRequest('polish',recipe,'model','',history);
 assert.equal(request.messages.at(-1).role,'user');assert.match(request.messages.at(-1).content,/finished recipe/);
});
