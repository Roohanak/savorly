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
  "croissant",
  "cupcake",
  "cake",
  "cookie",
  "pie",
  "pancakes",
  "cherries",
  "lemon",
  "carrot",
  "avocado",
  "teapot",
  "jar",
  "whisk",
  "bow",
  "bee",
  "butterfly",
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
          Math.abs(s.rotation) <= 180,
      ))
  );
}

export function resizeSticker(
  sticker: Sticker,
  dx: number,
  dy: number,
  width: number,
  height: number,
): Sticker {
  if (width <= 0 || height <= 0) return sticker;
  const delta =
    (100 * (dx * width + dy * height)) / (width * width + height * height);
  const size = Math.max(
    5,
    Math.min(30, 100 - sticker.x, 100 - sticker.y, sticker.size + delta),
  );
  return { ...sticker, size };
}

export function rotateSticker(start: number, deltaRadians: number) {
  return ((start + (deltaRadians * 180) / Math.PI + 540) % 360) - 180;
}
