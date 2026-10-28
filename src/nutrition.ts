export type NutritionEstimate = {
  calories: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null;
  assumptions: string[]; missing: string[];
};
export function parseNutrition(text: string): NutritionEstimate {
  const data = JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
  if (!data || typeof data !== "object" || Array.isArray(data)) throw Error("No usable nutrition estimate returned. Try again.");
  for (const key of ["calories", "proteinG", "carbsG", "fatG"] as const)
    if (data[key] !== null && (typeof data[key] !== "number" || !Number.isFinite(data[key]) || data[key] < 0 || data[key] > 100000)) throw Error("The nutrition response contains invalid values. Try again.");
  for (const key of ["assumptions", "missing"] as const)
    if (!Array.isArray(data[key]) || data[key].length > 15 || !data[key].every((v: unknown)=>typeof v === "string" && v.length <= 1000)) throw Error("The nutrition response is incomplete. Try again.");
  if (data.missing.length || [data.calories,data.proteinG,data.carbsG,data.fatG].some(v=>v===null)) {
    return {calories:null,proteinG:null,carbsG:null,fatG:null,assumptions:data.assumptions,missing:data.missing.length?data.missing:["Add ingredient quantities and servings before estimating."]};
  }
  return {calories:data.calories,proteinG:data.proteinG,carbsG:data.carbsG,fatG:data.fatG,assumptions:data.assumptions,missing:[]};
}
