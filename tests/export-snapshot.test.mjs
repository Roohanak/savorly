import test from 'node:test';
import assert from 'node:assert/strict';
import { exportSnapshot } from '../src/exportSnapshot.ts';
import { newNotebookPage } from '../src/notebook.ts';
const base={id:'book',title:'baby zasa',category:'',servings:1,ingredients:'',steps:'',notes:'Old lentil note',attempts:[]};
test('PDF snapshot uses replaced page text, not legacy recipe notes, and stays stable during export',()=>{
 const page={...newNotebookPage('toddler-notes'),text:'Today we went to the park',fields:{memory:'First slide ride'}};
 const live={...base,journalPages:[page]};
 const snapshot=exportSnapshot(live,page.id);
 assert.equal(snapshot.page.text,'Today we went to the park');
 assert.equal(snapshot.page.fields.memory,'First slide ride');
 live.journalPages[0].text='Edited after download started';
 assert.equal(snapshot.page.text,'Today we went to the park');
 assert.equal(snapshot.recipe.journalPages[0].text,'Today we went to the park');
});
test('single-page export selects by ID and rejects removed pages instead of substituting old content',()=>{
 const first=newNotebookPage('blank'), second=newNotebookPage('toddler-sketch');
 second.text='The currently selected page';
 const live={...base,journalPages:[first,second]};
 assert.equal(exportSnapshot(live,second.id).page.text,second.text);
 assert.equal(exportSnapshot(live).recipe.journalPages.length,2);
 assert.throws(()=>exportSnapshot(live,'removed'),/removed/);
 assert.throws(()=>exportSnapshot(undefined),/removed/);
});
