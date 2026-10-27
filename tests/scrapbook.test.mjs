import test from 'node:test';
import assert from 'node:assert/strict';
import {validStickers} from '../src/stickers.ts';
import {groceryGroup} from '../src/planner.ts';
import {parseBackup} from '../src/model.ts';
const sticker={id:'s',kind:'strawberry',x:20,y:30,size:12,rotation:-10};
test('stickers validate positions, kinds and unique IDs',()=>{
 assert.equal(validStickers([sticker]),true);
 assert.equal(validStickers([{...sticker,kind:'<script>'}]),false);
 assert.equal(validStickers([{...sticker,x:95}]),false);
 assert.equal(validStickers([{...sticker,size:Infinity}]),false);
 assert.equal(validStickers([sticker,sticker]),false);
});
test('sticker layout survives a complete journal backup',()=>{
 const data={version:2,photos:[],recipes:[{id:'r',title:'Notes',category:'',servings:2,ingredients:'',steps:'',notes:'',attempts:[],journalPages:[{id:'p',title:'Sketch',template:'blank',paper:'dots',text:'Ideas',strokes:[],stickers:[sticker]}]}]};
 assert.deepEqual(parseBackup(data),data);
 assert.throws(()=>parseBackup({...data,recipes:[{...data.recipes[0],journalPages:[{...data.recipes[0].journalPages[0],stickers:[{...sticker,y:99}]}]}]}));
});
test('grocery groups preserve ingredients while sorting labels',()=>{
 assert.equal(groceryGroup('2 cups cottage cheese'),'Dairy & protein');
 assert.equal(groceryGroup('3 apples'),'Produce');
 assert.equal(groceryGroup('1 cup lentils'),'Pantry');
 assert.equal(groceryGroup('Kitchen paper'),'Other');
});
