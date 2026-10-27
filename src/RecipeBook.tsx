import { useState } from "react";
import type { Recipe } from "./model";
import { categoryOptions, sameCategory } from "./categories";
export default function RecipeBook({
  recipes,
  openRecipe,
}: {
  recipes: Recipe[];
  openRecipe: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const saved = recipes.filter((r) => r.ingredients.trim() || r.steps.trim());
  const categories = categoryOptions(saved.map((r) => r.category));
  const subs = [
    ...new Set(
      saved
        .filter((r) => sameCategory(r.category, category))
        .map((r) => r.subcategory?.trim())
        .filter((s): s is string => Boolean(s)),
    ),
  ];
  const visible = saved.filter(
    (r) =>
      (!category || sameCategory(r.category, category)) &&
      (!subcategory || sameCategory(r.subcategory ?? "", subcategory)) &&
      `${r.title} ${r.category} ${r.subcategory ?? ""} ${r.ingredients}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <section className="recipe-library" aria-label="Saved recipes">
      <div className="recipe-library-toolbar">
        <h2>
          All saved recipes <span>{saved.length}</span>
        </h2>
        <label>
          Search recipes
          <input
            type="search"
            placeholder="Find a recipe or ingredient…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <nav className="recipe-category-tabs" aria-label="Recipe categories">
        <button
          type="button"
          aria-pressed={!category}
          onClick={() => {
            setCategory("");
            setSubcategory("");
          }}
        >
          All recipes <span>{saved.length}</span>
        </button>
        {categories.map((c) => (
          <button
            type="button"
            key={c}
            aria-pressed={sameCategory(category, c)}
            onClick={() => {
              setCategory(c);
              setSubcategory("");
            }}
          >
            {c}{" "}
            <span>
              {saved.filter((r) => sameCategory(r.category, c)).length}
            </span>
          </button>
        ))}
      </nav>
      <p className="category-help">
        Choose a category, or open a recipe to create your own category and
        subcategory.
      </p>
      {category && subs.length > 0 && (
        <nav
          className="recipe-subcategory-tabs"
          aria-label="Recipe subcategories"
        >
          <span>{category} /</span>
          <button
            type="button"
            aria-pressed={!subcategory}
            onClick={() => setSubcategory("")}
          >
            All
          </button>
          {subs.map((s) => (
            <button
              type="button"
              key={s}
              aria-pressed={sameCategory(subcategory, s)}
              onClick={() => setSubcategory(s)}
            >
              {s}
            </button>
          ))}
        </nav>
      )}
      <p className="recipe-filter-count">
        {visible.length} {visible.length === 1 ? "recipe" : "recipes"}
        {category ? ` in ${category}` : ""}
        {subcategory ? ` / ${subcategory}` : ""}
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
              {r.category || "My recipes"}
              {r.subcategory ? ` / ${r.subcategory}` : ""}
            </span>
            <h3>{r.title || "Untitled recipe"}</h3>
            <span>
              {r.servings} servings ·{" "}
              {r.ingredients.split("\n").filter((s) => s.trim()).length}{" "}
              ingredients
            </span>
            <span className="recipe-card-action">
              View ingredients & method →
            </span>
          </button>
        ))}
      </div>
      {!visible.length && (
        <div className="card empty">
          <h3>
            {saved.length
              ? "No recipes here yet."
              : "Your saved recipes will appear here."}
          </h3>
          <p>
            {category
              ? `Open a saved recipe and set its category to ${category}, or try another filter.`
              : saved.length
                ? "Try another name or ingredient."
                : "Add ingredients to an experiment, or save an AI recipe draft to your Recipe Book."}
          </p>
          {(category || query) && (
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setSubcategory("");
                setQuery("");
              }}
            >
              Show all recipes
            </button>
          )}
        </div>
      )}
    </section>
  );
}
