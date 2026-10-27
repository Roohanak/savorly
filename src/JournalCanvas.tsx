import { newId } from "./id.ts";
import { useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import type { InkPoint, InkStroke, NotebookPage } from "./notebook";
import { touchesStroke, templateDesign } from "./notebook";
import TemplateFields from "./TemplateFields";

type Props = {
  page: NotebookPage;
  onChange: (patch: Partial<NotebookPage>) => void;
};
type Tool = "text" | "pen" | "eraser" | "scroll";

function Ink({ stroke }: { stroke: InkStroke }) {
  const pressure =
    stroke.points.reduce((sum, p) => sum + p.pressure, 0) /
    stroke.points.length;
  const first = stroke.points[0];
  const width = stroke.width * (0.5 + pressure);
  if (stroke.points.length === 1)
    return (
      <path d={`M${first.x},${first.y} l0.01,0`} fill="none" stroke={stroke.color} strokeWidth={width} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    );
  return (
    <path
      d={stroke.points
        .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(" ")}
      fill="none"
      stroke={stroke.color}
      strokeWidth={width}
      vectorEffect="non-scaling-stroke"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export default function JournalCanvas({ page, onChange }: Props) {
  const [tool, setTool] = useState<Tool>("text");
  const [color, setColor] = useState("#344638");
  const [width, setWidth] = useState(4);
  const [finger, setFinger] = useState(true);
  const [pending, setPending] = useState<InkStroke | null>(null);
  const active = useRef<{ pointerId: number; stroke: InkStroke } | null>(null);
  const erased = useRef<{ pointerId: number; strokes: InkStroke[] } | null>(
    null,
  );
  const [erasingPreview, setErasingPreview] = useState<InkStroke[] | null>(
    null,
  );
  const [past, setPast] = useState<InkStroke[][]>([]);
  const [future, setFuture] = useState<InkStroke[][]>([]);
  const [notice, setNotice] = useState("");

  function commit(strokes: InkStroke[]) {
    setPast((history) => [...history.slice(-29), page.strokes]);
    setFuture([]);
    onChange({ strokes });
  }
  function point(event: PointerEvent<SVGSVGElement>): InkPoint {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(900, ((event.clientX - rect.left) * 900) / rect.width),
      ),
      y: Math.max(
        0,
        Math.min(1100, ((event.clientY - rect.top) * 1100) / rect.height),
      ),
      pressure:
        event.pointerType === "pen" ? Math.max(0.1, event.pressure) : 0.5,
    };
  }
  function down(event: PointerEvent<SVGSVGElement>) {
    if (
      !["pen", "eraser"].includes(tool) ||
      (event.pointerType === "touch" && !finger) ||
      active.current ||
      erased.current ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return;
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* Pointer capture is optional on older tablet browsers. */
    }
    if (tool === "eraser") {
      const strokes = page.strokes.filter(
        (s) => !touchesStroke(s, point(event)),
      );
      erased.current = { pointerId: event.pointerId, strokes };
      setErasingPreview(strokes);
      return;
    }
    if (
      page.strokes.length >= 1000 ||
      page.strokes.reduce((sum, s) => sum + s.points.length, 0) >= 40000
    ) {
      setNotice(
        "This page has a lot of ink. Add another page to keep writing.",
      );
      return;
    }
    const stroke = {
      id: newId(),
      color,
      width,
      points: [point(event)],
    };
    active.current = { pointerId: event.pointerId, stroke };
    setPending(stroke);
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    if (erased.current?.pointerId === event.pointerId) {
      erased.current.strokes = erased.current.strokes.filter(
        (s) => !touchesStroke(s, point(event)),
      );
      setErasingPreview(erased.current.strokes);
      return;
    }
    if (active.current?.pointerId !== event.pointerId) return;
    if (active.current.stroke.points.length >= 4000) return;
    active.current.stroke = {
      ...active.current.stroke,
      points: [...active.current.stroke.points, point(event)],
    };
    setPending(active.current.stroke);
  }
  function up(event: PointerEvent<SVGSVGElement>) {
    if (active.current?.pointerId === event.pointerId) {
      commit([...page.strokes, active.current.stroke]);
      active.current = null;
      setPending(null);
    } else if (erased.current?.pointerId === event.pointerId) {
      if (erased.current.strokes.length !== page.strokes.length)
        commit(erased.current.strokes);
      erased.current = null;
      setErasingPreview(null);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div className="notebook-editor">
      <div className="writing-toolbar" aria-label="Writing tools">
        <div className="tool-group">
          {(
            [
              ["text", "T", "Text"],
              ["pen", "✎", "Pen"],
              ["eraser", "▱", "Eraser"],
              ["scroll", "↕", "Scroll"],
            ] as const
          ).map(([id, icon, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={tool === id}
              onClick={() => setTool(id)}
            >
              <span aria-hidden="true">{icon}</span> {label}
            </button>
          ))}
        </div>
        <div className="tool-group">
          <button
            type="button"
            disabled={!past.length}
            onClick={() => {
              const previous = past[past.length - 1];
              setPast(past.slice(0, -1));
              setFuture([...future, page.strokes]);
              onChange({ strokes: previous });
            }}
          >
            Undo ink
          </button>
          <button
            type="button"
            disabled={!future.length}
            onClick={() => {
              const next = future[future.length - 1];
              setFuture(future.slice(0, -1));
              setPast([...past, page.strokes]);
              onChange({ strokes: next });
            }}
          >
            Redo ink
          </button>
        </div>
      </div>
      <div className="paper-options">
        <label>
          Paper
          <select
            value={page.paper}
            onChange={(e) =>
              onChange({ paper: e.target.value as NotebookPage["paper"] })
            }
          >
            <option value="lined">Lined</option>
            <option value="dots">Dotted</option>
            <option value="plain">Plain</option>
          </select>
        </label>
        <div className="paper-swatches" aria-label="Page colors">
          {[
            "#ffffff",
            "#fff0e7",
            "#fff0f4",
            "#eef0ff",
            "#fff8dc",
            "#eaf7ef",
            "#eaf5ff",
          ].map((tint, i) => (
            <button
              key={tint}
              type="button"
              style={{ background: tint }}
              aria-label={`Page color ${["White", "Peach", "Rose", "Lavender", "Butter", "Mint", "Sky"][i]}`}
              aria-pressed={
                (page.color ?? templateDesign(page.template).color) === tint
              }
              onClick={() => onChange({ color: tint })}
            />
          ))}
        </div>
        {tool === "pen" && (
          <>
            <label>
              Ink
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </label>
            <label>
              Pen size
              <select
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              >
                <option value={2}>Fine</option>
                <option value={4}>Medium</option>
                <option value={6}>Bold</option>
              </select>
            </label>
          </>
        )}
        {(tool === "pen" || tool === "eraser") && (
          <label className="finger-option">
            <input
              type="checkbox"
              checked={finger}
              onChange={(e) => setFinger(e.target.checked)}
            />{" "}
            Draw with finger
          </label>
        )}
        <button
          className="text-button"
          disabled={!page.strokes.length}
          type="button"
          onClick={() => {
            if (
              confirm(
                "Clear the handwriting on this page? You can undo this until you leave the page.",
              )
            )
              commit([]);
          }}
        >
          Clear ink
        </button>
      </div>
      <p className="writing-hint" role="status">
        {notice ||
          (tool === "text"
            ? "Type anywhere in the writing area. Your handwriting stays on the page."
            : tool === "scroll"
              ? "Scroll through the page without making marks."
              : tool === "eraser"
                ? "Drag over a line to erase that stroke. Undo brings it back."
                : "Pen is ready: drag on the colored page with a mouse, stylus, or finger. Turn off finger drawing to reduce accidental touch marks.")}
      </p>
      <div
        className={`notebook-paper paper-${page.paper} tool-${tool} layout-${page.template}`}
        style={
          {
            "--sheet-color": page.color ?? templateDesign(page.template).color,
            "--sheet-accent": templateDesign(page.template).accent,
          } as CSSProperties
        }
      >
        <TemplateFields
          page={page}
          onChange={onChange}
          editable={tool === "text"}
        />
        <svg
          viewBox="0 0 900 1100"
          preserveAspectRatio="none"
          aria-label="Handwriting canvas"
          role="img"
          style={{
            pointerEvents:
              tool === "text" || tool === "scroll" ? "none" : "auto",
            touchAction: tool === "pen" || tool === "eraser" ? "none" : "pan-y",
          }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerLeave={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId))
              up(event);
          }}
          onLostPointerCapture={(event) => {
            if (
              active.current?.pointerId === event.pointerId ||
              erased.current?.pointerId === event.pointerId
            )
              up(event);
          }}
        >
          <rect
            x="0"
            y="0"
            width="900"
            height="1100"
            fill="transparent"
            pointerEvents={
              tool === "text" || tool === "scroll" ? "none" : "all"
            }
          />
          {(erasingPreview ?? page.strokes).map((stroke) => (
            <Ink key={stroke.id} stroke={stroke} />
          ))}
          {pending && <Ink stroke={pending} />}
        </svg>
      </div>
      <p className="ink-status" role="status">
        {pending ? "Drawing…" : `${page.strokes.length} saved ink strokes`} ·{" "}
        {tool === "pen"
          ? "Pen mode"
          : tool === "text"
            ? "Text mode"
            : tool === "eraser"
              ? "Eraser mode"
              : "Scroll mode"}
      </p>
      <p className="notebook-footnote">
        Text and ink save together. Handwriting is preserved as drawing;
        automatic handwriting recognition is not connected.
      </p>
    </div>
  );
}
