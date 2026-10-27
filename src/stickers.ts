export const stickerKinds = [
  "pasta",
  "strawberry",
  "mushroom",
  "flower",
  "cat",
  "chicken",
  "heart",
  "sparkle",
  "coffee",
  "bread",
] as const;
export type StickerKind = (typeof stickerKinds)[number];
export type Sticker = {
  id: string;
  kind: StickerKind;
  x: number;
  y: number;
  size: number;
  rotation: number;
};
export function validStickers(value: unknown): value is Sticker[] | undefined {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.length <= 30 &&
      new Set(value.map((s) => s?.id)).size === value.length &&
      value.every(
        (s) =>
          s &&
          typeof s.id === "string" &&
          stickerKinds.includes(s.kind) &&
          [s.x, s.y, s.size, s.rotation].every(
            (n) => typeof n === "number" && Number.isFinite(n),
          ) &&
          s.size >= 5 &&
          s.size <= 30 &&
          s.x >= 0 &&
          s.y >= 0 &&
          s.x + s.size <= 100.001 &&
          s.y + s.size <= 100.001 &&
          Math.abs(s.rotation) <= 30,
      ))
  );
}
