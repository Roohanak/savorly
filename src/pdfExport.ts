import type { jsPDF as PdfType } from "jspdf";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import type { Recipe } from "./model";
import type { NotebookPage } from "./notebook";
import type { WeekPlan } from "./planner";
import { pagesFor, templateDesign } from "./notebook";
import { getPhoto } from "./photoStore";
import { shoppingFor } from "./planner";
import StickerArt from "./StickerArt";
export function pdfFilename(title: string) {
  return (
    (Array.from(title.trim())
      .map((c) => (c.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(c) ? "-" : c))
      .join("")
      .slice(0, 90) || "Savorly") + ".pdf"
  );
}
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("An image could not be prepared for the PDF."));
    img.src = src;
  });
}
class Paper {
  pdf: PdfType;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  y = 85;
  number = 1;
  pageColor = "#fffdf8";
  accent = "#a73e4b";
  wallpaper: HTMLImageElement | null = null;
  async decorate(page: Pick<NotebookPage, "template" | "color">, appearance?: string) {
    const design = templateDesign(page.template);
    const toddler = appearance === "toddler" || page.template.startsWith("toddler");
    this.pageColor = toddler ? "#f8f1fc" : page.color ?? design.color;
    this.accent = toddler ? "#916092" : design.accent;
    this.wallpaper = toddler
      ? await loadImage("/backgrounds/toddler-daydreams.svg") : null;
    this.clear();
  }
  constructor(pdf: PdfType) {
    this.pdf = pdf;
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1190;
    this.canvas.height = 1684;
    const c = this.canvas.getContext("2d");
    if (!c) throw new Error("PDF drawing is unavailable in this browser.");
    this.ctx = c;
    this.clear();
  }
  clear() {
    this.ctx.fillStyle = this.pageColor;
    this.ctx.fillRect(0, 0, 1190, 1684);
    if (this.wallpaper) {
      const c = this.ctx;
      c.save();
      c.globalAlpha = 0.32;
      for (let y = 0; y < 1684; y += 640)
        for (let x = 0; x < 1190; x += 720) c.drawImage(this.wallpaper, x, y, 720, 640);
      c.restore();
    }
    this.y = 85;
  }
  flush() {
    this.ctx.fillStyle = "#9a7268";
    this.ctx.font = "21px Arial";
    this.ctx.fillText(`Savorly · ${this.number}`, 80, 1630);
    this.pdf.addImage(
      this.canvas.toDataURL("image/jpeg", 0.92),
      "JPEG",
      0,
      0,
      210,
      297,
      undefined,
      "FAST",
    );
  }
  next() {
    this.flush();
    this.pdf.addPage();
    this.number++;
    this.clear();
  }
  room(height: number) {
    if (this.y + height > 1560) this.next();
  }
  text(text: string, size = 27, color = "#513e38", heading = false) {
    this.ctx.font = `${heading ? "700" : "400"} ${size}px ${heading ? "Gaegu, Arial" : "Arial"}`;
    for (const paragraph of String(text).split("\n")) {
      const words = paragraph.split(/\s+/);
      let line = "";
      const paint = (value: string) => {
        this.room(size * 1.55);
        this.ctx.font = `${heading ? "700" : "400"} ${size}px ${heading ? "Gaegu, Arial" : "Arial"}`;
        this.ctx.fillStyle = color;
        this.ctx.fillText(value, 80, this.y);
        this.y += size * 1.5;
      };
      for (const word of words) {
        const trial = line ? line + " " + word : word;
        if (this.ctx.measureText(trial).width <= 1030) {
          line = trial;
          continue;
        }
        if (line) paint(line);
        line = "";
        for (const char of word) {
          if (this.ctx.measureText(line + char).width > 1030) {
            paint(line);
            line = "";
          }
          line += char;
        }
      }
      paint(line);
    }
  }
  heading(title: string) {
    this.y += 15;
    this.text(title, 40, this.accent, true);
  }
  field(label: string, value: string) {
    const c = this.ctx;
    c.font = "400 27px Arial";
    const lines: string[] = [];
    for (const paragraph of value.split("\n")) {
      let line = "";
      for (const char of paragraph) {
        if (c.measureText(line + char).width > 1010) { lines.push(line); line = ""; }
        line += char;
      }
      lines.push(line);
    }
    if (!value.trim()) lines.splice(0, lines.length, "", "");
    let index = 0;
    while (index < lines.length) {
      this.room(160);
      const capacity = Math.max(1, Math.floor((1530 - this.y - 85) / 41));
      const chunk = lines.slice(index, index + capacity);
      const height = 80 + chunk.length * 41;
      c.fillStyle = "#fffdfbf2";
      c.fillRect(65, this.y - 25, 1060, height);
      c.strokeStyle = this.accent;
      c.lineWidth = 1;
      c.strokeRect(65, this.y - 25, 1060, height);
      this.text(label + (index ? " (continued)" : ""), 32, this.accent, true);
      c.font = "400 27px Arial";
      for (const line of chunk) {
        c.fillStyle = "#513e38";
        c.fillText(line, 80, this.y);
        if (!value.trim()) {
          c.strokeStyle = "#dcd3df";
          c.beginPath(); c.moveTo(85,this.y + 5); c.lineTo(1100,this.y + 5); c.stroke();
        }
        this.y += 41;
      }
      this.y += 32;
      index += chunk.length;
      if (index < lines.length) this.next();
    }
  }
  async photo(id: string) {
    const p = await getPhoto(id);
    if (!p)
      throw new Error(
        "A saved photo is missing. Restore its backup before exporting.",
      );
    return loadImage(p.data);
  }
  image(img: HTMLImageElement, x: number, y: number, w: number, h: number) {
    const ratio = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const iw = img.naturalWidth * ratio,
      ih = img.naturalHeight * ratio;
    this.ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  }
  async photos(ids: string[]) {
    for (const id of ids) {
      this.room(420);
      this.image(await this.photo(id), 80, this.y, 1030, 380);
      this.y += 400;
    }
  }
  async sketch(page: NotebookPage, legacy = false) {
    this.room(705);
    const c = this.ctx,
      x = 80,
      y = this.y,
      W = 1030,
      H = 630;
    c.save();
    c.translate(x, y);
    c.fillStyle = page.color ?? "#fffdf8";
    c.fillRect(0, 0, W, H);
    c.beginPath();
    c.rect(0, 0, W, H);
    c.clip();
    c.strokeStyle = "#d7cec2";
    c.fillStyle = "#c8bfae";
    c.lineWidth = 1;
    if (page.paper === "lined")
      for (let n = 35; n < H; n += 35) {
        c.beginPath();
        c.moveTo(0, n);
        c.lineTo(W, n);
        c.stroke();
      }
    if (page.paper === "dots")
      for (let a = 20; a < W; a += 20)
        for (let b = 20; b < H; b += 20) {
          c.beginPath();
          c.arc(a, b, 1, 0, Math.PI * 2);
          c.fill();
        }
    if (!legacy) {
      for (const [i, id] of (page.photoIds ?? []).entries()) {
        const p = page.photoLayout?.[id] ?? {
          x: 8 + (i % 3) * 28,
          y: 10 + Math.floor(i / 3) * 38,
          width: 24,
          height: 32,
        };
        this.image(
          await this.photo(id),
          (p.x * W) / 100,
          (p.y * H) / 100,
          (p.width * W) / 100,
          (p.height * H) / 100,
        );
      }
      for (const s of page.stickers ?? []) {
        const svg = renderToStaticMarkup(
          createElement(StickerArt, { kind: s.kind }),
        ).replace("<svg", '<svg width="100" height="100"');
        const img = await loadImage(
          "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg),
        );
        const w = (s.size * W) / 100,
          h = (s.size * H) / 100,
          d = Math.min(w, h);
        c.save();
        c.translate((s.x * W) / 100 + w / 2, (s.y * H) / 100 + h / 2);
        c.rotate((s.rotation * Math.PI) / 180);
        c.drawImage(img, -d / 2, -d / 2, d, d);
        c.restore();
      }
    }
    for (const s of page.strokes.filter((s) =>
      legacy ? s.region !== "pad" : s.region === "pad",
    )) {
      const points = s.points.map((p) => ({
        x: (p.x * W) / 900,
        y: (p.y * H) / 1100,
      }));
      if (!points.length) continue;
      c.beginPath();
      c.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length - 1; i++)
        c.quadraticCurveTo(
          points[i].x,
          points[i].y,
          (points[i].x + points[i + 1].x) / 2,
          (points[i].y + points[i + 1].y) / 2,
        );
      const end = points[points.length - 1];
      c.lineTo(end.x + 0.01, end.y);
      c.strokeStyle = s.color;
      c.lineWidth = s.width * 1.3;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.globalAlpha =
        s.style === "highlighter" ? 0.28 : s.style === "pencil" ? 0.65 : 1;
      c.setLineDash(s.style === "pencil" ? [1, 0.7] : []);
      c.stroke();
    }
    c.restore();
    this.y += 660;
  }
  save(title: string) {
    this.flush();
    this.pdf.save(pdfFilename(title));
  }
}
async function writer() {
  await document.fonts.ready;
  const { jsPDF } = await import("jspdf");
  return new Paper(new jsPDF({ unit: "mm", format: "a4", compress: true }));
}
export async function exportRecipe(recipe: Recipe, appearance?: string) {
  const p = await writer();
  if (appearance === "toddler") await p.decorate({ template: "toddler" }, appearance);
  p.text(recipe.title || "Untitled recipe", 54, p.accent, true);
  p.text([recipe.category, recipe.subcategory].filter(Boolean).join(" / "), 24);
  p.text(`Servings: ${recipe.servings}`, 25);
  p.heading("Ingredients");
  p.text(recipe.ingredients || "No ingredients recorded.");
  p.heading("Method");
  p.text(
    recipe.steps
      .split("\n")
      .filter((s) => s.trim())
      .map((s, i) => `${i + 1}. ${s}`)
      .join("\n") || "No method recorded.",
  );
  if (recipe.notes.trim()) {
    p.heading("Kitchen notes");
    p.text(recipe.notes);
  }
  if (recipe.photoIds?.length) {
    p.heading("Recipe photos");
    await p.photos(recipe.photoIds);
  }
  p.save(recipe.title);
}
export async function exportNotebook(
  recipe: Recipe,
  weeks: WeekPlan[] = [],
  week = "",
  recipes: Recipe[] = [recipe],
  selectedPage?: NotebookPage,
  appearance?: string,
) {
  const p = await writer();
  const pages = selectedPage ? [selectedPage] : pagesFor(recipe);
  if (!pages.length) {
    p.text(recipe.title, 54, "#a73e4b", true);
    p.text("This notebook has no pages yet.");
  }
  for (const [i, page] of pages.entries()) {
    if (i) p.next();
    await p.decorate(page, appearance);
    p.text(recipe.title || "Kitchen notebook", 25, "#9b6d63");
    p.text(page.title || `Page ${i + 1}`, 50, p.accent, true);
    const toddler = appearance === "toddler" || page.template.startsWith("toddler");
    p.text((toddler && !page.template.startsWith("toddler") ? "Little days · " : "") + templateDesign(page.template).format, 25, p.accent);
    const design = templateDesign(page.template);
    for (const field of design.fields) {
      const value = page.fields?.[field.id];
      if (page.template !== "weekly" || value?.trim()) p.field(field.label, value ?? "");
    }
    if (page.text.trim()) {
      p.heading(toddler ? "Little notes & happy moments" : "Notebook notes");
      p.text(page.text);
    }
    if (page.template === "weekly") {
      const plan = weeks.find((w) => w.week === week);
      p.heading(`Meal plan · week of ${week || "not selected"}`);
      if (plan) {
        for (const m of plan.meals)
          p.text(
            `${m.date} · ${m.slot}: ${m.label} (${m.servings} servings)${m.cooked ? " · cooked" : ""}`,
            25,
          );
        if (plan.notes) p.text(plan.notes);
        p.heading("Grocery list");
        p.text(
          [
            ...shoppingFor(plan, recipes, false).map((x) => x.label),
            ...plan.customShopping,
          ].join("\n") || "No items recorded.",
        );
        for (const [label, value] of Object.entries(plan.stickyNotes ?? {}))
          if (value) {
            p.heading(label);
            p.text(value);
          }
      }
    }
    if (
      page.template === "blank" || page.paper !== "plain" ||
      page.strokes.some((s) => s.region === "pad") ||
      page.photoIds?.length ||
      page.stickers?.length
    ) {
      p.room(780);
      p.heading(toddler ? "Little doodles & keepsakes" : "Sketches, photos & stickers");
      await p.sketch(page);
    }
    if (page.strokes.some((s) => s.region !== "pad")) {
      p.room(780);
      p.heading("Earlier handwriting");
      await p.sketch(page, true);
    }
  }
  p.save(recipe.title + " - " + (selectedPage ? selectedPage.title || "page" : "notebook"));
}
