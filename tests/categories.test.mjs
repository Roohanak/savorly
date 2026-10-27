import test from "node:test";
import assert from "node:assert/strict";
import { categoryOptions, sameCategory } from "../src/categories.ts";
import { validatePlans } from "../src/planner.ts";
import { parseBackup } from "../src/model.ts";
test("category choices include defaults and unique custom names", () => {
  const names = categoryOptions([
    "soups",
    " Family favorites ",
    "Family favorites",
  ]);
  assert.ok(names.includes("Soups"));
  assert.ok(names.includes("Bread"));
  assert.ok(names.includes("Chicken"));
  assert.equal(
    names.filter((n) => sameCategory(n, "Family favorites")).length,
    1,
  );
});
test("custom recipe subcategory and written sticky notes survive backup", () => {
  const recipe = {
    id: "r",
    title: "Soup",
    category: "Family favorites",
    subcategory: "Winter lunches",
    servings: 2,
    ingredients: "1 cup lentils",
    steps: "Simmer",
    notes: "",
    attempts: [],
  };
  const plan = {
    week: "2026-10-26",
    meals: [],
    notes: "",
    customShopping: [],
    shoppingChecked: [],
    stickyNotes: { Produce: "Tomatoes\nBasil", Pantry: "Check the flour" },
  };
  const backup = { version: 2, recipes: [recipe], photos: [], planner: [plan] };
  assert.deepEqual(parseBackup(backup), backup);
  assert.throws(() =>
    parseBackup({ ...backup, recipes: [{ ...recipe, subcategory: 4 }] }),
  );
  assert.throws(() =>
    validatePlans([{ ...plan, stickyNotes: { Unknown: "bad key" } }]),
  );
  assert.throws(() =>
    validatePlans([{ ...plan, stickyNotes: { Produce: 42 } }]),
  );
});
