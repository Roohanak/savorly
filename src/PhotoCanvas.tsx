import { StickerPicker, StickerLayer } from "./StickerBoard";
import { useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject, PointerEvent } from "react";
import type { NotebookPage, PhotoPlacement } from "./notebook";
import type { Photo } from "./model";
import { getPhoto, preparePhoto, putPhotos } from "./photoStore";

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
function defaultPlacement(index: number): PhotoPlacement {
  return {
    x: 8 + (index % 3) * 28,
    y: 10 + Math.floor(index / 3) * 38,
    width: 24,
    height: 32,
  };
}
export default function PhotoCanvas({
  page,
  onChange,
  movable: canArrange,
  onArrange,
  padRef,
  className,
  children,
}: {
  page: NotebookPage;
  onChange: (patch: Partial<NotebookPage>) => void;
  movable: boolean;
  onArrange: () => void;
  padRef: RefObject<HTMLDivElement | null>;
  className: string;
  children: ReactNode;
}) {
  const [arranging, setArranging] = useState(false);
  const movable = canArrange && arranging;
  const [selectedSticker, setSelectedSticker] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<{
    id: string;
    position: PhotoPlacement;
  } | null>(null);
  const [undo, setUndo] = useState<{
    photoIds: string[];
    photoLayout: Record<string, PhotoPlacement>;
  } | null>(null);
  const gesture = useRef<{
    id: string;
    startX: number;
    startY: number;
    rect: DOMRect;
    position: PhotoPlacement;
    resize: boolean;
    latest: PhotoPlacement;
  } | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const ids = JSON.stringify(page.photoIds ?? []);
  useEffect(() => {
    let active = true;
    Promise.all((JSON.parse(ids) as string[]).map(getPhoto))
      .then((p) => {
        if (active) {
          setPhotos(p.filter((x): x is Photo => Boolean(x)));
          setError(
            p.some((x) => !x)
              ? "A photo is missing. Restore your complete backup to recover it."
              : "",
          );
        }
      })
      .catch(() => {
        if (active) setError("Could not load page photos.");
      });
    return () => {
      active = false;
    };
  }, [ids]);
  function position(id: string) {
    return (
      page.photoLayout?.[id] ??
      defaultPlacement((page.photoIds ?? []).indexOf(id))
    );
  }
  function remember() {
    setUndo({
      photoIds: page.photoIds ?? [],
      photoLayout: page.photoLayout ?? {},
    });
  }
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    if ((page.photoIds?.length ?? 0) + files.length > 6) {
      setError("Keep up to 6 photos on a page.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const added: Photo[] = [];
      for (const file of Array.from(files))
        added.push(await preparePhoto(file));
      await putPhotos(added);
      if (!mounted.current) return;
      remember();
      const layout = { ...page.photoLayout };
      added.forEach((p, i) => {
        layout[p.id] = defaultPlacement((page.photoIds?.length ?? 0) + i);
      });
      onChange({
        photoIds: [...(page.photoIds ?? []), ...added.map((p) => p.id)],
        photoLayout: layout,
      });
      setSelected("");
      onArrange();
      requestAnimationFrame(() =>
        padRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }),
      );
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : "Could not upload photo.");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  function start(e: PointerEvent<HTMLDivElement>, id: string, resize: boolean) {
    if (!movable || e.button !== 0 || !padRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(id);
    const p = position(id);
    gesture.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      rect: padRef.current.getBoundingClientRect(),
      position: p,
      resize,
      latest: p,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g) return;
    const dx = ((e.clientX - g.startX) * 100) / g.rect.width,
      dy = ((e.clientY - g.startY) * 100) / g.rect.height;
    const p = g.resize
      ? {
          ...g.position,
          width: clamp(g.position.width + dx, 10, 100 - g.position.x),
          height: clamp(g.position.height + dy, 10, 100 - g.position.y),
        }
      : {
          ...g.position,
          x: clamp(g.position.x + dx, 0, 100 - g.position.width),
          y: clamp(g.position.y + dy, 0, 100 - g.position.height),
        };
    g.latest = p;
    setDraft({ id: g.id, position: p });
  }
  function finish(e: PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g) return;
    remember();
    onChange({ photoLayout: { ...page.photoLayout, [g.id]: g.latest } });
    gesture.current = null;
    setDraft(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  }
  return (
    <>
      <div className="canvas-photo-tools">
        <label className="photo-picker">
          {busy ? "Preparing…" : "＋ Add photo to canvas"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple
            disabled={busy || (page.photoIds?.length ?? 0) >= 6}
            aria-label="Add photo to canvas"
            onChange={(e) => {
              void upload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <button type="button" onClick={() => {
          if (movable) { setArranging(false); setSelected(""); setSelectedSticker(""); }
          else { onArrange(); setArranging(true); }
        }} aria-pressed={movable}>
          Arrange photos & stickers {movable ? "· On" : "· Off"}
        </button>
        {movable && selected && (page.photoIds ?? []).includes(selected) && (
          <button
            type="button"
            className="danger"
            onClick={() => {
              remember();
              const layout = { ...page.photoLayout };
              delete layout[selected];
              onChange({
                photoIds: (page.photoIds ?? []).filter((id) => id !== selected),
                photoLayout: layout,
              });
              setSelected("");
            }}
          >
            Remove selected photo
          </button>
        )}
        {undo && (
          <button
            type="button"
            onClick={() => {
              onChange(undo);
              setUndo(null);
            }}
          >
            Undo photo change
          </button>
        )}
        <small>
          {movable
            ? "Drag photos anywhere inside the canvas. Drag the corner to resize. Arrow keys move a selected photo."
            : "Turn on Arrange photos & stickers to move or resize. Turn it off for a clean page."}
        </small>
      </div>
      <StickerPicker
        page={page}
        onChange={onChange}
        onArrange={onArrange}
        selected={selectedSticker}
        setSelected={setSelectedSticker}
      />
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      <div ref={padRef} className={className}>
        <div className="canvas-photo-layer">
          {photos.map((photo) => {
            const p =
              draft?.id === photo.id ? draft.position : position(photo.id);
            return (
              <div
                key={photo.id}
                role="button"
                tabIndex={movable ? 0 : -1}
                aria-label={`Move photo ${photo.name}`}
                aria-pressed={movable && selected === photo.id}
                className={
                  "canvas-photo" +
                  (selected === photo.id && movable ? " selected" : "")
                }
                style={{
                  left: p.x + "%",
                  top: p.y + "%",
                  width: p.width + "%",
                  height: p.height + "%",
                  pointerEvents: movable ? "auto" : "none",
                }}
                onPointerDown={(e) => start(e, photo.id, false)}
                onPointerMove={move}
                onPointerUp={finish}
                onPointerCancel={finish}
                onClick={() => setSelected(photo.id)}
                onKeyDown={(e) => {
                  if (movable && e.key === "Escape") { setSelected(""); return; }
                  if (movable && selected === photo.id && ["Delete", "Backspace"].includes(e.key)) {
                    e.preventDefault(); remember();
                    const layout = { ...page.photoLayout }; delete layout[photo.id];
                    onChange({ photoIds: (page.photoIds ?? []).filter(id => id !== photo.id), photoLayout: layout });
                    setSelected(""); return;
                  }
                  if (
                    !movable ||
                    ![
                      "ArrowLeft",
                      "ArrowRight",
                      "ArrowUp",
                      "ArrowDown",
                    ].includes(e.key)
                  )
                    return;
                  e.preventDefault();
                  remember();
                  const delta = e.shiftKey ? 5 : 1;
                  onChange({
                    photoLayout: {
                      ...page.photoLayout,
                      [photo.id]: {
                        ...p,
                        x: clamp(
                          p.x +
                            (e.key === "ArrowRight"
                              ? delta
                              : e.key === "ArrowLeft"
                                ? -delta
                                : 0),
                          0,
                          100 - p.width,
                        ),
                        y: clamp(
                          p.y +
                            (e.key === "ArrowDown"
                              ? delta
                              : e.key === "ArrowUp"
                                ? -delta
                                : 0),
                          0,
                          100 - p.height,
                        ),
                      },
                    },
                  });
                }}
              >
                <img src={photo.data} alt={photo.name} draggable={false} />
                {movable && selected === photo.id && (
                  <div
                    role="button"
                    aria-label={`Resize photo ${photo.name}`}
                    className="photo-resize-handle"
                    onPointerDown={(e) => start(e, photo.id, true)}
                    onPointerMove={move}
                    onPointerUp={finish}
                    onPointerCancel={finish}
                  />
                )}
              </div>
            );
          })}
        </div>
        <StickerLayer
          page={page}
          onChange={onChange}
          movable={movable}
          selected={selectedSticker}
          setSelected={setSelectedSticker}
        />
        {children}
      </div>
    </>
  );
}
