import { missingIngredientAmounts } from '../src/ingredientAmounts.ts';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRequest, finalAnswer } from './assistant.mjs';
import { createSession, readSession, passwordMatches, createLimiter } from './security.mjs';
const root=resolve(fileURLToPath(new URL('../dist',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon','.json':'application/json'};
export function createApp({env=process.env,fetcher=fetch,distDir=root,now=Date.now}={}){
 const production=env.NODE_ENV==='production',password=env.APP_ACCESS_PASSWORD,secret=env.SESSION_SECRET;
 if(production&&(!password||password.length<12||!secret||secret.length<32))throw Error('Production requires APP_ACCESS_PASSWORD (12+ characters) and SESSION_SECRET (32+ characters).');
 if(password&&!secret)throw Error('SESSION_SECRET is required with APP_ACCESS_PASSWORD.');
 const apiLimit=createLimiter({limit:Number(env.AI_REQUESTS_PER_MINUTE)||8}),loginLimit=createLimiter({limit:10,windowMs:900000});
 let day='',used=0,active=0;
 const configured=Boolean(env.AI_API_KEY&&env.AI_BASE_URL&&env.AI_MODEL);
 const login=(message='')=>`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Savorly · Demo access</title><style>body{font:17px system-ui;background:#fff8ef;color:#593e40;display:grid;place-items:center;min-height:95vh;margin:0}main{max-width:400px;padding:35px}h1{color:#a34c57}label{display:grid;gap:12px}input,button{font:inherit;padding:14px;border:1px solid #d8b9b4;border-radius:12px}button{background:#a34c57;color:white;margin-top:18px}p{line-height:1.6}</style><main><h1>savorly ✳</h1><h2>Welcome to the demo</h2><p>Enter the demo password supplied by the team. Your journal stays in this browser unless you choose cloud sync.</p>${message?'<p role="alert">'+message+'</p>':''}<form method="post" action="/login"><label>Demo password<input name="password" type="password" required autocomplete="current-password" maxlength="200"></label><button>Open Savorly</button></form></main></html>`;
 return createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');res.setHeader('Cache-Control','no-store');
  let supabase='';try{if(env.VITE_SUPABASE_URL)supabase=' '+new URL(env.VITE_SUPABASE_URL).origin;}catch{/* Optional configuration. */}
  res.setHeader('Content-Security-Policy',`default-src 'self'; img-src 'self' data: blob:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; connect-src 'self'${supabase}; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`);
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  const html=(status,text)=>{res.writeHead(status,{'Content-Type':'text/html; charset=utf-8'});res.end(text);};
  const ip=req.socket.remoteAddress??'unknown';
  let pathname;try{pathname=new URL(req.url,'http://local').pathname;}catch{return send(400,{error:'Invalid URL'});}
  if(pathname==='/healthz'&&req.method==='GET')return send(200,{status:'ok',aiConfigured:configured,frontendBuilt:existsSync(resolve(distDir,'index.html'))});
  const origin=req.headers.origin;
  const allowedOrigin=()=>{
    if(!origin)return !production;
    try{const site=env.APP_ORIGIN||env.RENDER_EXTERNAL_URL;return site?new URL(origin).origin===new URL(site).origin:new URL(origin).host===req.headers.host||(!production&&/^http:\/\/(localhost|127\.0\.0\.1):(5173|5174|4173)$/.test(origin));}catch{return false;}
  };
  const readBody=async(limit=100000)=>{const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>limit)throw Error('BODY_TOO_LARGE');chunks.push(chunk);}return Buffer.concat(chunks).toString('utf8');};
  const token=(req.headers.cookie??'').split(';').map(x=>x.trim()).find(x=>x.startsWith('savorly_session='))?.slice(16);
  const session=password?readSession(token,secret,now()):{id:ip};
  if(pathname==='/login'){
    if(req.method==='GET')return html(200,login());
    if(req.method!=='POST')return send(405,{error:'Method not allowed'});
    if(!password)return send(404,{error:'Not found'});
    if(!allowedOrigin())return send(403,{error:'Origin not allowed'});
    if(!loginLimit(ip,now()))return send(429,{error:'Too many login attempts. Try later.'});
    try{const input=new URLSearchParams(await readBody(4096)).get('password')??'';if(!passwordMatches(input,password))return html(401,login('That password did not match.'));
      res.setHeader('Set-Cookie',`savorly_session=${createSession(secret,now())}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${production?'; Secure':''}`);res.writeHead(303,{Location:'/'});res.end();return;
    }catch{return send(400,{error:'Invalid login request'});}
  }
  if(password&&!session){if(pathname.startsWith('/api/'))return send(401,{error:'Your demo session expired. Reload and sign in again.'});res.writeHead(302,{Location:'/login'});res.end();return;}
  if(pathname==='/api/assist'){
    if(req.method!=='POST')return send(405,{error:'Method not allowed'});
    if(!allowedOrigin())return send(403,{error:'Origin not allowed'});
    if(!apiLimit(session.id,now())){res.setHeader('Retry-After','60');return send(429,{error:'Please wait a minute before sending more AI requests.'});}
    let request;
    try{
      const {action,recipe,question,history}=JSON.parse(await readBody());request=buildRequest(action,recipe,env.AI_MODEL,question,history);
      if(action==='nutrition'){const missing=missingIngredientAmounts(recipe.ingredients);if(missing.length)return send(200,{text:JSON.stringify({calories:null,proteinG:null,carbsG:null,fatG:null,assumptions:[],missing})});}
    }catch(e){return send(e.message==='BODY_TOO_LARGE'?413:400,{error:e.message==='BODY_TOO_LARGE'?'Recipe or conversation is too large. Start a new chat.':'Invalid recipe or conversation request.'});}
    if(!configured)return send(503,{error:'AI is not connected. Configure the server AI credentials and restart it.'});
    const today=new Date(now()).toISOString().slice(0,10);if(day!==today){day=today;used=0;}
    if(used>=(Number(env.AI_DAILY_REQUEST_LIMIT)||100))return send(429,{error:'The demo AI daily limit has been reached. Journal tools still work.'});
    if(active>=2){res.setHeader('Retry-After','15');return send(429,{error:'The AI is busy. Try again in a moment.'});}
    used++;active++;
    const abort=new AbortController();res.on('close',()=>{if(!res.writableEnded)abort.abort();});
    try{
      const upstream=await fetcher(env.AI_BASE_URL.replace(/\/$/,'')+'/chat/completions',{method:'POST',signal:AbortSignal.any([AbortSignal.timeout(45000),abort.signal]),headers:{Authorization:`Bearer ${env.AI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(request)});
      if(!upstream.ok)return send(502,{error:`AI provider returned ${upstream.status}. Please retry or check the provider account.`});
      const data=await upstream.json();return send(200,{text:finalAnswer(data)});
    }catch(e){if(!res.destroyed)return send(502,{error:e.message?.includes('finished')||e.message?.includes('planning')||e.message?.includes('cut short')?e.message:'Could not complete the AI request. Please retry.'});}
    finally{active--;}
    return;
  }
  if(pathname.startsWith('/api/'))return send(404,{error:'Not found'});
  if(!['GET','HEAD'].includes(req.method))return send(405,{error:'Method not allowed'});
  try{
    const decoded=decodeURIComponent(pathname);if(decoded.split('/').some(part=>part.startsWith('.')))return send(404,{error:'Not found'});if(decoded.includes('\0'))return send(400,{error:'Invalid path'});
    const file=resolve(distDir,'.'+decoded);if(file!==resolve(distDir)&&!file.startsWith(resolve(distDir)+sep))return send(403,{error:'Not allowed'});
    let target=file;try{if((await stat(target)).isDirectory())target=resolve(target,'index.html');await stat(target);}catch{if(extname(decoded))return send(404,{error:'Not found'});target=resolve(distDir,'index.html');}
    const bytes=await readFile(target);res.setHeader('Content-Type',mime[extname(target)]??'application/octet-stream');if(pathname.startsWith('/assets/'))res.setHeader('Cache-Control','public,max-age=31536000,immutable');res.writeHead(200);res.end(req.method==='HEAD'?undefined:bytes);
  }catch{return send(404,{error:'Frontend is not built. Run npm run build first.'});}
 });
}
