import { Fragment, useState } from "react";
import type { RecipeDraft } from "./recipeDraft";
import { parseRecipeDraft } from "./recipeDraft";

function Inline({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(\*\*[^*]+\*\*)/)
        .map((part, i) =>
          part.startsWith("**") ? (
            <strong key={i}>{part.slice(2, -2)}</strong>
          ) : (
            <Fragment key={i}>{part}</Fragment>
          ),
        )}
    </>
  );
}
function Markdown({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((block, i) => {
          if (/^#{1,6}\s/.test(block))
            return (
              <h3 key={i}>
                <Inline text={block.replace(/^#{1,6}\s/, "")} />
              </h3>
            );
          if (/^\*\*[^*]+\*\*$/.test(block.trim()))
            return <h3 key={i}>{block.replace(/\*\*/g, "")}</h3>;
          const lines = block.split("\n");
          if (lines.every((line) => /^[-*]\s/.test(line)))
            return (
              <ul key={i}>
                {lines.map((line, j) => (
                  <li key={j}>
                    <Inline text={line.replace(/^[-*]\s/, "")} />
                  </li>
                ))}
              </ul>
            );
          if (lines.every((line) => /^\d+[.)]\s/.test(line)))
            return (
              <ol key={i}>
                {lines.map((line, j) => (
                  <li key={j}>
                    <Inline text={line.replace(/^\d+[.)]\s/, "")} />
                  </li>
                ))}
              </ol>
            );
          return (
            <p key={i}>
              <Inline text={block} />
            </p>
          );
        })}
    </>
  );
}
export default function AIResult({
  text,
  recipeMode,
  source,
  onSave,
}: {
  text: string;
  recipeMode: boolean;
  source: { title: string; servings: number };
  onSave: (draft: RecipeDraft) => void;
}) {
  const [draft, setDraft] = useState(() => parseRecipeDraft(text, source));
  const [editing, setEditing] = useState(false);
  const valid = Boolean(
    draft.title.trim() && draft.ingredients.trim() && draft.steps.trim(),
  );
  return (
    <section className="ai-result" aria-label="AI draft">
      <div className="result-heading">
        <span>YOUR DRAFT</span>
        {recipeMode && (
          <button type="button" onClick={() => setEditing(!editing)}>
            {editing ? "Preview recipe" : "Edit draft"}
          </button>
        )}
      </div>
      {recipeMode && valid && !editing ? (
        <article className="recipe-preview">
          <h2>{draft.title}</h2>
          <p className="recipe-servings">Makes {draft.servings} servings</p>
          <h3>Ingredients</h3>
          <ul>
            {draft.ingredients.split("\n").map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <h3>Method</h3>
          <ol>
            {draft.steps.split("\n").map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
          {draft.notes && (
            <div className="draft-suggestion">
              <h3>Suggested next experiment</h3>
              <p>{draft.notes}</p>
              <small>A suggestion to test, not a guaranteed result.</small>
            </div>
          )}
        </article>
      ) : recipeMode && editing ? (
        <div className="draft-fields">
          <label>
            Recipe title
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label>
            Servings
            <input
              type="number"
              min="1"
              max="100"
              value={draft.servings}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  servings: Math.max(
                    1,
                    Math.min(100, Number(e.target.value) || 1),
                  ),
                })
              }
            />
          </label>
          {(["ingredients", "steps", "notes"] as const).map((key) => (
            <label key={key}>
              {key === "steps"
                ? "Method"
                : key === "notes"
                  ? "Suggested next experiment"
                  : "Ingredients"}
              <textarea
                rows={key === "notes" ? 3 : 6}
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
      ) : (
        <article className="formatted-answer">
          <Markdown text={text} />
        </article>
      )}
      {recipeMode && (
        <>
          <button
            type="button"
            className="primary save-draft"
            disabled={!valid}
            onClick={() => onSave(draft)}
          >
            Save to Recipe Book
          </button>
          <p className="save-caption">
            Saves a new recipe. Your original journal stays intact.
          </p>
          {!valid && (
            <p>Open Edit draft and add ingredients and method before saving.</p>
          )}
        </>
      )}
    </section>
  );
}
