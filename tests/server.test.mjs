import {mkdtemp,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve,sep} from "node:path";
import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server/app.mjs';
import {createSession,readSession,createLimiter} from '../server/security.mjs';
const recipe={title:'Crepes',servings:2,ingredients:'2 eggs',steps:'Cook',notes:'',attempts:[]};
async function withApp(env,run,fetcher){
 const temporary=await mkdtemp(join(tmpdir(),'savorly-server-test-'));
 await writeFile(join(temporary,'index.html'),'<title>Savorly test frontend</title>');
 const server=createApp({env,fetcher,distDir:temporary});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;
 try{await run(url);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));
 if(resolve(temporary).startsWith(resolve(tmpdir())+sep)&&temporary.includes('savorly-server-test-'))await rm(temporary,{recursive:true,force:true});}
}
test('session signatures expire and rate limits reset',()=>{
 const token=createSession('secret',0);assert.ok(readSession(token,'secret',1));assert.equal(readSession(token,'other',1),null);assert.equal(readSession(token,'secret',86400001),null);
 const limit=createLimiter({limit:2,windowMs:100});assert.equal(limit('a',1),true);assert.equal(limit('a',2),true);assert.equal(limit('a',3),false);assert.equal(limit('a',101),true);
});
test('production refuses an unprotected public AI service',()=>{
 assert.throws(()=>createApp({env:{NODE_ENV:'production'}}),/requires/);
});
test('production login protects API and static app with secure sessions',async()=>{
 const env={NODE_ENV:'production',APP_ACCESS_PASSWORD:'test-only-password',SESSION_SECRET:'s'.repeat(40)};
 await withApp(env,async url=>{
   assert.equal((await fetch(url+'/healthz')).status,200);
   assert.equal((await fetch(url+'/',{redirect:'manual'})).status,302);
   assert.equal((await fetch(url+'/api/assist',{method:'POST'})).status,401);
   const response=await fetch(url+'/login',{method:'POST',redirect:'manual',headers:{Origin:url,'Content-Type':'application/x-www-form-urlencoded'},body:'password=test-only-password'});
   assert.equal(response.status,303);const cookie=response.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);
   const auth={Cookie:cookie.split(';')[0],Origin:url,'Content-Type':'application/json'};
   const page=await fetch(url+'/',{headers:auth});assert.equal(page.status,200);assert.match(await page.text(),/Savorly/);
   assert.equal((await fetch(url+'/api/assist',{method:'POST',headers:{...auth,Origin:'https://evil.example'},body:'{}'})).status,403);
   assert.equal((await fetch(url+'/.env',{headers:auth})).status,404);
 });
});
test('API forwards bounded conversation and filters reasoning; missing quantities avoid upstream',async()=>{
 const calls=[];const env={AI_API_KEY:'test-only-key',AI_BASE_URL:'https://provider.example/v1',AI_MODEL:'model'};
 await withApp(env,async url=>{
   const history=[{role:'user',content:'5 servings'},{role:'assistant',content:'Use 5 eggs'}];
   const response=await fetch(url+'/api/assist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'question',recipe,question:'Now dairy free?',history})});
   assert.equal(response.status,200);assert.deepEqual(await response.json(),{text:'Use oat milk.'});assert.equal(calls[0].messages.at(-1).content,'Now dairy free?');assert.equal(calls[0].messages[3].content,'Use 5 eggs');
   const missing=await fetch(url+'/api/assist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'nutrition',recipe:{...recipe,ingredients:'eggs; milk'}})});
   assert.equal(missing.status,200);assert.equal(JSON.parse((await missing.json()).text).missing.length,2);assert.equal(calls.length,1);
 },async(_url,options)=>{calls.push(JSON.parse(options.body));return {ok:true,json:async()=>({choices:[{message:{content:'<think>private</think>Use oat milk.'}}]})};});
});
test('API rejects malformed/oversized input and applies request limits',async()=>{
 await withApp({AI_REQUESTS_PER_MINUTE:'2'},async url=>{
   const post=body=>fetch(url+'/api/assist',{method:'POST',headers:{'Content-Type':'application/json'},body});
   assert.equal((await post('not-json')).status,400);
   assert.equal((await post('x'.repeat(100001))).status,413);
   assert.equal((await post('{}')).status,429);
 });
});

test('daily AI cap stops upstream requests and leaves local tools available',async()=>{
 let calls=0;await withApp({AI_API_KEY:'fake',AI_BASE_URL:'https://example.test/v1',AI_MODEL:'test',AI_DAILY_REQUEST_LIMIT:'1'},async url=>{
  const post=()=>fetch(url+'/api/assist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'question',recipe,question:'How do I mix this?'})});
  assert.equal((await post()).status,200);assert.equal((await post()).status,429);assert.equal(calls,1);assert.equal((await fetch(url+'/')).status,200);
 },async()=>{calls++;return {ok:true,json:async()=>({choices:[{message:{content:'Mix until combined.'}}]})};});
});
