import type { Recipe } from "./model";
export type Meal = {
  id: string;
  date: string;
  slot: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  recipeId?: string;
  label: string;
  servings: number;
  cooked: boolean;
};
export type WeekPlan = {
  week: string;
  meals: Meal[];
  notes: string;
  stickyNotes?: Record<string, string>;
  customShopping: string[];
  shoppingChecked: string[];
};
export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function shiftDate(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  return dateKey(new Date(y, m - 1, d + days, 12));
}
export function monday(date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dateKey(d);
}
function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const [y, m, d] = value.split("-").map(Number);
  return dateKey(new Date(y, m - 1, d, 12)) === value;
}
export function validatePlans(value: unknown): asserts value is WeekPlan[] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (w) =>
        w &&
        validDate(w.week) &&
        typeof w.notes === "string" &&
        (w.stickyNotes === undefined ||
          (typeof w.stickyNotes === "object" &&
            w.stickyNotes !== null &&
            !Array.isArray(w.stickyNotes) &&
            Object.keys(w.stickyNotes).length <= 4 &&
            Object.entries(w.stickyNotes).every(
              ([key, value]) =>
                groceryGroups.includes(key as (typeof groceryGroups)[number]) &&
                typeof value === "string" &&
                value.length <= 10000,
            ))) &&
        Array.isArray(w.customShopping) &&
        w.customShopping.every((s: unknown) => typeof s === "string") &&
        Array.isArray(w.shoppingChecked) &&
        w.shoppingChecked.every((s: unknown) => typeof s === "string") &&
        Array.isArray(w.meals) &&
        w.meals.every(
          (m: Meal) =>
            m &&
            typeof m.id === "string" &&
            validDate(m.date) &&
            m.date >= w.week &&
            m.date <= shiftDate(w.week, 6) &&
            ["Breakfast", "Lunch", "Dinner", "Snack"].includes(m.slot) &&
            typeof m.label === "string" &&
            (m.recipeId === undefined || typeof m.recipeId === "string") &&
            Number.isFinite(m.servings) &&
            m.servings >= 1 &&
            m.servings <= 100 &&
            typeof m.cooked === "boolean",
        ),
    ) ||
    new Set(value.map((w) => w.week)).size !== value.length
  )
    throw new Error("Invalid planner backup.");
}
export function loadPlans(storageKey = "savorly-planner-v1"): WeekPlan[] {
  try {
    const plans = JSON.parse(
      localStorage.getItem(storageKey) ?? "[]",
    );
    validatePlans(plans);
    return plans;
  } catch {
    return [];
  }
}
function amount(text: string) {
  return text.split(/\s+/).reduce((sum, part) => {
    const [a, b] = part.split("/").map(Number);
    return sum + (b ? a / b : a);
  }, 0);
}
export function shoppingFor(
  plan: WeekPlan,
  recipes: Recipe[],
  remainingOnly = true,
) {
  const items = new Map<
    string,
    { id: string; name: string; quantity: number | null }
  >();
  for (const meal of plan.meals.filter((m) => !remainingOnly || !m.cooked)) {
    const recipe = recipes.find((r) => r.id === meal.recipeId);
    if (!recipe) continue;
    for (const raw of recipe.ingredients
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)) {
      const line = raw
        .replace(/½/g, "0.5")
        .replace(/¼/g, "0.25")
        .replace(/¾/g, "0.75");
      const match = line.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)\s+(.+)$/);
      const name = match ? match[2] : line,
        id = "ingredient:" + name.toLowerCase().replace(/\s+/g, " ");
      const quantity = match
        ? (amount(match[1]) * meal.servings) / recipe.servings
        : null;
      const existing = items.get(id);
      items.set(id, {
        id,
        name,
        quantity:
          existing?.quantity !== null &&
          existing?.quantity !== undefined &&
          quantity !== null
            ? existing.quantity + quantity
            : quantity,
      });
    }
  }
  return [...items.values()].map((i) => ({
    id: i.id,
    label:
      i.quantity === null
        ? i.name
        : `${Math.round(i.quantity * 100) / 100} ${i.name}`,
  }));
}

export const groceryGroups = [
  "Produce",
  "Dairy & protein",
  "Pantry",
  "Other",
] as const;
export function groceryGroup(label: string): (typeof groceryGroups)[number] {
  if (
    /\b(apple|banana|berry|berries|lemon|lime|onion|garlic|tomato|potato|spinach|carrot|lettuce|avocado|pepper|broccoli|fruit|vegetable|herb|cucumber|mushroom|ginger|basil|parsley|cilantro)s?\b/i.test(
      label,
    )
  )
    return "Produce";
  if (
    /\b(milk|cheese|yogurt|yoghurt|cream|butter|egg|chicken|beef|fish|salmon|tuna|turkey|pork|tofu|shrimp)s?\b/i.test(
      label,
    )
  )
    return "Dairy & protein";
  if (
    /\b(flour|lentil|rice|pasta|noodle|oat|bean|salt|sugar|oil|cumin|spice|bread|honey|cinnamon|baking|nut|seed|cereal|sauce|water)s?\b/i.test(
      label,
    )
  )
    return "Pantry";
  return "Other";
}
