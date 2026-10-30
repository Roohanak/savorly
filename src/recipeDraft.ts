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
  let servingsNext = false;
  const titleYield = text.split("\n").slice(0, 4).join(" ").match(/\((\d+)\s+servings?\)/i);
  if (titleYield) draft.servings = Math.max(1, Math.min(100, Number(titleYield[1])));
  for (const raw of text.split("\n")) {
    const line = raw.trim().replace(/\*\*/g, "");
    const label = line
      .replace(/^#{1,6}\s*/, "")
      .replace(/:$/, "")
      .toLowerCase();
    const clean = line.replace(/^#{1,6}\s*/, "");
    const serving = clean.match(/^(?:servings|serves|yield)\s*:\s*(\d+)/i) ?? (servingsNext ? clean.match(/^(\d+)\b/i) : null);
    if (serving) {
      servingsNext = false;
      draft.servings = Math.max(1, Math.min(100, Number(serving[1])));
      continue;
    }
    if (/^(?:servings|serves|yield)$/.test(label)) {
      servingsNext = true;
      section = null;
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
