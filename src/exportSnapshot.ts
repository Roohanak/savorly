import type { Recipe } from "./model";
import { pagesFor } from "./notebook.ts";

// Resolve after the PDF module loads: edits may arrive while it is loading.
export function exportSnapshot(latest: Recipe | undefined, pageId?: string) {
  if (!latest || latest.deletedAt) throw new Error("This notebook was removed. Open an existing notebook to export it.");
  const recipe = structuredClone(latest);
  const page = pageId ? pagesFor(recipe).find(p => p.id === pageId) : undefined;
  if (pageId && !page) throw new Error("This page was removed. Select a current page before exporting.");
  return { recipe, page };
}
