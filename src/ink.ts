import type { InkPoint } from "./notebook";
export function inkPoint(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  pressure = 0.5,
): InkPoint {
  return {
    x: Math.max(0, Math.min(900, ((clientX - rect.left) * 900) / rect.width)),
    y: Math.max(0, Math.min(1100, ((clientY - rect.top) * 1100) / rect.height)),
    pressure: Math.max(0.1, Math.min(1, pressure)),
  };
}
export function strokePath(points: InkPoint[]) {
  if (!points.length) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y} l0.01,0`;
  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i],
      next = points[i + 1];
    path += ` Q${p.x},${p.y} ${(p.x + next.x) / 2},${(p.y + next.y) / 2}`;
  }
  const end = points[points.length - 1];
  return path + ` L${end.x},${end.y}`;
}
