import { useState } from "react";
import type { Recipe } from "./model";
import { pagesFor } from "./notebook";
export default function JournalLibrary({recipes,onCreate,onOpen,onDelete}:{recipes:Recipe[];onCreate:()=>void;onOpen:(id:string)=>void;onDelete:(id:string)=>void}) {
  const [query,setQuery]=useState("");
  const journals=recipes.filter(r => r.journalPages === undefined ? Boolean(r.notes.trim()) : r.journalPages.length > 0);
  const visible=journals.filter(r=>(r.title+" "+pagesFor(r).map(p=>p.title+" "+p.text+" "+Object.values(p.fields??{}).join(" ")).join(" ")).toLowerCase().includes(query.trim().toLowerCase()));
  return <section className="journal-library" aria-label="Saved journals">
    <div className="recipe-library-toolbar"><h2>My journals <span>{journals.length}</span></h2><button className="primary" onClick={onCreate}>＋ New journal</button></div>
    <label className="journal-search">Find a journal<input type="search" placeholder="Search journal titles or notes…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <div className="journal-card-grid">{visible.map(r=><article className="card journal-card" key={r.id}><button className="journal-open" onClick={()=>onOpen(r.id)}><h3>{r.title||"Untitled journal"}</h3><p>{pagesFor(r).length} notebook pages</p><span>Open journal →</span></button><button className="journal-delete text-button danger" aria-label={`Delete journal ${r.title||"Untitled journal"}`} onClick={()=>onDelete(r.id)} title="Delete journal">⌫</button></article>)}</div>
    {!visible.length&&<div className="card empty"><h3>{query?"No matching journals":"Your journals will appear here."}</h3><p>{query?"Try another search.":"Start a journal for your notes, sketches and photos."}</p></div>}
  </section>;
}
