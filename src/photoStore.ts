import { newId } from "./id.ts";
import type { WeekPlan } from "./planner";
import type { JournalBackup, Photo, Recipe } from "./model";
import { photoIdsFor } from "./model";

let database: Promise<IDBDatabase> | undefined;
function openDatabase() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("savorly-media", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("photos", { keyPath: "id" });
      request.result.createObjectStore("recovery");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      database = undefined;
      reject(
        new Error(
          "Photo storage is unavailable. Check your browser storage settings.",
        ),
      );
    };
    request.onblocked = () => {
      database = undefined;
      reject(new Error("Close other Savorly tabs and try again."));
    };
  });
  return database;
}

export async function getPhoto(id: string): Promise<Photo | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction("photos").objectStore("photos").get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Could not read a saved photo."));
  });
}

export async function putPhotos(photos: Photo[]) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("photos", "readwrite");
    for (const photo of photos) transaction.objectStore("photos").put(photo);
    transaction.oncomplete = () => resolve();
    transaction.onerror = transaction.onabort = () =>
      reject(
        new Error("Could not save photos. Your device may be out of storage."),
      );
  });
}

export async function makeBackup(
  recipes: Recipe[],
  planner?: WeekPlan[],
): Promise<JournalBackup> {
  const photos = await Promise.all(photoIdsFor(recipes).map(getPhoto));
  if (photos.some((p) => !p))
    throw new Error(
      "Some photos are missing from browser storage. Remove missing photos or restore a complete backup first.",
    );
  return {
    version: 2,
    recipes,
    photos: photos as Photo[],
    ...(planner ? { planner } : {}),
  };
}

export async function saveRecovery(backup: JournalBackup) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("recovery", "readwrite");
    transaction.objectStore("recovery").put(backup, "before-replace");
    transaction.oncomplete = () => resolve();
    transaction.onerror = transaction.onabort = () =>
      reject(
        new Error(
          "Could not save a recovery copy. Export your journal before replacing it.",
        ),
      );
  });
}

export async function getRecovery(): Promise<JournalBackup | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction("recovery")
      .objectStore("recovery")
      .get("before-replace");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error("Could not read the recovery copy."));
  });
}

export async function preparePhoto(file: File): Promise<Photo> {
  if (
    ![
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ].includes(file.type)
  ) {
    throw new Error(
      "Choose a JPEG, PNG or WebP photo. On iPad, export HEIC as JPEG if your browser cannot read it.",
    );
  }
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Choose a photo smaller than 20 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw new Error(
        "This image format could not be opened. On iPad, choose a JPEG or PNG version.",
      );
    }
    const ratio = Math.min(
      1,
      1600 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare the photo.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let data = canvas.toDataURL("image/jpeg", 0.8);
    if (data.length > 1000000) data = canvas.toDataURL("image/jpeg", 0.55);
    if (data.length > 1500000)
      throw new Error(
        "This photo is too detailed to save. Try a smaller version.",
      );
    // Canvas re-encoding removes EXIF metadata (including GPS) from uploaded originals.
    return { id: newId(), name: file.name, data };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadBackup(
  backup: JournalBackup,
  name = "savorly-journal.json",
) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(backup)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
