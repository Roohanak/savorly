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
}: {
  recipe: Recipe;
  notebook?: boolean;
  page?: NotebookPage;
  weeks?: WeekPlan[];
  week?: string;
  recipes?: Recipe[];
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
            if (notebook || page)
              await pdf.exportNotebook(recipe, weeks, week, recipes, page);
            else await pdf.exportRecipe(recipe);
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
            ? "↓ Save notebook PDF"
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
