import { parseRecipeDraft } from "./recipeDraft";
import { useEffect, useRef, useState } from "react";
import type { Recipe } from "./model";
import type { RecipeDraft } from "./recipeDraft";
import type { ChatMessage } from "./chat";
import { recentHistory } from "./chat";
import { newId } from "./id";
import { pagesFor } from "./notebook";
import AIResult from "./AIResult";
const actions = {polish:"Turn my notes into a clear recipe",compare:"Compare my recorded attempts",swaps:"Suggest ingredient substitutions"};
export default function CompanionChat({recipe,onChange,onSave,initialQuestion=""}:{recipe:Recipe;onChange:(messages:ChatMessage[])=>void;onSave:(draft:RecipeDraft)=>void;initialQuestion?:string}) {
  const messages=recipe.conversation??[];
  const [draft,setDraft]=useState(initialQuestion),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [cleared,setCleared]=useState<ChatMessage[]|null>(null);
  const request=useRef<AbortController|null>(null),last=useRef<{prior:ChatMessage[];message:ChatMessage}|null>(null);
  const end=useRef<HTMLDivElement>(null);
  useEffect(()=>()=>request.current?.abort(),[]);
  useEffect(()=>{end.current?.scrollIntoView({block:"nearest",behavior:"smooth"});},[messages.length,busy]);
  async function run(prior:ChatMessage[],message:ChatMessage){
    const controller=new AbortController(); request.current?.abort();request.current=controller;last.current={prior,message};
    const pending=[...prior,message].slice(-59);onChange(pending);setBusy(true);setError("");
    try {
      const response=await fetch("/api/assist",{method:"POST",signal:controller.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({action:message.action??"question",question:message.content,history:recentHistory(prior),recipe:{title:recipe.title,servings:recipe.servings,ingredients:recipe.ingredients,steps:recipe.steps,notes:message.action==="polish"?[recipe.notes,...pagesFor(recipe).map(p=>[p.title,p.text,...Object.entries(p.fields??{}).map(([k,v])=>`${k}: ${v}`)].join("\n"))].join("\n\n"):recipe.notes,attempts:recipe.attempts.map(({date,changes,result,rating})=>({date,changes,result,rating}))}})});
      const raw=await response.text();let data:{text?:string;error?:string};try{data=JSON.parse(raw);}catch{throw Error("AI service unavailable. Please retry shortly.");}
      if(!response.ok||!data.text)throw Error(data.error||"No answer was returned.");
      if(message.action==="polish") {const parsed=parseRecipeDraft(data.text,recipe);if(!parsed.ingredients.trim()||!parsed.steps.trim())throw Error("The AI did not return a complete recipe. Retry the message or add more notes.");}
      if(!controller.signal.aborted){onChange([...pending,{id:newId(),role:"assistant",content:data.text,action:message.action}].slice(-60) as ChatMessage[]);last.current=null;}
    }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Could not send your message.");}
    finally{if(request.current===controller)setBusy(false);}
  }
  function send(text:string,action="question") {if(busy||!text.trim())return;const content=text.trim().slice(0,2000);setDraft("");void run(messages,{id:newId(),role:"user",content,action});}
  return <section className="assistant card companion-chat" aria-label="AI conversation">
    <div className="chat-heading"><div><p className="eyebrow">YOUR KITCHEN COMPANION</p><h2>Keep the conversation going.</h2></div><button type="button" disabled={busy||!messages.length} onClick={()=>{setCleared(messages);onChange([]);last.current=null;setError("");setDraft("");}}>New chat</button></div>
    {cleared&&<button type="button" disabled={busy} onClick={()=>{onChange(cleared);setCleared(null);}}>Undo new chat</button>}
    <p className="chat-context-note">This conversation stays with <strong>{recipe.title||"this recipe"}</strong>. Follow up with “make that five servings” or “what about oat milk?”. The latest 20 messages, recipe ingredients, method, notes and attempts are sent to your AI provider. Photos and handwriting are not sent. Nutrition estimates live in Recipe Book.</p>
    <div className="chat-quick-actions">{Object.entries(actions).map(([action,label])=><button key={action} type="button" disabled={busy} onClick={()=>send(label,action)}>{label}</button>)}<button type="button" disabled={busy} onClick={()=>onChange([...messages,{id:newId(),role:"user",content:"Draft a creator caption",action:"caption"},{id:newId(),role:"assistant",content:`From my kitchen: ${recipe.title}. ${recipe.notes||"Testing, tasting, and making it my own."}\n\n#CookingJournal #RecipeExperiments #HomeCooking`,action:"caption"}].slice(-60) as ChatMessage[])}>Draft a caption (local)</button></div>
    <div className="chat-transcript" role="log" aria-label="Conversation messages" aria-live="polite" aria-relevant="additions">
      {!messages.length&&<p className="chat-empty">Ask a cooking question or choose an action above. You can keep asking follow-ups here.</p>}
      {messages.map(m=><article key={m.id} className={`chat-message chat-${m.role}`}><strong className="chat-speaker">{m.role==="user"?"You":"Savorly"}</strong>{m.role==="user"?<p>{m.content}</p>:<AIResult text={m.content} recipeMode={m.action==="polish"} source={recipe} onSave={onSave}/>}</article>)}
      {busy&&<p role="status">Savorly is replying…</p>}
      <div ref={end}/>
    </div>
    {error&&<p role="alert" className="inline-error">{error}</p>}
    {!busy&&(error||messages.at(-1)?.role==="user")&&<button type="button" onClick={()=>{const turn=last.current;if(turn)void run(turn.prior,turn.message);else {const trailing=messages.at(-1);if(trailing?.role==="user")void run(messages.slice(0,-1),trailing);}}}>Retry last message</button>}
    <form className="chat-compose" onSubmit={e=>{e.preventDefault();send(draft);}}><label htmlFor="chat-message">Message Savorly<textarea id="chat-message" value={draft} maxLength={2000} onChange={e=>setDraft(e.target.value)} placeholder="Ask a question or follow up on the answer…" rows={3} onKeyDown={e=>{if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();send(draft);}}}/></label><div className="chat-compose-actions"><small>Autosaved on this device · Ctrl/⌘ + Enter to send</small>{busy?<button type="button" onClick={()=>{request.current?.abort();setBusy(false);setError("Reply stopped. You can retry or send another message.");}}>Stop reply</button>:<button type="submit" className="primary" disabled={!draft.trim()}>Send message ↑</button>}</div></form>
  </section>;
}
