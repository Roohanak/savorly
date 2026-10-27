import SharedPlanner from "./SharedPlanner";
import type { NotebookPage } from "./notebook";
import { templateDesign } from "./notebook";

export default function TemplateFields({
  page,
  onChange,
  editable,
}: {
  page: NotebookPage;
  onChange: (patch: Partial<NotebookPage>) => void;
  editable: boolean;
}) {
  const design = templateDesign(page.template);
  return (
    <div className={`template-writing format-${page.template}`}>
      <div className="page-letterhead">
        <span>SAVORLY / KITCHEN JOURNAL</span>
        <strong>{design.format}</strong>
        <span className="page-letterhead-date">{page.title}</span>
      </div>
      {page.template === "weekly" && !editable && <p className="linked-planner-note">Choose Text to edit your linked meal plan.</p>}
      {page.template === "weekly" && <div className="linked-weekly-planner" inert={!editable}><p className="linked-planner-note">Linked to Meal Planner · Changes here appear there too. Use the week picker to choose your dates.</p><SharedPlanner /></div>}
      <div className="template-field-grid">
        {(page.template === "weekly" ? design.fields.filter(field => page.fields?.[field.id]?.trim()) : design.fields).map((field) => (
          <label
            key={field.id}
            className={`template-field ${field.wide ? "field-wide" : ""} ${field.short ? "field-short" : ""}`}
          >
            <span>{page.template === "weekly" ? `Earlier notebook note · ${field.label}` : field.label}</span>
            <textarea
              aria-label={field.label}
              readOnly={!editable}
              rows={field.short ? 1 : 3}
              placeholder={field.placeholder}
              value={page.fields?.[field.id] ?? ""}
              onChange={(e) =>
                onChange({
                  fields: { ...page.fields, [field.id]: e.target.value },
                })
              }
            />
          </label>
        ))}
      </div>
      <label className="loose-notes">
        <span>
          {design.fields.length
            ? "Loose notes & happy accidents"
            : "A page for your kitchen thoughts"}
        </span>
        <textarea
          aria-label="Journal page text"
          readOnly={!editable}
          placeholder="A little more water? A pinch of something…"
          value={page.text}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </label>
    </div>
  );
}
