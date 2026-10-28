export function searchWords(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}
export function matchesRecipe(
  recipe: {
    title: string;
    category: string;
    subcategory?: string;
    ingredients: string;
    steps: string;
    notes: string;
  },
  query: string,
) {
  const words = searchWords(query);
  const text = searchWords(
    [
      recipe.title,
      recipe.category,
      recipe.subcategory ?? "",
      recipe.ingredients,
      recipe.steps,
      recipe.notes,
    ].join(" "),
  ).join(" ");
  return words.every((word) => text.includes(word));
}
