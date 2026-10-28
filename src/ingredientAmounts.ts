// Check recorded quantities before asking a model to estimate nutrients.
export function missingIngredientAmounts(text: string): string[] {
  const number = /(?:\d|[¼½¾⅓⅔⅛⅜⅝⅞]|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|a|an)\b)/i;
  const lines = text.split(/\n|;|\s+-\s+/).map(line => line.replace(/^.*?:\s*/, "").replace(/^[\s\p{S}\p{P}]+/u, "").trim()).filter(Boolean);
  return [...new Set(lines.filter(line => !number.test(line) && !/\b(?:to taste|as needed|optional)\b/i.test(line)).map(line => `Amount of ${line}?`))].slice(0,15);
}
