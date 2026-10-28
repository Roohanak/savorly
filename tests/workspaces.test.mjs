import test from 'node:test';
import assert from 'node:assert/strict';
import { splitLegacyRecords, migrateWorkspaces, workspaceKeys } from '../src/workspaces.ts';
import { newNotebookPage } from '../src/notebook.ts';
import { parseBackup } from '../src/model.ts';
const base={id:'mixed',title:'My book',category:'',servings:2,ingredients:'2 eggs',steps:'Cook',notes:'Cooking notes',attempts:[]};
function store(initial={}) {const data=new Map(Object.entries(initial));return {getItem:k=>data.get(k)??null,setItem:(k,v)=>{data.set(k,v);},removeItem:k=>{data.delete(k);}};}
test('mixed notebooks split toddler pages and cooking pages without mutating the original',()=>{
 const kitchen={...newNotebookPage('blank'),text:'Kitchen note'},baby={...newNotebookPage('toddler-notes'),text:'First words'};
 const original={...base,journalPages:[kitchen,baby]};const before=structuredClone(original);
 const split=splitLegacyRecords([original]);
 assert.deepEqual(original,before);
 assert.deepEqual(split.cooking[0].journalPages,[kitchen]);
 assert.deepEqual(split.toddler[0].journalPages,[baby]);
 assert.equal(split.toddler[0].notes,'');assert.equal(split.toddler[0].ingredients,'');
 assert.equal(split.cooking[0].notes,'Cooking notes');
});
test('a toddler-only notebook moves completely out of the cooking list',()=>{
 const r={...base,ingredients:'',steps:'',notes:'',journalPages:[newNotebookPage('toddler')]};
 const split=splitLegacyRecords([r]);assert.equal(split.cooking.length,0);assert.equal(split.toddler.length,1);
});
test('workspace recipe/planner keys differ while cooking uses legacy keys',()=>{
 const cooking=workspaceKeys('cooking'),baby=workspaceKeys('toddler');
 assert.equal(cooking.recipes,'savorly-recipes-v1');assert.equal(cooking.planner,'savorly-planner-v1');
 for(const key of ['recipes','planner','week'])assert.notEqual(cooking[key],baby[key]);
 const s=store();s.setItem(cooking.planner,'COOKING');s.setItem(baby.planner,'TODDLER');assert.equal(s.getItem(cooking.planner),'COOKING');
});
test('migration is idempotent and retains original recovery data without copying meal plans',()=>{
 const records=[{...base,journalPages:[newNotebookPage('blank'),newNotebookPage('toddler-sketch')]}];
 const raw=JSON.stringify(records);const s=store({'savorly-recipes-v1':raw,'savorly-planner-v1':'[]'});
 assert.equal(migrateWorkspaces(s),'');const cooking=s.getItem(workspaceKeys('cooking').recipes),baby=s.getItem(workspaceKeys('toddler').recipes);
 assert.equal(migrateWorkspaces(s),'');assert.equal(s.getItem(workspaceKeys('cooking').recipes),cooking);assert.equal(s.getItem(workspaceKeys('toddler').recipes),baby);
 assert.equal(JSON.parse(s.getItem('savorly-before-workspace-split-v1')).recipes,raw);
 assert.equal(s.getItem(workspaceKeys('toddler').planner),null);
});
test('failed migration restores original records and never marks separation complete',()=>{
 const raw=JSON.stringify([{...base,journalPages:[newNotebookPage('toddler')]}]);const s=store({'savorly-recipes-v1':raw});const write=s.setItem;
 s.setItem=(key,value)=>{if(key===workspaceKeys('toddler').recipes)throw Error('Full');write(key,value);};
 assert.match(migrateWorkspaces(s),/could not/);assert.equal(s.getItem('savorly-recipes-v1'),raw);assert.equal(s.getItem('savorly-workspace-split-v1'),null);
});
test('backup workspace identity survives validation and unknown workspaces are rejected',()=>{
 const backup={version:2,workspace:'toddler',recipes:[{...base,journalPages:[newNotebookPage('toddler')]}],photos:[]};
 assert.deepEqual(parseBackup(JSON.parse(JSON.stringify(backup))),backup);
 assert.throws(()=>parseBackup({...backup,workspace:'unknown'}),/workspace/);
});
