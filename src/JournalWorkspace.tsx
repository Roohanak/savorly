import PdfExportButton from "./PdfExportButton";
import type { WeekPlan } from "./planner";
import { useEffect, useRef, useState } from "react";
import type { Recipe } from "./model";
import type { NotebookPage } from "./notebook";
import {
  newNotebookPage,
  templates,
  pagesFor,
  templateDesign,
} from "./notebook";
import JournalCanvas from "./PenEditor";

type Props = {
  recipe: Recipe;
  onChange: (patch: Partial<Recipe>) => void;
  openTemplates: () => void;
  initialPageId?: string;
  weeks?: WeekPlan[];
  week?: string;
  recipes?: Recipe[];
};
export default function JournalWorkspace({
  recipe,
  onChange,
  openTemplates,
  initialPageId,
  weeks,
  week,
  recipes,
}: Props) {
  const pages = pagesFor(recipe);
  const [selected, setSelected] = useState(() => {
    if (initialPageId) return initialPageId;
    try {
      return (
        localStorage.getItem("savorly-last-page:" + recipe.id) ||
        pages[0]?.id ||
        ""
      );
    } catch {
      return pages[0]?.id || "";
    }
  });
  const page = pages.find((p) => p.id === selected) ?? pages[0];
  useEffect(() => {
    if (page) {
      try {
        localStorage.setItem("savorly-last-page:" + recipe.id, page.id);
      } catch {
        /* Selection memory is optional when storage is unavailable. */
      }
    }
  }, [recipe.id, page]);
  const [notice, setNotice] = useState("");
  const history = useRef<Record<string, { past: NotebookPage[]; future: NotebookPage[] }>>({});
  useEffect(() => {
    function keyboard(e: KeyboardEvent) {
      if (!page || e.defaultPrevented || !(e.ctrlKey || e.metaKey) || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.closest("input,textarea,select,[contenteditable=true]")) return;
      if (target !== document.body && !target.closest(".journal-workspace")) return;
      const undo = e.key.toLowerCase() === "z" && !e.shiftKey;
      const redo = e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey);
      if (!undo && !redo) return;
      const h = history.current[page.id];
      if (!h) return;
      const source = undo ? h.past : h.future;
      const next = source.pop();
      if (!next) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      (undo ? h.future : h.past).push(page);
      onChange({ journalPages: pages.map(p => p.id === page.id ? next : p) });
      setNotice(undo ? "Undid the last page change." : "Redid the page change.");
    }
    document.addEventListener("keydown", keyboard, true);
    return () => document.removeEventListener("keydown", keyboard, true);
  }, [page, pages, onChange]);
  function update(patch: Partial<NotebookPage>) {
    if (!page) return;
    const h = history.current[page.id] ?? { past: [], future: [] };
    history.current[page.id] = { past: [...h.past.slice(-29), page], future: [] };
    onChange({
      journalPages: pages.map((p) =>
        p.id === page.id ? { ...p, ...patch } : p,
      ),
    });
  }
  function add() {
    if (pages.length >= 200) {
      setNotice(
        "This experiment has reached 200 pages. Start a new experiment to keep writing.",
      );
      return;
    }
    const next = newNotebookPage();
    onChange({ journalPages: [...pages, next] });
    setSelected(next.id);
  }
  return (
    <section className={"journal-workspace" + (page?.template.startsWith("toddler") ? " toddler-pages" : "")}>
      <div className="notebook-heading">
        <div>
          <p className="eyebrow">{page?.template.startsWith("toddler") ? "LITTLE DAYS, LOVELY MEMORIES" : "THE MESSY PART IS THE GOOD PART"}</p>
          <label className="experiment-title">
            Experiment title
            <input
              aria-label="Experiment title"
              value={recipe.title}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </label>
        </div>
        <div className="export-actions">
          <PdfExportButton
            recipe={recipe}
            notebook
            weeks={weeks}
            week={week}
            recipes={recipes}
          />
          <button type="button" onClick={openTemplates}>
            Choose a template →
          </button>
        </div>
      </div>
      {notice && <p role="status">{notice}</p>}
      <div className="page-strip" aria-label="Notebook pages">
        {pages.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={page?.id === p.id}
            onClick={() => setSelected(p.id)}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>{" "}
            {p.title || "Untitled page"}
          </button>
        ))}
        <button type="button" onClick={add}>
          ＋ Blank page
        </button>
      </div>
      {page ? (
        <>
          <div className="notebook-page-title">
            <PdfExportButton key={page.id} recipe={recipe} page={page} weeks={weeks} week={week} recipes={recipes} />
            <label>
              Page title
              <input
                value={page.title}
                onChange={(e) => update({ title: e.target.value })}
              />
            </label>
            <button
              type="button"
              className="text-button danger"
              onClick={() => {
                if (
                  confirm(
                    `Delete “${page.title}”? Export a backup first if you want to keep it.`,
                  )
                )
                  onChange({
                    journalPages: pages.filter((p) => p.id !== page.id),
                  });
              }}
            >
              Delete page
            </button>
          </div>
          <JournalCanvas key={page.id} page={page} onChange={update} />
        </>
      ) : (
        <div className="card empty">
          <h2>A new thought deserves a page.</h2>
          <button className="primary" onClick={add}>
            Add a blank page
          </button>
        </div>
      )}
    </section>
  );
}

export function TemplateLibrary({ onUse }: { onUse: (id: string) => void }) {
  return (
    <div className="template-grid">
      {templates.map((t) => (
        <article className="template-card card" key={t.id}>
          <div
            className={`template-preview preview-${t.id}`}
            style={{
              background: templateDesign(t.id).color,
              color: templateDesign(t.id).accent,
            }}
            aria-hidden="true"
          >
            <div className="mini-letterhead">
              <span>{t.icon}</span>
              <strong>{templateDesign(t.id).format}</strong>
            </div>
            <div className="mini-fields">
              {templateDesign(t.id).fields.map((field) => (
                <div key={field.id} className={field.wide ? "mini-wide" : ""}>
                  <b>{field.label}</b>
                  <i />
                  <i />
                </div>
              ))}
            </div>
            {t.id === "blank" && (
              <div className="mini-free-lines">
                <i />
                <i />
                <i />
                <i />
              </div>
            )}
            {t.id === "ideas" && <div className="mini-plate" />}
          </div>
          <span className="format-tag">{templateDesign(t.id).format}</span>
          <h2>{t.title}</h2>
          <p>{t.description}</p>
          <button type="button" onClick={() => onUse(t.id)}>
            Use template →
          </button>
        </article>
      ))}
    </div>
  );
}
