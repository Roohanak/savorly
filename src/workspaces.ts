import type { Recipe } from "./model";
import { validateRecipes } from "./model.ts";
export type Workspace = "cooking" | "toddler";
export function workspaceKeys(workspace: Workspace) {
  return workspace === "toddler"
    ? {recipes:"savorly-toddler-recipes-v1",planner:"savorly-toddler-planner-v1",week:"savorly-toddler-planner-week"}
    : {recipes:"savorly-recipes-v1",planner:"savorly-planner-v1",week:"savorly-planner-week"};
}
export function splitLegacyRecords(records: Recipe[]) {
  const cooking: Recipe[] = [], toddler: Recipe[] = [];
  for (const record of records) {
    const baby = record.journalPages?.filter(p=>p.template.startsWith("toddler")) ?? [];
    if (!baby.length) { cooking.push(record); continue; }
    const other = record.journalPages?.filter(p=>!p.template.startsWith("toddler")) ?? [];
    if (other.length || record.ingredients.trim() || record.steps.trim() || record.notes.trim() || record.attempts.length || record.recipeBook || record.photoIds?.length)
      cooking.push({...record,title:record.title+" (cooking pages)",journalPages:other});
    toddler.push({...record,journalPages:baby,ingredients:"",steps:"",notes:"",attempts:[],photoIds:[],recipeBook:false});
  }
  return {cooking,toddler};
}
type Store = Pick<Storage,"getItem"|"setItem"|"removeItem">;
export function migrateWorkspaces(store: Store) {
  const marker="savorly-workspace-split-v1", original="savorly-before-workspace-split-v1";
  if (store.getItem(marker)) return "";
  const cookingKey=workspaceKeys("cooking").recipes,toddlerKey=workspaceKeys("toddler").recipes;
  const raw=store.getItem(cookingKey),existing=store.getItem(toddlerKey);
  try {
    const records: unknown=raw ? JSON.parse(raw) : [];
    validateRecipes(records);
    const split=splitLegacyRecords(records);
    const previous: unknown=existing ? JSON.parse(existing):[];
    validateRecipes(previous);
    const ids=new Set(previous.map(r=>r.id));
    const next=[...previous,...split.toddler.filter(r=>!ids.has(r.id))];
    if (!store.getItem(original)) store.setItem(original,JSON.stringify({recipes:raw,planner:store.getItem(workspaceKeys("cooking").planner)}));
    store.setItem(toddlerKey,JSON.stringify(next));
    if (raw) store.setItem(cookingKey,JSON.stringify(split.cooking));
    store.setItem(marker,"1");
    return "";
  } catch {
    try { if(raw===null)store.removeItem(cookingKey);else store.setItem(cookingKey,raw);if(existing===null)store.removeItem(toddlerKey);else store.setItem(toddlerKey,existing); } catch { /* Original recovery copy is retained. */ }
    return "Workspace separation could not be saved. Your original data was kept. Free browser storage and reload before creating more entries.";
  }
}
