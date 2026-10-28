import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { NotebookPage } from "./notebook";
import { newId } from "./id";
import { stickerKinds, resizeSticker, rotateSticker } from "./stickers";
import type { Sticker } from "./stickers";
import StickerArt from "./StickerArt";
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export function StickerPicker({
  page,
  onChange,
  onArrange,
  setSelected,
}: {
  page: NotebookPage;
  onChange: (p: Partial<NotebookPage>) => void;
  onArrange: () => void;
  selected: string;
  setSelected: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [undo, setUndo] = useState<Sticker[] | null>(null);

  function change(stickers: Sticker[]) {
    setUndo(page.stickers ?? []);
    onChange({ stickers });
  }
  return (
    <div className="sticker-tools">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
        ✿ Stickers
      </button>
      <span className="sticker-hint">26 little things, just for you.</span>
      {open && (
        <div className="sticker-picker" aria-label="Sticker choices">
          {stickerKinds.map((kind) => (
            <button
              type="button"
              key={kind}
              aria-label={`Add ${kind} sticker`}
              disabled={(page.stickers?.length ?? 0) >= 30}
              onClick={() => {
                const id = newId();
                const i = page.stickers?.length ?? 0;
                change([
                  ...(page.stickers ?? []),
                  {
                    id,
                    kind,
                    x: 8 + (i % 5) * 15,
                    y: 8 + Math.floor(i / 5) * 10,
                    size: 12,
                    rotation: 0,
                  },
                ]);
                setSelected(id);
                onArrange();
              }}
            >
              <StickerArt kind={kind} />
              <span>{kind}</span>
            </button>
          ))}
        </div>
      )}
      <span className="sticker-resize-tip">
        Select a sticker, drag its corner to resize or the round handle to
        rotate. Delete/Backspace removes it; Esc deselects.
      </span>
      {undo && (
        <button
          type="button"
          onClick={() => {
            onChange({ stickers: undo });
            setUndo(null);
          }}
        >
          Undo sticker change
        </button>
      )}
    </div>
  );
}
export function StickerLayer({
  page,
  onChange,
  movable,
  selected,
  setSelected,
}: {
  page: NotebookPage;
  onChange: (p: Partial<NotebookPage>) => void;
  movable: boolean;
  selected: string;
  setSelected: (id: string) => void;
}) {
  const active = useRef<{
    id: string;
    startX: number;
    startY: number;
    x: number;
    y: number;
    rect: DOMRect;
    latest: Sticker;
    original: Sticker;
    resize: boolean;
    rotate: boolean;
    startAngle: number;
    centerX: number;
    centerY: number;
    pointerId: number;
  } | null>(null);
  const previous = useRef<Sticker[] | null>(null);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (
        !movable ||
        el.closest("input,textarea,select,[contenteditable=true]")
      )
        return;
      if (e.key === "Escape") {
        setSelected("");
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "z" &&
        previous.current &&
        (el === document.body || el.closest(".canvas-sticker-layer"))
      ) {
        e.preventDefault();
        onChange({ stickers: previous.current });
        previous.current = null;
        return;
      }
      if (selected && ["Delete", "Backspace"].includes(e.key)) {
        e.preventDefault();
        previous.current = page.stickers ?? [];
        onChange({ stickers: page.stickers?.filter((s) => s.id !== selected) });
        setSelected("");
      }
    }
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [movable, selected, page.stickers, onChange, setSelected]);
  const [draft, setDraft] = useState<Sticker | null>(null);
  function down(
    e: PointerEvent<HTMLDivElement>,
    s: Sticker,
    resize = false,
    rotate = false,
  ) {
    if (!movable || e.button !== 0 || active.current) return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(s.id);
    const owner = e.currentTarget.closest(".placed-sticker") as HTMLElement;
    owner?.focus({ preventScroll: true });
    const box = owner.getBoundingClientRect();
    const centerX = box.x + box.width / 2,
      centerY = box.y + box.height / 2;
    const rect = e.currentTarget
      .closest(".canvas-sticker-layer")!
      .getBoundingClientRect();
    active.current = {
      id: s.id,
      startX: e.clientX,
      startY: e.clientY,
      x: s.x,
      y: s.y,
      rect,
      latest: s,
      original: s,
      resize,
      rotate,
      centerX,
      centerY,
      startAngle: Math.atan2(e.clientY - centerY, e.clientX - centerX),
      pointerId: e.pointerId,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    const a = active.current;
    if (!a || a.pointerId !== e.pointerId) return;
    if (a.rotate) {
      a.latest = {
        ...a.original,
        rotation: rotateSticker(
          a.original.rotation,
          Math.atan2(e.clientY - a.centerY, e.clientX - a.centerX) -
            a.startAngle,
        ),
      };
      setDraft(a.latest);
      return;
    }
    if (a.resize) {
      a.latest = resizeSticker(
        a.original,
        e.clientX - a.startX,
        e.clientY - a.startY,
        a.rect.width,
        a.rect.height,
      );
      setDraft(a.latest);
      return;
    }
    a.latest = {
      ...a.latest,
      x: clamp(
        a.x + ((e.clientX - a.startX) * 100) / a.rect.width,
        0,
        100 - a.latest.size,
      ),
      y: clamp(
        a.y + ((e.clientY - a.startY) * 100) / a.rect.height,
        0,
        100 - a.latest.size,
      ),
    };
    setDraft(a.latest);
  }
  function finish(e: PointerEvent<HTMLDivElement>) {
    const a = active.current;
    if (!a || a.pointerId !== e.pointerId) return;
    previous.current = page.stickers ?? [];
    onChange({
      stickers: page.stickers?.map((s) => (s.id === a.id ? a.latest : s)),
    });
    active.current = null;
    setDraft(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  }
  return (
    <div className="canvas-sticker-layer">
      {page.stickers?.map((saved) => {
        const s = draft?.id === saved.id ? draft : saved;
        return (
          <div
            key={s.id}
            role="button"
            aria-label={`Move ${s.kind} sticker`}
            aria-pressed={selected === s.id}
            tabIndex={movable ? 0 : -1}
            className={
              "placed-sticker " +
              (movable && selected === s.id ? "selected" : "")
            }
            style={{
              left: s.x + "%",
              top: s.y + "%",
              width: s.size + "%",
              height: s.size + "%",
              pointerEvents: movable ? "auto" : "none",
            }}
            onPointerDown={(e) => down(e, s)}
            onPointerMove={move}
            onPointerUp={finish}
            onPointerCancel={finish}
            onClick={() => setSelected(s.id)}
            onKeyDown={(e) => {
              if (
                !movable ||
                !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                  e.key,
                )
              )
                return;
              e.preventDefault();
              const d = e.shiftKey ? 5 : 1;
              onChange({
                stickers: page.stickers?.map((p) =>
                  p.id === s.id
                    ? {
                        ...p,
                        x: clamp(
                          p.x +
                            (e.key === "ArrowRight"
                              ? d
                              : e.key === "ArrowLeft"
                                ? -d
                                : 0),
                          0,
                          100 - p.size,
                        ),
                        y: clamp(
                          p.y +
                            (e.key === "ArrowDown"
                              ? d
                              : e.key === "ArrowUp"
                                ? -d
                                : 0),
                          0,
                          100 - p.size,
                        ),
                      }
                    : p,
                ),
              });
            }}
          >
            <span style={{ transform: `rotate(${s.rotation}deg)` }}>
              <StickerArt kind={s.kind} />
            </span>
            {movable && selected === s.id && (
              <div
                className="sticker-rotate-handle"
                role="slider"
                tabIndex={0}
                aria-label={`Rotate ${s.kind} sticker`}
                aria-valuemin={-180}
                aria-valuemax={180}
                aria-valuenow={Math.round(s.rotation)}
                title="Drag to rotate"
                onPointerDown={(e) => down(e, s, false, true)}
                onPointerMove={move}
                onPointerUp={finish}
                onPointerCancel={finish}
                onKeyDown={(e) => {
                  if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
                  e.preventDefault();
                  e.stopPropagation();
                  onChange({
                    stickers: page.stickers?.map((p) =>
                      p.id === s.id
                        ? {
                            ...p,
                            rotation: rotateSticker(
                              p.rotation,
                              ((e.key === "ArrowRight" ? 5 : -5) * Math.PI) /
                                180,
                            ),
                          }
                        : p,
                    ),
                  });
                }}
              >
                ↻
              </div>
            )}
            {movable && selected === s.id && (
              <div
                className="sticker-resize-handle"
                role="slider"
                tabIndex={0}
                aria-label={`Resize ${s.kind} sticker`}
                aria-valuemin={5}
                aria-valuemax={Math.min(30, 100 - s.x, 100 - s.y)}
                aria-valuenow={Math.round(s.size)}
                title="Drag to resize"
                onPointerDown={(e) => down(e, s, true)}
                onPointerMove={move}
                onPointerUp={finish}
                onPointerCancel={finish}
                onKeyDown={(e) => {
                  if (
                    ![
                      "ArrowLeft",
                      "ArrowRight",
                      "ArrowUp",
                      "ArrowDown",
                    ].includes(e.key)
                  )
                    return;
                  e.preventDefault();
                  e.stopPropagation();
                  const size = clamp(
                    s.size +
                      (["ArrowRight", "ArrowUp"].includes(e.key) ? 1 : -1) *
                        (e.shiftKey ? 5 : 1),
                    5,
                    Math.min(30, 100 - s.x, 100 - s.y),
                  );
                  onChange({
                    stickers: page.stickers?.map((p) =>
                      p.id === s.id ? { ...p, size } : p,
                    ),
                  });
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
