export function scaleIngredients(text: string, ratio: number) {
  return text
    .split("\n")
    .map((line) =>
      line.replace(
        /^(\s*(?:[-*•]\s*)?)(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)(?=\s|$)/,
        (_all, space: string, number: string) => {
          const amount = number.split(/\s+/).reduce((sum, part) => {
            const [a, b] = part.split("/").map(Number);
            return sum + (b ? a / b : a);
          }, 0);
          return space + String(Math.round(amount * ratio * 100) / 100);
        },
      ),
    )
    .join("\n");
}
