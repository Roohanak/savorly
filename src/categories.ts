export const defaultCategories = [
  "Breakfast",
  "Soups",
  "Bread",
  "Chicken",
  "Meat",
  "Fish & seafood",
  "Vegetarian",
  "Pasta & rice",
  "Salads",
  "Desserts",
  "Drinks",
  "Snacks",
];
export const defaultSubcategories: Record<string, string[]> = {
  Breakfast: ["Eggs", "Pancakes & crepes", "Oats"],
  Soups: ["Creamy", "Brothy", "Lentil & bean", "Stews"],
  Bread: ["Sourdough", "Flatbread", "Quick bread", "Sweet bread"],
  Chicken: ["Curries", "Baked", "Grilled", "One-pot"],
  Meat: ["Beef", "Lamb", "Pork"],
  "Fish & seafood": ["Fish", "Shrimp", "Shellfish"],
  Vegetarian: ["Beans & lentils", "Vegetables", "Tofu"],
  "Pasta & rice": ["Pasta", "Rice", "Noodles"],
  Salads: ["Green salads", "Grain salads", "Dressings"],
  Desserts: ["Cakes", "Cookies", "Puddings", "Frozen"],
  Drinks: ["Hot drinks", "Cold drinks", "Smoothies"],
  Snacks: ["Savory", "Sweet", "Dips"],
};
export function categoryOptions(values: string[]) {
  const seen = new Set<string>();
  return [...defaultCategories, ...values]
    .map((s) => s.trim())
    .filter((s) => {
      const key = s.toLowerCase();
      if (!s || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
export function sameCategory(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
