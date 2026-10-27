import { validStickers } from "./stickers.ts";
import type { NotebookPage } from "./notebook";
import type { WeekPlan } from "./planner";
import { validatePlans } from "./planner.ts";
export type Attempt = {
  id: string;
  date: string;
  changes: string;
  result: string;
  rating: number;
  photoIds?: string[];
};

export type Recipe = {
  id: string;
  title: string;
  category: string;
  servings: number;
  ingredients: string;
  steps: string;
  notes: string;
  attempts: Attempt[];
  photoIds?: string[];
  journalPages?: NotebookPage[];
  deletedAt?: number;
};

export type Photo = { id: string; name: string; data: string };
export type JournalBackup = {
  version: 2;
  recipes: Recipe[];
  photos: Photo[];
  planner?: WeekPlan[];
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validIds(value: unknown): boolean {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.length <= 6 &&
      value.every((id) => typeof id === "string"))
  );
}

function validPages(value: unknown): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > 200) return false;
  if (
    new Set(value.map((p) => (record(p) ? p.id : null))).size !== value.length
  )
    return false;
  return value.every(
    (p) =>
      record(p) &&
      typeof p.id === "string" &&
      typeof p.title === "string" &&
      typeof p.text === "string" &&
      typeof p.template === "string" &&
      ["lined", "dots", "plain"].includes(String(p.paper)) &&
      validIds(p.photoIds) &&
      validStickers(p.stickers) &&
      (p.photoLayout === undefined ||
        (record(p.photoLayout) &&
          Object.keys(p.photoLayout).length <= 6 &&
          Object.entries(p.photoLayout).every(
            ([id, box]) =>
              Array.isArray(p.photoIds) &&
              p.photoIds.includes(id) &&
              record(box) &&
              [box.x, box.y, box.width, box.height].every(
                (n) => typeof n === "number" && Number.isFinite(n),
              ) &&
              Number(box.x) >= 0 &&
              Number(box.y) >= 0 &&
              Number(box.width) >= 10 &&
              Number(box.height) >= 10 &&
              Number(box.x) + Number(box.width) <= 100.001 &&
              Number(box.y) + Number(box.height) <= 100.001,
          ))) &&
      (p.color === undefined ||
        (typeof p.color === "string" && /^#[0-9a-fA-F]{6}$/.test(p.color))) &&
      (p.fields === undefined ||
        (record(p.fields) &&
          Object.keys(p.fields).length <= 30 &&
          Object.values(p.fields).every(
            (value) => typeof value === "string",
          ))) &&
      Array.isArray(p.strokes) &&
      p.strokes.length <= 1000 &&
      p.strokes.every(
        (s) =>
          record(s) &&
          typeof s.id === "string" &&
          typeof s.color === "string" &&
          /^#[0-9a-fA-F]{6}$/.test(s.color) &&
          typeof s.width === "number" &&
          (s.style === undefined ||
            ["ballpoint", "pencil", "highlighter"].includes(String(s.style))) &&
          (s.region === undefined || s.region === "pad") &&
          s.width >= 1 &&
          s.width <= 20 &&
          Array.isArray(s.points) &&
          s.points.length > 0 &&
          s.points.length <= 4000 &&
          s.points.every(
            (point) =>
              record(point) &&
              typeof point.x === "number" &&
              Number.isFinite(point.x) &&
              point.x >= 0 &&
              point.x <= 900 &&
              typeof point.y === "number" &&
              Number.isFinite(point.y) &&
              point.y >= 0 &&
              point.y <= 1100 &&
              typeof point.pressure === "number" &&
              Number.isFinite(point.pressure) &&
              point.pressure >= 0 &&
              point.pressure <= 1,
          ),
      ),
  );
}

export function validateRecipes(value: unknown): asserts value is Recipe[] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (r) =>
        record(r) &&
        ["id", "title", "category", "ingredients", "steps", "notes"].every(
          (key) => typeof r[key] === "string",
        ) &&
        typeof r.servings === "number" &&
        (r.deletedAt === undefined ||
          (typeof r.deletedAt === "number" && Number.isFinite(r.deletedAt))) &&
        Number.isFinite(r.servings) &&
        r.servings >= 1 &&
        r.servings <= 100 &&
        validIds(r.photoIds) &&
        validPages(r.journalPages) &&
        Array.isArray(r.attempts) &&
        r.attempts.every(
          (a) =>
            record(a) &&
            ["id", "date", "changes", "result"].every(
              (key) => typeof a[key] === "string",
            ) &&
            typeof a.rating === "number" &&
            Number.isInteger(a.rating) &&
            a.rating >= 1 &&
            a.rating <= 5 &&
            validIds(a.photoIds),
        ),
    )
  ) {
    throw new Error("This file does not contain a valid Savorly journal.");
  }
  const ids = value.map((r) => r.id);
  if (new Set(ids).size !== ids.length)
    throw new Error("Recipe IDs must be unique.");
}

export function photoIdsFor(recipes: Recipe[]): string[] {
  return [
    ...new Set(
      recipes.flatMap((r) => [
        ...(r.photoIds ?? []),
        ...(r.journalPages ?? []).flatMap((p) => p.photoIds ?? []),
        ...r.attempts.flatMap((a) => a.photoIds ?? []),
      ]),
    ),
  ];
}

export function parseBackup(value: unknown): JournalBackup {
  // Journals exported by the first version contained just the recipe array.
  if (Array.isArray(value)) {
    validateRecipes(value);
    if (photoIdsFor(value).length)
      throw new Error(
        "This backup references photos but does not include them.",
      );
    return { version: 2, recipes: value, photos: [] };
  }
  if (!record(value) || value.version !== 2 || !Array.isArray(value.photos))
    throw new Error("Unsupported journal backup.");
  validateRecipes(value.recipes);
  const photos: Photo[] = [];
  for (const p of value.photos) {
    if (
      !record(p) ||
      typeof p.id !== "string" ||
      typeof p.name !== "string" ||
      typeof p.data !== "string" ||
      !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p.data) ||
      p.data.length > 1500000
    ) {
      throw new Error("The backup contains an invalid or oversized photo.");
    }
    photos.push({ id: p.id, name: p.name, data: p.data });
  }
  if (new Set(photos.map((p) => p.id)).size !== photos.length)
    throw new Error("Photo IDs must be unique.");
  const available = new Set(photos.map((p) => p.id));
  if (photoIdsFor(value.recipes).some((id) => !available.has(id)))
    throw new Error("Some photos are missing from this backup.");
  if (value.planner !== undefined) validatePlans(value.planner);
  return {
    version: 2,
    recipes: value.recipes,
    photos,
    ...(value.planner !== undefined ? { planner: value.planner } : {}),
  };
}
