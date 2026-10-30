import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
const digest=value=>createHash('sha256').update(String(value)).digest();
export function passwordMatches(value,expected){return timingSafeEqual(digest(value),digest(expected));}
export function createSession(secret,now=Date.now()){
 const payload=Buffer.from(JSON.stringify({exp:now+86400000,id:randomBytes(16).toString('hex')})).toString('base64url');
 return payload+'.'+createHmac('sha256',secret).update(payload).digest('base64url');
}
export function readSession(token,secret,now=Date.now()){
 try{const [payload,signature,...extra]=String(token).split('.');if(extra.length||!payload||!signature)return null;
 const expected=createHmac('sha256',secret).update(payload).digest('base64url');if(!passwordMatches(signature,expected))return null;
 const parsed=JSON.parse(Buffer.from(payload,'base64url').toString());return typeof parsed.id==='string'&&Number.isFinite(parsed.exp)&&parsed.exp>now?parsed:null;
 }catch{return null;}
}
export function createLimiter({windowMs=60000,limit=8,maxEntries=10000}={}){
 const entries=new Map();return (key,now=Date.now())=>{
  if(entries.size>maxEntries){for(const [id,v]of entries)if(v.reset<=now)entries.delete(id);if(entries.size>maxEntries)return false;}
  let item=entries.get(key);if(!item||item.reset<=now){item={count:0,reset:now+windowMs};entries.set(key,item);}
  item.count++;return item.count<=limit;
 };
}
