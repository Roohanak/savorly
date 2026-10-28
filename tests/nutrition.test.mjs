import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNutrition } from '../src/nutrition.ts';
import { buildRequest } from '../server/assistant.mjs';
const estimate={calories:220,proteinG:12,carbsG:25,fatG:8,assumptions:['One portion is half the recipe.'],missing:[]};
test('nutrition accepts numeric estimates and suppresses numbers when essential amounts are missing',()=>{
 assert.deepEqual(parseNutrition(JSON.stringify(estimate)),estimate);
 const incomplete=parseNutrition(JSON.stringify({...estimate,missing:['How much oil?']}));
 assert.equal(incomplete.calories,null);assert.equal(incomplete.proteinG,null);assert.equal(incomplete.missing[0],'How much oil?');
});
test('nutrition rejects malformed, negative, string and incomplete results',()=>{
 for(const data of [{...estimate,calories:-1},{...estimate,proteinG:'12'},{...estimate,missing:null},{calories:100}])assert.throws(()=>parseNutrition(JSON.stringify(data)));
 assert.throws(()=>parseNutrition('not JSON'));
});
test('nutrition request excludes private journal notes and attempts and requires ingredients and servings',()=>{
 const recipe={title:'Crepes',servings:2,ingredients:'100 g lentils',steps:'Cook in a dry pan',notes:'PRIVATE BABY NOTES',attempts:[{result:'PRIVATE'}]};
 const request=buildRequest('nutrition',recipe,'test-model');
 const data=JSON.parse(request.messages[1].content);
 assert.equal(data.notes,undefined);assert.equal(data.attempts,undefined);assert.equal(data.servings,2);assert.equal(data.ingredients,recipe.ingredients);
 assert.match(request.messages[0].content,/null for ALL/);
 assert.throws(()=>buildRequest('nutrition',{...recipe,ingredients:''},'test-model'));
 assert.throws(()=>buildRequest('nutrition',{...recipe,servings:0},'test-model'));
});
