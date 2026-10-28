import { exportSnapshot } from "./exportSnapshot";
import { useState } from "react";
import type { NotebookPage } from "./notebook";
import type { Recipe } from "./model";
import type { WeekPlan } from "./planner";
export default function PdfExportButton({
  recipe,
  notebook = false,
  page,
  weeks,
  week,
  recipes,
  appearance,
  getRecipe,
}: {
  recipe: Recipe;
  notebook?: boolean;
  page?: NotebookPage;
  weeks?: WeekPlan[];
  week?: string;
  recipes?: Recipe[];
  appearance?: string;
  getRecipe?: () => Recipe | undefined;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <span className="pdf-export-control">
      <button
        className="pdf-save-button primary"
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMessage("");
          try {
            const pdf = await import("./pdfExport");
            const current = exportSnapshot(getRecipe ? getRecipe() : recipe, page?.id);
            if (notebook || page)
              await pdf.exportNotebook(current.recipe, weeks, week, recipes, current.page, appearance);
            else await pdf.exportRecipe(current.recipe, appearance);
            setMessage("PDF downloaded. Your original stays editable.");
          } catch (e) {
            setMessage(
              e instanceof Error ? e.message : "Could not create the PDF.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy
          ? "Preparing PDF…"
          : page
            ? "↓ Save this page PDF"
            : notebook
            ? `↓ Save all ${recipe.journalPages?.length ?? 1} pages PDF`
            : "↓ Save recipe PDF"}
      </button>
      {message && (
        <small role="status" className="pdf-export-message">
          {message}
        </small>
      )}
    </span>
  );
}
