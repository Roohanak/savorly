import { useState } from "react";
import type { Recipe } from "./model";

export default function RecipeBook({ recipes, openRecipe }: { recipes: Recipe[]; openRecipe: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const saved = recipes.filter(r => r.ingredients.trim() || r.steps.trim());
  const visible = saved.filter(r => `${r.title} ${r.category} ${r.ingredients}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="recipe-library" aria-label="Saved recipes">
    <div className="recipe-library-toolbar"><h2>All saved recipes <span>{saved.length}</span></h2><label>Search recipes<input type="search" placeholder="Find a recipe or ingredient…" value={query} onChange={e => setQuery(e.target.value)} /></label></div>
    <div className="saved-recipe-grid">{visible.map(r => <button className="saved-recipe-card" key={r.id} onClick={() => openRecipe(r.id)}>
      <span className="saved-recipe-symbol" aria-hidden="true">♧</span><span className="eyebrow">{r.category || "My recipes"}</span><h3>{r.title || "Untitled recipe"}</h3><span>{r.servings} servings · {r.ingredients.split("\n").filter(s => s.trim()).length} ingredients</span><span className="recipe-card-action">View ingredients & method →</span>
    </button>)}</div>
    {!visible.length && <div className="card empty"><h3>{saved.length ? "No recipes match your search." : "Your saved recipes will appear here."}</h3><p>{saved.length ? "Try another name or ingredient." : "Add ingredients to an experiment, or save an AI recipe draft to your Recipe Book."}</p></div>}
  </section>;
}
