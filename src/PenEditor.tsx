import PhotoCanvas from "./PhotoCanvas";
import { useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { newId } from "./id";
import type { InkStroke, NotebookPage } from "./notebook";
import { templateDesign, touchesStroke } from "./notebook";
import { inkPoint, strokePath } from "./ink";
import TemplateFields from "./TemplateFields";

function Ink({ stroke }: { stroke: InkStroke }) {
  const pressure =
    stroke.points.reduce((sum, p) => sum + p.pressure, 0) /
    stroke.points.length;
  return (
    <path
      d={strokePath(stroke.points)}
      fill="none"
      stroke={stroke.color}
      strokeWidth={
        stroke.width * (stroke.style === "highlighter" ? 1 : 0.5 + pressure)
      }
      vectorEffect="non-scaling-stroke"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={
        stroke.style === "highlighter"
          ? 0.28
          : stroke.style === "pencil"
            ? 0.65
            : 1
      }
      strokeDasharray={stroke.style === "pencil" ? "1 0.7" : undefined}
    />
  );
}
export default function PenEditor({
  page,
  onChange,
}: {
  page: NotebookPage;
  onChange: (patch: Partial<NotebookPage>) => void;
}) {
  const [tool, setTool] = useState<"text" | "pen" | "eraser" | "scroll">(
    "text",
  );
  const [color, setColor] = useState("#17202a");
  const [style, setStyle] = useState<"ballpoint" | "pencil" | "highlighter">(
    "ballpoint",
  );
  const [width, setWidth] = useState(3);
  const [finger, setFinger] = useState(true);
  const [pending, setPending] = useState<InkStroke | null>(null);
  const [erased, setErased] = useState<InkStroke[] | null>(null);
  const active = useRef<{
    pointerId: number;
    stroke?: InkStroke;
    remaining?: InkStroke[];
  } | null>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const [past, setPast] = useState<InkStroke[][]>([]);
  const [future, setFuture] = useState<InkStroke[][]>([]);
  const [notice, setNotice] = useState("");
  const ink = page.strokes.filter((s) => s.region === "pad");
  const legacy = page.strokes.filter((s) => s.region !== "pad");
  function commit(strokes: InkStroke[]) {
    setPast((p) => [...p.slice(-29), page.strokes]);
    setFuture([]);
    onChange({ strokes });
  }
  function selectTool(next: typeof tool) {
    setTool(next);
    if (next === "pen" || next === "eraser")
      requestAnimationFrame(() =>
        padRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }),
      );
  }
  function point(e: PointerEvent<SVGSVGElement>) {
    return inkPoint(
      e.clientX,
      e.clientY,
      e.currentTarget.getBoundingClientRect(),
      e.pointerType === "pen" ? e.pressure : 0.5,
    );
  }
  function finish(e: PointerEvent<SVGSVGElement>) {
    const gesture = active.current;
    if (gesture?.pointerId !== e.pointerId) return;
    if (gesture.stroke) commit([...page.strokes, gesture.stroke]);
    else if (gesture.remaining && gesture.remaining.length !== ink.length)
      commit([...legacy, ...gesture.remaining]);
    active.current = null;
    setPending(null);
    setErased(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function down(e: PointerEvent<SVGSVGElement>) {
    if (
      !["pen", "eraser"].includes(tool) ||
      active.current ||
      (e.pointerType === "mouse" && e.button !== 0) ||
      (e.pointerType === "touch" && !finger)
    )
      return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* Older browsers may not support capture. */
    }
    if (tool === "eraser") {
      const remaining = ink.filter((s) => !touchesStroke(s, point(e)));
      active.current = { pointerId: e.pointerId, remaining };
      setErased(remaining);
      return;
    }
    if (page.strokes.length >= 1000) {
      setNotice("This page is full of ink. Start another page.");
      return;
    }
    const stroke: InkStroke = {
      id: newId(),
      color,
      width: style === "highlighter" ? Math.max(12, width) : width,
      style,
      region: "pad",
      points: [point(e)],
    };
    active.current = { pointerId: e.pointerId, stroke };
    setPending(stroke);
  }
  function move(e: PointerEvent<SVGSVGElement>) {
    const gesture = active.current;
    if (gesture?.pointerId !== e.pointerId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      finish(e);
      return;
    }
    if (gesture.remaining) {
      gesture.remaining = gesture.remaining.filter(
        (s) => !touchesStroke(s, point(e)),
      );
      setErased(gesture.remaining);
      return;
    }
    if (!gesture.stroke || gesture.stroke.points.length >= 4000) return;
    gesture.stroke = {
      ...gesture.stroke,
      points: [...gesture.stroke.points, point(e)],
    };
    setPending(gesture.stroke);
  }
  return (
    <div className={"notebook-editor bounded-editor" + (page.template.startsWith("toddler") ? " toddler-notebook" : "")}>
      <div className="writing-toolbar editor-tools" aria-label="Writing tools">
        <div className="tool-group">
          {(
            [
              ["text", "Text"],
              ["pen", "Pen"],
              ["eraser", "Eraser"],
              ["scroll", "Scroll"],
            ] as const
          ).map(([id, label]) => (
            <button
              type="button"
              key={id}
              aria-pressed={tool === id}
              onClick={() => selectTool(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="tool-group">
          <button
            type="button"
            disabled={!past.length}
            onClick={() => {
              setFuture([...future, page.strokes]);
              onChange({ strokes: past[past.length - 1] });
              setPast(past.slice(0, -1));
            }}
          >
            Undo ink
          </button>
          <button
            type="button"
            disabled={!future.length}
            onClick={() => {
              setPast([...past, page.strokes]);
              onChange({ strokes: future[future.length - 1] });
              setFuture(future.slice(0, -1));
            }}
          >
            Redo ink
          </button>
        </div>
        {tool === "pen" && (
          <div className="pen-properties">
            <label>
              Style
              <select
                value={style}
                onChange={(e) => {
                  const next = e.target.value as typeof style;
                  setStyle(next);
                  setWidth(
                    next === "highlighter" ? 16 : next === "pencil" ? 2 : 3,
                  );
                }}
              >
                <option value="ballpoint">Ballpoint</option>
                <option value="pencil">Pencil</option>
                <option value="highlighter">Highlighter</option>
              </select>
            </label>
            <label>
              Size{" "}
              <input
                type="range"
                aria-label="Pen size"
                min={style === "highlighter" ? 12 : 1}
                max={style === "highlighter" ? 20 : 12}
                step="1"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
              <output>{width} px</output>
            </label>
            <div className="ink-swatches" aria-label="Ink colors">
              {[
                ["Black", "#17202a"],
                ["Blue", "#2563eb"],
                ["Red", "#dc2626"],
                ["Purple", "#7c3aed"],
                ["Teal", "#0891b2"],
                ["Yellow", "#eab308"],
              ].map(([name, value]) => (
                <button
                  type="button"
                  key={value}
                  aria-label={name + " ink"}
                  aria-pressed={color === value}
                  style={{ backgroundColor: value }}
                  onClick={() => setColor(value)}
                />
              ))}
            </div>
          </div>
        )}
        {(tool === "pen" || tool === "eraser") && (
          <label className="finger-option">
            <input
              type="checkbox"
              checked={finger}
              onChange={(e) => setFinger(e.target.checked)}
            />
            Draw with finger
          </label>
        )}
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
            <option value="plain">Plain</option>
            <option value="lined">Lined</option>
            <option value="dots">Dotted</option>
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
              type="button"
              key={tint}
              aria-label={
                "Page color " +
                ["White", "Peach", "Rose", "Lavender", "Butter", "Mint", "Sky"][
                  i
                ]
              }
              style={{ background: tint }}
              onClick={() => onChange({ color: tint })}
            />
          ))}
        </div>
      </div>
      <div
        className={`notebook-paper paper-${page.paper}`}
        style={
          {
            "--sheet-color": page.color ?? templateDesign(page.template).color,
            "--sheet-accent": "#64748b",
          } as CSSProperties
        }
      >
        <TemplateFields
          page={page}
          onChange={onChange}
          editable={tool === "text"}
        />
      </div>
      <section className="drawing-panel" aria-label="Handwriting and sketches">
        <div className="drawing-heading">
          <div>
            <h3>{page.template.startsWith("toddler") ? "Little doodles & keepsakes" : "Handwriting & sketches"}</h3>
            <p>
              {tool === "pen"
                ? "Draw inside the box below. Ink stays attached to this box."
                : tool === "eraser"
                  ? "Drag over ink inside the box to erase a stroke."
                  : "Choose Pen to write here. Choose Text for the fields above."}
            </p>
          </div>
          <button
            type="button"
            disabled={!ink.length}
            onClick={() => {
              if (
                confirm(
                  "Clear the drawing box? Undo is available until you leave the page.",
                )
              )
                commit(legacy);
            }}
          >
            Clear drawing
          </button>
        </div>
        <div className="canvas-writing-tools" aria-label="Canvas drawing tools">
          <div className="tool-group">
            <button
              type="button"
              aria-pressed={tool === "pen"}
              onClick={() => selectTool("pen")}
            >
              ✎ Pen
            </button>
            <button
              type="button"
              aria-pressed={tool === "eraser"}
              onClick={() => selectTool("eraser")}
            >
              Eraser
            </button>
            <button
              type="button"
              aria-pressed={tool === "text"}
              onClick={() => setTool("text")}
            >
              Move photos / Text
            </button>
          </div>
          {tool === "pen" && (
            <div className="canvas-pen-settings">
              <label>
                Pen style
                <select
                  value={style}
                  onChange={(e) => {
                    const next = e.target.value as typeof style;
                    setStyle(next);
                    setWidth(
                      next === "highlighter" ? 16 : next === "pencil" ? 2 : 3,
                    );
                  }}
                >
                  <option value="ballpoint">Ballpoint</option>
                  <option value="pencil">Pencil</option>
                  <option value="highlighter">Highlighter</option>
                </select>
              </label>
              <label>
                Ink color
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </label>
              <label>
                Stroke size
                <input
                  type="range"
                  min={style === "highlighter" ? 12 : 1}
                  max={style === "highlighter" ? 20 : 12}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                />
                <output>{width} px</output>
              </label>
            </div>
          )}
        </div>
        <label className="sketch-paper-picker">
          Sketch paper
          <select
            aria-label="Sketch paper"
            value={page.paper}
            onChange={(e) =>
              onChange({ paper: e.target.value as NotebookPage["paper"] })
            }
          >
            <option value="plain">Plain</option>
            <option value="lined">Lined</option>
            <option value="dots">Dotted</option>
          </select>
        </label>
        <PhotoCanvas
          page={page}
          onChange={onChange}
          padRef={padRef}
          movable={tool === "text"}
          onArrange={() => setTool("text")}
          className={
            "ink-pad paper-" +
            page.paper +
            (page.template === "ideas" ? " plating-pad" : "")
          }
        >
          <svg
            viewBox="0 0 900 1100"
            preserveAspectRatio="none"
            role="img"
            aria-label="Handwriting canvas"
            style={{
              pointerEvents:
                tool === "pen" || tool === "eraser" ? "auto" : "none",
              touchAction:
                tool === "pen" || tool === "eraser" ? "none" : "pan-y",
            }}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={finish}
            onPointerCancel={finish}
            onLostPointerCapture={finish}
            onPointerLeave={(e) => {
              if (!e.currentTarget.hasPointerCapture(e.pointerId)) finish(e);
            }}
          >
            <rect width="900" height="1100" fill="transparent" />
            {(erased ?? ink).map((s) => (
              <Ink key={s.id} stroke={s} />
            ))}
            {pending && <Ink stroke={pending} />}
          </svg>
          {!ink.length &&
            !pending &&
            !page.photoIds?.length &&
            !page.stickers?.length && (
              <span className="ink-empty" aria-hidden="true">
                Add photos or write and sketch here
              </span>
            )}
        </PhotoCanvas>
        <p className="ink-status" role="status">
          {notice ||
            `${ink.length} saved strokes · ${tool === "pen" ? style + " · " + width + " px" : tool + " mode"}`}
        </p>
      </section>
      {legacy.length > 0 && (
        <details className="legacy-ink">
          <summary>Earlier page handwriting ({legacy.length} strokes)</summary>
          <p>Kept from the earlier full-page editor.</p>
          <svg
            viewBox="0 0 900 1100"
            role="img"
            aria-label="Earlier handwriting"
          >
            {legacy.map((s) => (
              <Ink key={s.id} stroke={s} />
            ))}
          </svg>
        </details>
      )}
    </div>
  );
}
