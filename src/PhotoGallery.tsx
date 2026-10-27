import { useEffect, useRef, useState } from "react";
import type { Photo } from "./model";
import { getPhoto, preparePhoto, putPhotos } from "./photoStore";

type Props = {
  ids: string[];
  onChange: (ids: string[]) => void;
  label: string;
  onBusyChange?: (busy: boolean) => void;
};

export default function PhotoGallery({
  ids,
  onChange,
  label,
  onBusyChange,
}: Props) {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadedIds, setLoadedIds] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Photo | null>(null);
  // Stable dependency even when the parent supplies an empty array.
  const idList = JSON.stringify(ids);
  useEffect(() => {
    let active = true;
    Promise.all((JSON.parse(idList) as string[]).map(getPhoto))
      .then((items) => {
        if (active) {
          setPhotos(items.filter((item): item is Photo => Boolean(item)));
          setLoadedIds(idList);
          setError(
            items.some((item) => !item)
              ? "A saved photo is missing. Restore a complete backup to recover it."
              : "",
          );
        }
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error ? err.message : "Could not load photos.",
          );
      });
    return () => {
      active = false;
    };
  }, [idList]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    if (ids.length + files.length > 6) {
      setError("Keep up to 6 photos per recipe or attempt.");
      return;
    }
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try {
      const added: Photo[] = [];
      // Decode one at a time to limit memory use on tablets.
      for (const file of Array.from(files))
        added.push(await preparePhoto(file));
      await putPhotos(added);
      if (mounted.current)
        onChange([...ids, ...added.map((photo) => photo.id)]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save these photos.",
      );
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  }

  return (
    <section className="photo-section" aria-label={label}>
      <div className="photo-heading">
        <h3>{label}</h3>
        <span>{ids.length} / 6</span>
      </div>
      <p className="photo-help">
        Keep the result, the texture, the little details.
      </p>
      <div className="photo-grid">
        {photos.map((photo) => (
          <figure key={photo.id}>
            <button
              className="photo-open"
              type="button"
              onClick={() => setPreview(photo)}
              aria-label={`View ${photo.name}`}
            >
              <img src={photo.data} alt={photo.name} loading="lazy" />
            </button>
            <figcaption>
              <span>{photo.name}</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => onChange(ids.filter((id) => id !== photo.id))}
                aria-label={`Remove ${photo.name}`}
              >
                Remove
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
      <label
        className={
          "photo-picker " + (busy || ids.length >= 6 ? "disabled" : "")
        }
      >
        ＋ {busy ? "Preparing photos…" : "Add photos"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          disabled={busy || ids.length >= 6}
          onChange={(e) => {
            void upload(e.target.files);
            e.target.value = "";
          }}
          aria-label={`Add ${label.toLowerCase()}`}
        />
      </label>
      <small>
        JPEG, PNG or WebP · up to 20 MB each · resized for your journal
      </small>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {loadedIds === idList && ids.length > photos.length && (
        <button
          type="button"
          className="text-button"
          onClick={() => onChange(photos.map((p) => p.id))}
        >
          Remove missing photo references
        </button>
      )}
      {preview && (
        <div
          className="photo-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo preview"
          onKeyDown={(e) => {
            if (e.key === "Escape") setPreview(null);
          }}
        >
          <button type="button" autoFocus onClick={() => setPreview(null)}>
            Close photo
          </button>
          <img src={preview.data} alt={preview.name} />
          <p>{preview.name}</p>
        </div>
      )}
    </section>
  );
}
