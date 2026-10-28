import { missingIngredientAmounts } from "./ingredientAmounts";
import { useEffect, useRef, useState } from "react";
import type { Recipe } from "./model";
import { parseNutrition } from "./nutrition";
import type { NutritionEstimate } from "./nutrition";
export default function NutritionPanel({recipe,onOpenCompanion}:{recipe:Recipe;onOpenCompanion:()=>void}) {
  const [result,setResult]=useState<NutritionEstimate|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const request=useRef<AbortController|null>(null);
  useEffect(()=>()=>request.current?.abort(),[]);
  async function estimate(){
    if(!recipe.ingredients.trim()){setError("Add ingredients with quantities first.");return;}
    const missing = missingIngredientAmounts(recipe.ingredients);
    if (missing.length) {setError("");setResult({calories:null,proteinG:null,carbsG:null,fatG:null,assumptions:[],missing});return;}
    const controller=new AbortController();request.current?.abort();request.current=controller;
    setBusy(true);setError("");setResult(null);
    try {
      const response=await fetch("/api/assist",{method:"POST",signal:controller.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"nutrition",recipe:{title:recipe.title,servings:recipe.servings,ingredients:recipe.ingredients,steps:recipe.steps}})});
      const data=await response.json();if(!response.ok||!data.text)throw Error(data.error||"Could not estimate nutrition.");
      if(!controller.signal.aborted)setResult(parseNutrition(data.text));
    }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Nutrition service unavailable. Start the AI server and try again.");}
    finally{if(!controller.signal.aborted)setBusy(false);}
  }
  return <section className="nutrition-panel" aria-label="Estimated recipe nutrition"><div className="recipe-library-toolbar"><h3>Nutrition per serving · {recipe.servings} servings</h3><button type="button" onClick={()=>void estimate()} disabled={busy}>{busy?"Estimating…":"✧ Estimate calories & macros"}</button></div>
    <p className="nutrition-note">Uses the scaled ingredient preview above for a batch of {recipe.servings} servings; one serving is 1/{recipe.servings} of that batch. AI estimate from ingredient quantities and method. Not a verified nutrition label. Brands, cooking losses and portion sizes can change the result. Uses your configured AI provider.</p>
    {error&&<p role="alert">{error}</p>}
    {result&&<div role="status">{result.missing.length?<><strong>Add ingredient amounts to calculate nutrition</strong><p>{recipe.servings} servings sets the portions, but calories also need the amount of each ingredient. Update the ingredient list, then estimate again.</p><ul>{result.missing.map((v,i)=><li key={i}>{v}</li>)}</ul><button type="button" onClick={onOpenCompanion}>Ask Companion for suggested quantities →</button></>:<div className="nutrition-grid">{[["Calories",result.calories,"kcal"],["Protein",result.proteinG,"g"],["Carbs",result.carbsG,"g"],["Fat",result.fatG,"g"]].map(([label,value,unit])=><div key={String(label)}><span>{label}</span><strong>≈ {Math.round(Number(value))} {unit}</strong></div>)}</div>}{result.assumptions.length>0&&<><strong>Assumptions</strong><ul>{result.assumptions.map((v,i)=><li key={i}>{v}</li>)}</ul></>}</div>}
  </section>;
}
