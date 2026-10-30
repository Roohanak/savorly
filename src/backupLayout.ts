import type { Recipe } from "./model";
export function remapPhotoReferences(recipes:Recipe[],mapping:Map<string,string>):Recipe[]{
 const id=(value:string)=>{const next=mapping.get(value);if(!next)throw Error("A photo is missing from the restore mapping.");return next;};
 return recipes.map(r=>({...r,photoIds:r.photoIds?.map(id),journalPages:r.journalPages?.map(p=>({...p,photoIds:p.photoIds?.map(id),...(p.photoLayout?{photoLayout:Object.fromEntries(Object.entries(p.photoLayout).map(([key,box])=>[id(key),box]))}:{})})),attempts:r.attempts.map(a=>({...a,photoIds:a.photoIds?.map(id)}))}));
}
