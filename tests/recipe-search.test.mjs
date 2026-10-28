import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesRecipe } from '../src/recipeSearch.ts';
import { rotateSticker, validStickers } from '../src/stickers.ts';
test('search handles accents, punctuation and words in any order across fields', () => {
 const r={title:'Crêpes & cottage cheese',category:'Breakfast',ingredients:'red lentils',steps:'Blend',notes:'thick batter'};
 assert.equal(matchesRecipe(r,'  LENTILS crepes '),true);
 assert.equal(matchesRecipe(r,'cottage, batter'),true);
 assert.equal(matchesRecipe(r,'chicken'),false);
 assert.equal(matchesRecipe(r,' '),true);
});
test('rotation wraps and rotated stickers survive validation',()=>{
 assert.equal(rotateSticker(170,Math.PI/2),-100);
 assert.equal(validStickers([{id:'a',kind:'cupcake',x:20,y:20,size:12,rotation:90}]),true);
 assert.equal(validStickers([{id:'a',kind:'cupcake',x:20,y:20,size:12,rotation:181}]),false);
});
