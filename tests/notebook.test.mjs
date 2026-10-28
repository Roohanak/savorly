import test from 'node:test'
import assert from 'node:assert/strict'
import { newNotebookPage, pagesFor, touchesStroke, templateDesign, templates } from '../src/notebook.ts'
import { newId } from '../src/id.ts'
import { parseBackup, photoIdsFor } from '../src/model.ts'
const recipe = { id:'test', title:'Crepe', category:'Breakfast', servings:2, ingredients:'', steps:'', notes:'Original messy notes', attempts:[] }
const stroke = { id:'ink', color:'#344638', width:3, points:[{x:10,y:10,pressure:0.5},{x:300,y:300,pressure:0.8}] }
test('legacy kitchen notes appear without changing the original recipe',()=> {
  assert.equal(pagesFor(recipe)[0].text,recipe.notes)
  assert.equal(recipe.journalPages,undefined)
})
test('templates create independent editable pages',()=> {
  const first=newNotebookPage('experiment'), second=newNotebookPage('experiment')
  assert.notEqual(first.id,second.id)
  assert.equal(first.text,'')
  assert.equal(templateDesign(first.template).fields.some(f=>f.id==='ingredients'),true)
  first.strokes.push(stroke)
  assert.equal(second.strokes.length,0)
})
test('eraser detects the segment between sampled pen points',()=> {
  assert.equal(touchesStroke(stroke,{x:150,y:151,pressure:0.5}),true)
  assert.equal(touchesStroke(stroke,{x:150,y:400,pressure:0.5}),false)
})
test('backup preserves notebook text, ink, paper and page photos',()=> {
  const page={...newNotebookPage('ideas'),text:'My recipe idea',strokes:[stroke],photoIds:['photo']}
  const data={version:2,recipes:[{...recipe,journalPages:[page]}],photos:[{id:'photo',name:'dish.jpg',data:'data:image/jpeg;base64,YWJj'}]}
  assert.deepEqual(parseBackup(JSON.parse(JSON.stringify(data))),data)
  assert.deepEqual(photoIdsFor(data.recipes),['photo'])
})
test('malformed or unsafe handwriting data cannot replace a journal',()=> {
  const page={...newNotebookPage(),strokes:[{...stroke,color:'url(https://example.com)'}]}
  assert.throws(()=>parseBackup([{...recipe,journalPages:[page]}]),/valid/)
  const bad={...stroke,points:[{x:-2,y:0,pressure:0.5}]}
  assert.throws(()=>parseBackup([{...recipe,journalPages:[{...page,strokes:[bad]}]}]),/valid/)
})
test('templates have distinct colors and working page formats',()=> {
  assert.equal(templates.length,10)
  assert.equal(new Set(templates.map(t=>templateDesign(t.id).color)).size,templates.length)
  assert.equal(new Set(templates.map(t=>templateDesign(t.id).format)).size,templates.length)
  assert.equal(templateDesign('weekly').fields.filter(f=>!f.wide).length,7)
})
test('page colors and typed template fields survive a backup round trip',()=> {
  const page={...newNotebookPage('baking'),color:'#fff8dc',fields:{temperature:'180 C',weights:'200g flour'},strokes:[stroke]}
  const data={version:2,recipes:[{...recipe,journalPages:[page]}],photos:[]}
  assert.deepEqual(parseBackup(JSON.parse(JSON.stringify(data))),data)
  assert.throws(()=>parseBackup([{...recipe,journalPages:[{...page,color:'red; background:url(x)'}]}]),/valid/)
  assert.throws(()=>parseBackup([{...recipe,journalPages:[{...page,fields:{temperature:42}}]}]),/valid/)
})
test('ID generation works when randomUUID is unavailable on a local-network page',()=> {
  const httpCrypto={getRandomValues:array=>globalThis.crypto.getRandomValues(array)}
  const id=newId(httpCrypto)
  assert.match(id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  assert.notEqual(id,newId(httpCrypto))
})

test('toddler pages keep their planner fields, ink and baby stickers in backups',()=>{
  const toddlerPages=['toddler','toddler-notes','toddler-sketch'].map(id=>({...newNotebookPage(id),text:'A lovely day',strokes:[stroke],stickers:[{id:'baby-'+id,kind:'baby',x:10,y:10,size:12,rotation:25}]}));
  toddlerPages[0].fields={sleep:'Nap at 1pm',meals:'Lunch at noon'};
  const data={version:2,recipes:[{...recipe,journalPages:toddlerPages}],photos:[]};
  assert.deepEqual(parseBackup(JSON.parse(JSON.stringify(data))),data);
  assert.equal(newNotebookPage('unknown-template').template,'blank');
});
