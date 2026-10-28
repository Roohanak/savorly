import { useState } from "react";
import type { Recipe } from "./model";
import { categoryOptions, sameCategory } from "./categories";
import { matchesRecipe } from "./recipeSearch";
export default function RecipeBook({
  recipes,
  openRecipe,
  onCreate,
}: {
  recipes: Recipe[];
  openRecipe: (id: string) => void;
  onCreate: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const saved = recipes.filter(
    (r) => r.recipeBook || r.ingredients.trim() || r.steps.trim(),
  );
  const categories = categoryOptions(saved.map((r) => r.category));
  const subs = [
    ...new Set(
      saved
        .filter((r) => !category || sameCategory(r.category, category))
        .map((r) => r.subcategory?.trim())
        .filter((s): s is string => Boolean(s)),
    ),
  ];
  const visible = saved.filter(
    (r) =>
      (!category || sameCategory(r.category, category)) &&
      (!subcategory || sameCategory(r.subcategory ?? "", subcategory)) &&
      matchesRecipe(r, query),
  );
  function clear() {
    setQuery("");
    setCategory("");
    setSubcategory("");
  }
  return (
    <section className="recipe-library" aria-label="Saved recipes">
      <div className="recipe-library-toolbar">
        <h2>
          My recipe book <span>{saved.length}</span>
        </h2>
        <button type="button" className="primary" onClick={onCreate}>
          ＋ New recipe
        </button>
      </div>
      <div className="recipe-book-filters">
        <label className="recipe-search-field">
          Search recipes
          <input
            type="search"
            placeholder="Recipe name, ingredients, or notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSubcategory("");
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Subcategory
          <select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            disabled={!subs.length}
          >
            <option value="">All subcategories</option>
            {subs.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {(query || category || subcategory) && (
          <button type="button" onClick={clear}>
            Clear filters
          </button>
        )}
      </div>
      <p className="recipe-filter-count" role="status">
        {visible.length} {visible.length === 1 ? "recipe" : "recipes"}
        {category ? ` in ${category}` : ""}
        {subcategory ? ` / ${subcategory}` : ""}
        {query.trim() ? ` matching “${query.trim()}”` : ""}
      </p>
      <div className="saved-recipe-grid">
        {visible.map((r) => (
          <button
            className="saved-recipe-card"
            key={r.id}
            onClick={() => openRecipe(r.id)}
          >
            <span className="saved-recipe-symbol" aria-hidden="true">
              ♧
            </span>
            <span className="eyebrow">
              {r.category || "Uncategorized"}
              {r.subcategory ? ` / ${r.subcategory}` : ""}
            </span>
            <h3>{r.title || "Untitled recipe"}</h3>
            <span>
              {r.servings} servings ·{" "}
              {r.ingredients.split("\n").filter((s) => s.trim()).length}{" "}
              ingredients
            </span>
            <span className="recipe-card-action">
              {!r.ingredients.trim() && !r.steps.trim()
                ? "Finish this recipe →"
                : "View ingredients & method →"}
            </span>
          </button>
        ))}
      </div>
      {!visible.length && (
        <div className="card empty">
          <h3>
            {!saved.length
              ? "Your recipe book starts here."
              : "No matching recipes."}
          </h3>
          <p>
            {!saved.length
              ? "Create a recipe, or save an AI draft to your book."
              : "Search only looks in this recipe book. Try a different term or clear the category filters."}
          </p>
          <button
            type="button"
            className="primary"
            onClick={!saved.length ? onCreate : clear}
          >
            {!saved.length ? "＋ New recipe" : "Show all recipes"}
          </button>
        </div>
      )}
    </section>
  );
}
