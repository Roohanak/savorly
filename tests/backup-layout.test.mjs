import test from 'node:test';
import assert from 'node:assert/strict';
import {remapPhotoReferences} from '../src/backupLayout.ts';
import {parseBackup} from '../src/model.ts';
test('restore remaps photo placement keys as well as photo IDs, retaining rotation and conversation',()=>{
 const box={x:10,y:20,width:25,height:30,rotation:45};
 const recipe={id:'r',title:'Photo test',category:'',servings:2,ingredients:'',steps:'',notes:'',attempts:[],journalPages:[{id:'p',title:'Page',template:'blank',paper:'plain',text:'',strokes:[],photoIds:['old'],photoLayout:{old:box}}],conversation:[{id:'m',role:'user',content:'Hello'}]};
 const remapped=remapPhotoReferences([recipe],new Map([['old','new']]));
 assert.equal(remapped[0].journalPages[0].photoIds[0],'new');assert.deepEqual(remapped[0].journalPages[0].photoLayout,{new:box});
 assert.deepEqual(recipe.journalPages[0].photoLayout,{old:box});
 const backup={version:2,recipes:remapped,photos:[{id:'new',name:'photo.png',data:'data:image/png;base64,YWJj'}]};assert.deepEqual(parseBackup(backup),backup);
 assert.throws(()=>remapPhotoReferences([recipe],new Map()),/missing/);
});
