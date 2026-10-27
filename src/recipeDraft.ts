export type RecipeDraft = {
  title: string;
  servings: number;
  ingredients: string;
  steps: string;
  notes: string;
};
export function parseRecipeDraft(
  text: string,
  fallback: { title: string; servings: number },
): RecipeDraft {
  const draft: RecipeDraft = {
    title: fallback.title,
    servings: fallback.servings,
    ingredients: "",
    steps: "",
    notes: "",
  };
  let section: "ingredients" | "steps" | "notes" | null = null;
  let titleNext = false;
  for (const raw of text.split("\n")) {
    const line = raw.trim().replace(/\*\*/g, "");
    const label = line
      .replace(/^#{1,6}\s*/, "")
      .replace(/:$/, "")
      .toLowerCase();
    const serving = line.match(/^servings\s*:\s*(\d+)/i);
    if (serving) {
      draft.servings = Math.max(1, Math.min(100, Number(serving[1])));
      continue;
    }
    if (/^title\s*:/i.test(line)) {
      draft.title = line.replace(/^title\s*:\s*/i, "");
      continue;
    }
    if (label === "title") {
      titleNext = true;
      section = null;
      continue;
    }
    if (/^ingredients(?:\s*\([^)]*\))?$/.test(label)) {
      section = "ingredients";
      continue;
    }
    if (/^(method|steps|instructions)(?:\s*\([^)]*\))?$/.test(label)) {
      section = "steps";
      continue;
    }
    if (
      /^(next attempt|kitchen notes|notes|suggestions|missing information)/.test(
        label,
      )
    ) {
      section = "notes";
      continue;
    }
    if (/^#\s/.test(raw.trim()) && section === null) {
      draft.title =
        label === "title" ? fallback.title : line.replace(/^#+\s*/, "");
      continue;
    }
    if (titleNext && line) {
      draft.title = line;
      titleNext = false;
      continue;
    }
    if (section && line) {
      draft[section] +=
        (draft[section] ? "\n" : "") +
        line.replace(/^(?:[-*•]|\d+[.)])\s+/, "");
    }
  }
  return draft;
}
