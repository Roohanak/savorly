import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { NotebookPage } from "./notebook";
import { newId } from "./id";
import { stickerKinds } from "./stickers";
import type { Sticker } from "./stickers";
import StickerArt from "./StickerArt";
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export function StickerPicker({
  page,
  onChange,
  onArrange,
  selected,
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
  const chosen = page.stickers?.find((s) => s.id === selected);
  function change(stickers: Sticker[]) {
    setUndo(page.stickers ?? []);
    onChange({ stickers });
  }
  return (
    <div className="sticker-tools">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
        ✿ Stickers
      </button>
      <span className="sticker-hint">Little things, just for you.</span>
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
      {chosen && (
        <div className="sticker-adjust">
          <label>
            Sticker size
            <input
              type="range"
              min="5"
              max="30"
              value={chosen.size}
              onChange={(e) => {
                const size = Number(e.target.value);
                onChange({
                  stickers: page.stickers?.map((s) =>
                    s.id === selected
                      ? {
                          ...s,
                          size,
                          x: Math.min(s.x, 100 - size),
                          y: Math.min(s.y, 100 - size),
                        }
                      : s,
                  ),
                });
              }}
            />
          </label>
          <label>
            Tilt
            <input
              type="range"
              min="-30"
              max="30"
              value={chosen.rotation}
              onChange={(e) =>
                onChange({
                  stickers: page.stickers?.map((s) =>
                    s.id === selected
                      ? { ...s, rotation: Number(e.target.value) }
                      : s,
                  ),
                })
              }
            />
          </label>
          <button
            type="button"
            className="danger"
            onClick={() => {
              change((page.stickers ?? []).filter((s) => s.id !== selected));
              setSelected("");
            }}
          >
            Remove sticker
          </button>
        </div>
      )}
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
  } | null>(null);
  const [draft, setDraft] = useState<Sticker | null>(null);
  function down(e: PointerEvent<HTMLDivElement>, s: Sticker) {
    if (!movable || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(s.id);
    const rect = e.currentTarget.parentElement!.getBoundingClientRect();
    active.current = {
      id: s.id,
      startX: e.clientX,
      startY: e.clientY,
      x: s.x,
      y: s.y,
      rect,
      latest: s,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    const a = active.current;
    if (!a) return;
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
    if (!a) return;
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
          </div>
        );
      })}
    </div>
  );
}
