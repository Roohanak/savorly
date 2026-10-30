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

test('nutrition uses exactly five servings and the same scaled batch as the preview',async()=>{
 const {scaleIngredients}=await import('../src/recipeScaling.ts');
 const ingredients=scaleIngredients('2 eggs\n200 ml milk\n30 g sugar',5/2);
 assert.equal(ingredients,'5 eggs\n500 ml milk\n75 g sugar');
 const request=buildRequest('nutrition',{title:'Custard',servings:5,ingredients,steps:'Bake'},'test');
 const input=JSON.parse(request.messages[1].content);
 assert.equal(input.servings,5);assert.equal(input.ingredients,ingredients);
 assert.match(request.messages[0].content,/EXACT stated servings/);
});
test('incomplete nutrition does not display an invented half-batch assumption',()=>{
 const result=parseNutrition(JSON.stringify({...estimate,missing:['Amount of milk?'],assumptions:['Half the recipe is one serving']}));
 assert.deepEqual(result.assumptions,[]);assert.equal(result.calories,null);
});
test('companion answers a supplied question and separates cooking suggestions from nutrition',()=>{
 const recipe={title:'Custard',servings:5,ingredients:'eggs and milk',steps:''};
 const request=buildRequest('question',recipe,'test','Suggest amounts for five servings');
 assert.equal(request.messages.at(-1).content,'Suggest amounts for five servings');
 assert.match(request.messages[0].content,/untested suggestion/);
 assert.match(request.messages[0].content,/Nutrition tool/);
 assert.throws(()=>buildRequest('question',recipe,'test',''));
});

test('batch scaling keeps section headings and scales quantified bullet ingredients',async()=>{
 const {scaleIngredients}=await import('../src/recipeScaling.ts');
 assert.equal(scaleIngredients('For custard:\n- 2 eggs\n* 1/2 cup milk\nsugar (amount missing)',2),'For custard:\n- 4 eggs\n* 1 cup milk\nsugar (amount missing)');
});

test('unquantified custard is blocked before AI, including pasted headings and bullets',async()=>{
 const {missingIngredientAmounts}=await import('../src/ingredientAmounts.ts');
 assert.equal(missingIngredientAmounts('white sugar; whole eggs; egg yolks; sugar; whole milk; sweetened condensed milk').length,6);
 assert.equal(missingIngredientAmounts('For the Caramel:\n- white sugar\nFor the Custard:\n- whole eggs').length,2);
 assert.deepEqual(missingIngredientAmounts('3 eggs\n500 ml milk\n1/2 cup sugar\nSalt to taste'),[]);
});
