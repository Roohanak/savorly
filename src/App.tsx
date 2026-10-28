import JournalLibrary from "./JournalLibrary";
import NutritionPanel from "./NutritionPanel";
import PdfExportButton from "./PdfExportButton";
import {
  categoryOptions,
  defaultSubcategories,
  sameCategory,
} from "./categories";
import RecipeBook from "./RecipeBook";
import AIResult from "./AIResult";
import type { RecipeDraft } from "./recipeDraft";
import SharedPlanner from "./SharedPlanner";
import { PlannerContext } from "./plannerContext";
import type { WeekPlan } from "./planner";
import { loadPlans, monday } from "./planner";
import { newId } from "./id.ts";
import { useRef, useState, useSyncExternalStore } from "react";
import type { JournalBackup, Recipe } from "./model";
import { parseBackup, validateRecipes } from "./model";
import PhotoGallery from "./PhotoGallery";
import CloudSync from "./CloudSync";
import {
  downloadBackup,
  getRecovery,
  makeBackup,
  putPhotos,
  saveRecovery,
} from "./photoStore";
import JournalWorkspace, { TemplateLibrary } from "./JournalWorkspace";
import { newNotebookPage, pagesFor } from "./notebook";
import "./App.css";
import "./Notebook.css";

const sections = [
  [
    "journal",
    "✎",
    "My journal",
    "A place for the beautiful mess.",
    "Write, sketch, and keep the little discoveries.",
  ],
  [
    "recipes",
    "♧",
    "Recipe book",
    "Recipes worth keeping.",
    "Give your best experiments a recipe you can repeat.",
  ],
  [
    "attempts",
    "↗",
    "Attempt log",
    "A little better, every time.",
    "Keep the changes, the photos, and what you learned.",
  ],
  [
    "planner",
    "▦",
    "Meal planner",
    "Make room for good food.",
    "Plan meals, use your recipes, and build your shopping list.",
  ],
  [
    "templates",
    "▤",
    "Templates",
    "Start with a little inspiration.",
    "Choose a page for the way you like to think.",
  ],
  [
    "companion",
    "✧",
    "AI companion",
    "A little help in the kitchen.",
    "Turn your typed notes into your next good idea.",
  ],
  [
    "settings",
    "⚙",
    "Settings & sync",
    "Keep your kitchen close.",
    "Back up your notebook or connect your other devices.",
  ],
] as const;
function subscribeRoute(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}
function useRoute() {
  const hash = useSyncExternalStore(
    subscribeRoute,
    () => window.location.hash,
    () => "",
  );
  const parts = hash.replace(/^#\/?/, "").split("/");
  let recipeId = "";
  try {
    recipeId = decodeURIComponent(parts[1] ?? "");
  } catch {
    /* malformed URL falls back to the first recipe */
  }
  return {
    page: sections.some((s) => s[0] === parts[0]) ? parts[0] : "journal",
    recipeId,
  };
}

const sample: Recipe = {
  id: "crepe",
  title: "Lentil & cottage cheese crepes",
  category: "Breakfast",
  servings: 2,
  ingredients:
    "1 cup soaked red lentils\n0.5 cup cottage cheese\n0.25 cup water\n1 tsp cumin\n0.5 tsp salt",
  steps:
    "Blend the soaked lentils, cottage cheese, water, cumin and salt until smooth.\nHeat a lightly oiled nonstick pan over medium heat.\nSpread a thin layer of batter and cook until set.\nFlip and cook the other side until golden.",
  notes:
    "I want a soft middle with crisp edges. A thinner batter was easier to spread. Try a little more water next time.",
  attempts: [
    {
      id: "first",
      date: "2026-10-17",
      changes: "Used a thick batter with less water.",
      result: "Good flavor, but too thick to spread evenly.",
      rating: 3,
    },
  ],
};
const storageKey = "savorly-recipes-v1";
function load(): Recipe[] {
  try {
    const value = localStorage.getItem(storageKey);
    if (!value) return [sample];
    const parsed: unknown = JSON.parse(value);
    validateRecipes(parsed);
    return parsed;
  } catch {
    return [sample];
  }
}
function scaleIngredients(text: string, ratio: number) {
  return text
    .split("\n")
    .map((line) =>
      line.replace(
        /^(\s*)(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)(?=\s|$)/,
        (_all, space: string, number: string) => {
          const amount = number.split(/\s+/).reduce((sum, part) => {
            const [a, b] = part.split("/").map(Number);
            return sum + (b ? a / b : a);
          }, 0);
          return space + String(Math.round(amount * ratio * 100) / 100);
        },
      ),
    )
    .join("\n");
}
export default function App() {
  const [appearance, setAppearance] = useState(() => {
    try {
      const saved = localStorage.getItem("savorly-appearance");
      return saved === "plain" || saved === "toddler" ? saved : "scrapbook";
    } catch { return "scrapbook"; }
  });
  const scrapbook = appearance !== "plain";
  function changeAppearance(next: string) {
    setAppearance(next);
    try { localStorage.setItem("savorly-appearance", next); } catch { /* Optional preference. */ }
  }
  const [records, setRecipeState] = useState<Recipe[]>(load);
  const recipes = records.filter((r) => !r.deletedAt);
  const trash = records.filter((r) => r.deletedAt);
  const recipesRef = useRef(records);
  const [plans, setPlansState] = useState<WeekPlan[]>(loadPlans);
  const plansRef = useRef(plans);
  const [plannerWeek, setPlannerWeekState] = useState(() => {
    try {
      const saved = localStorage.getItem("savorly-planner-week");
      return saved && /^\d{4}-\d{2}-\d{2}$/.test(saved) ? saved : monday();
    } catch {
      return monday();
    }
  });
  function setPlannerWeek(week: string) {
    setPlannerWeekState(week);
    try {
      localStorage.setItem("savorly-planner-week", week);
    } catch {
      /* Optional view preference. */
    }
  }
  function updatePlans(next: WeekPlan[]) {
    plansRef.current = next;
    setPlansState(next);
    try {
      localStorage.setItem("savorly-planner-v1", JSON.stringify(next));
      setStatus("Planner saved");
    } catch {
      setStatus(
        "Planner storage is unavailable. Export a backup to keep your changes.",
      );
    }
  }
  const [deletedId, setDeletedId] = useState("");
  const [removedAttempt, setRemovedAttempt] = useState<{
    recipeId: string;
    attempt: Recipe["attempts"][number];
  } | null>(null);

  const route = useRoute();
  const page = route.page;
  const selected = recipes.some((r) => r.id === route.recipeId)
    ? route.recipeId
    : (recipes[0]?.id ?? "");
  const [focusPage, setFocusPage] = useState("");
  function navigate(destination: string, id = selected) {
    window.location.assign(
      "#/" + destination + (id ? "/" + encodeURIComponent(id) : ""),
    );
    window.scrollTo({ top: 0, behavior: "instant" });
  }



  const [status, setStatus] = useState("");
  const [target, setTarget] = useState(2);
  const [changes, setChanges] = useState("");
  const [result, setResult] = useState("");
  const [rating, setRating] = useState(4);
  const [draftPhotoIds, setDraftPhotoIds] = useState<string[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [journalBusy, setJournalBusy] = useState(false);
  const [output, setOutput] = useState("");
  const [outputMeta, setOutputMeta] = useState<{
    action: string;
    recipeId: string;
  }>({ action: "", recipeId: "" });
  const [aiError, setAiError] = useState("");
  const aiRequest = useRef<AbortController | null>(null);

  const [busy, setBusy] = useState(false);
  const [cook, setCook] = useState(false);
  const [step, setStep] = useState(0);
  const recipe = recipes.find((r) => r.id === selected);
  function setRecipes(next: Recipe[] | ((list: Recipe[]) => Recipe[])) {
    const updated =
      typeof next === "function" ? next(recipesRef.current) : next;
    recipesRef.current = updated;
    setRecipeState(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setStatus("Changes saved in this browser");
    } catch {
      setStatus(
        "Storage is full or unavailable. Export a backup to keep your changes.",
      );
    }
  }
  function update(patch: Partial<Recipe>) {
    setRecipes((list) =>
      list.map((r) => (r.id === selected ? { ...r, ...patch } : r)),
    );
  }
  function choose(id: string) {
    navigate(
      ["recipes", "attempts", "companion"].includes(page) ? page : "journal",
      id,
    );
    setFocusPage("");
    aiRequest.current?.abort();
    setBusy(false);
    setAiError("");
    setOutput("");
    setStep(0);
    setChanges("");
    setResult("");
    setDraftPhotoIds([]);
  }
  function create() {
    const r: Recipe = {
      id: newId(),
      title: "Untitled journal",
      category: "Uncategorized",
      servings: 2,
      ingredients: "",
      steps: "",
      notes: "",
      attempts: [],
      journalPages: [newNotebookPage()],
    };
    setRecipes([...recipesRef.current, r]);
    choose(r.id);
    navigate("journal", r.id);
  }
  function createRecipe() {
    const r: Recipe = {
      id: newId(),
      title: "Untitled recipe",
      category: "Uncategorized",
      servings: 2,
      ingredients: "",
      steps: "",
      notes: "",
      attempts: [],
      journalPages: [],
      recipeBook: true,
    };
    setRecipes([...recipesRef.current, r]);
    choose(r.id);
    navigate("recipes", r.id);
  }
  function saveNow() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(recipesRef.current));
      localStorage.setItem("savorly-planner-v1", JSON.stringify(plansRef.current));
      setStatus("Saved now · " + new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) + " · Autosave is on");
    } catch { setStatus("Could not save locally. Download a backup to protect your changes."); }
  }
  async function download() {
    setJournalBusy(true);
    try {
      downloadBackup(await makeBackup(recipesRef.current, plansRef.current));
      setStatus("Backup exported with recipes and photos.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not export journal.",
      );
    } finally {
      setJournalBusy(false);
    }
  }
  async function replaceJournal(backup: JournalBackup) {
    const before = recipesRef.current;
    const beforePlans = plansRef.current;
    await saveRecovery(await makeBackup(before, beforePlans));
    // Photo IDs are remapped to keep the recovery copy intact even when versions share IDs.
    const mapping = new Map(backup.photos.map((photo) => [photo.id, newId()]));
    await putPhotos(
      backup.photos.map((photo) => ({ ...photo, id: mapping.get(photo.id)! })),
    );
    const restored = backup.recipes.map((r) => ({
      ...r,
      photoIds: r.photoIds?.map((id) => mapping.get(id)!),
      journalPages: r.journalPages?.map((p) => ({
        ...p,
        photoIds: p.photoIds?.map((id) => mapping.get(id)!),
      })),
      attempts: r.attempts.map((a) => ({
        ...a,
        photoIds: a.photoIds?.map((id) => mapping.get(id)!),
      })),
    }));
    if (before !== recipesRef.current || beforePlans !== plansRef.current)
      throw new Error(
        "Your journal changed while loading. Please try again after finishing your edits.",
      );
    // Write metadata before switching the visible journal so storage failures remain recoverable.
    const oldRecipes = localStorage.getItem(storageKey),
      oldPlans = localStorage.getItem("savorly-planner-v1");
    try {
      localStorage.setItem(storageKey, JSON.stringify(restored));
      localStorage.setItem(
        "savorly-planner-v1",
        JSON.stringify(backup.planner ?? []),
      );
    } catch (error) {
      try {
        if (oldRecipes === null) localStorage.removeItem(storageKey);
        else localStorage.setItem(storageKey, oldRecipes);
        if (oldPlans === null) localStorage.removeItem("savorly-planner-v1");
        else localStorage.setItem("savorly-planner-v1", oldPlans);
      } catch {
        /* Recovery snapshot remains available. */
      }
      throw error;
    }
    setRecipes(restored);
    plansRef.current = backup.planner ?? [];
    setPlansState(backup.planner ?? []);
    choose(restored[0]?.id ?? "");
    setStatus(
      "Journal loaded. The previous version is available as a recovery copy.",
    );
  }
  async function restore(file?: File) {
    if (!file) return;
    setJournalBusy(true);
    try {
      if (file.size > 30 * 1024 * 1024)
        throw new Error("Choose a journal backup smaller than 30 MB.");
      const backup = parseBackup(JSON.parse(await file.text()));
      if (
        confirm(
          `Restore ${backup.recipes.length} recipes and ${backup.photos.length} photos? This replaces this device’s journal and keeps one recovery copy.`,
        )
      )
        await replaceJournal(backup);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not restore journal.",
      );
    } finally {
      setJournalBusy(false);
    }
  }
  async function exportRecovery() {
    try {
      const backup = await getRecovery();
      if (!backup)
        throw new Error(
          "No recovery copy yet. One is saved before restoring or loading a cloud journal.",
        );
      downloadBackup(backup, "savorly-recovery.json");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Could not export recovery copy.",
      );
    }
  }
  function updateAttemptPhotos(
    recipeId: string,
    attemptId: string,
    photoIds: string[],
  ) {
    setRecipes((list) =>
      list.map((r) =>
        r.id === recipeId
          ? {
              ...r,
              attempts: r.attempts.map((a) =>
                a.id === attemptId ? { ...a, photoIds } : a,
              ),
            }
          : r,
      ),
    );
  }
  function deleteExperiment(id: string) {
    const item = recipesRef.current.find((r) => r.id === id);
    if (!item) return;
    if (
      !confirm(
        `Move “${item.title || "Untitled experiment"}” to Recently deleted? You can restore it in Settings.`,
      )
    )
      return;
    if (id === selected) {
      aiRequest.current?.abort();
      setBusy(false);
      setOutput("");
    }
    setRecipes((list) =>
      list.map((r) => (r.id === id ? { ...r, deletedAt: Date.now() } : r)),
    );
    setDeletedId(id);
    if (id === selected) {
      const next = recipesRef.current.find((r) => !r.deletedAt);
      navigate("journal", next?.id ?? "");
    }
    setStatus("Experiment moved to Recently deleted.");
  }
  function restoreExperiment(id: string) {
    setRecipes((list) =>
      list.map((r) => (r.id === id ? { ...r, deletedAt: undefined } : r)),
    );
    setDeletedId("");
    setStatus("Experiment restored.");
  }
  function removeAttempt(
    recipeId: string,
    attempt: Recipe["attempts"][number],
  ) {
    if (!confirm("Delete this attempt? You can undo it during this session."))
      return;
    setRemovedAttempt({ recipeId, attempt });
    setRecipes((list) =>
      list.map((r) =>
        r.id === recipeId
          ? { ...r, attempts: r.attempts.filter((a) => a.id !== attempt.id) }
          : r,
      ),
    );
    setStatus("Attempt deleted.");
  }
  function saveAIRecipe(draft: RecipeDraft) {
    const source = recipesRef.current.find(
      (r) => r.id === outputMeta.recipeId && !r.deletedAt,
    );
    if (!source) {
      setAiError(
        "The source experiment was deleted. Restore it before saving this draft.",
      );
      return;
    }
    const copy: Recipe = {
      id: newId(),
      title: draft.title,
      category: "AI recipe drafts",
      servings: draft.servings,
      ingredients: draft.ingredients,
      steps: draft.steps,
      notes: draft.notes
        ? "Suggested next experiment (untested): " + draft.notes
        : "",
      attempts: [],
      journalPages: [],
    };
    setRecipes([...recipesRef.current, copy]);
    choose(copy.id);
    navigate("recipes", "");
    setStatus("Saved a new recipe. The original journal is unchanged.");
  }
  async function ask(action: string) {
    if (!recipe) return;
    aiRequest.current?.abort();
    const controller = new AbortController();
    aiRequest.current = controller;
    const source = recipe;
    setBusy(true);
    setOutput("");
    setAiError("");
    try {
      const response = await fetch("/api/assist", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          recipe: {
            ...source,
            journalPages: undefined,
            notes: [
              source.notes,
              ...pagesFor(source).map(
                (p) =>
                  p.title +
                  "\n" +
                  Object.entries(p.fields ?? {})
                    .map(([key, value]) => key + ": " + value)
                    .join("\n") +
                  "\n" +
                  p.text,
              ),
            ].join("\n\n"),
          },
        }),
      });
      const raw = await response.text();
      let data: { error?: string; text?: string };
      try {
        data = JSON.parse(raw);
      } catch {
        throw Error("The AI server is unavailable. Start it and try again.");
      }
      if (!response.ok || !data.text)
        throw Error(data.error || "No finished answer was returned.");
      if (aiRequest.current === controller) {
        setOutputMeta({ action, recipeId: source.id });
        setOutput(data.text);
      }
    } catch (error) {
      if (!controller.signal.aborted)
        setAiError(
          error instanceof Error
            ? error.message
            : "Could not complete the request.",
        );
    } finally {
      if (aiRequest.current === controller) setBusy(false);
    }
  }
  function caption() {
    if (!recipe) return;
    aiRequest.current?.abort();
    setBusy(false);
    setAiError("");
    setOutputMeta({ action: "caption", recipeId: recipe.id });
    setOutput(
      `From my kitchen experiments: ${recipe.title}. ${recipe.notes || "Testing, tasting, and making it my own."}\n\n${recipe.attempts.length} attempts and counting.\n\n#CookingJournal #RecipeExperiments #HomeCooking`,
    );
  }
  const steps = recipe?.steps.split("\n").filter((s) => s.trim()) ?? [];
  const heading = sections.find((s) => s[0] === page)!;
  function applyTemplate(id: string) {
    if (recipe && pagesFor(recipe).length >= 200) {
      setStatus(
        "This experiment has reached 200 pages. Start another experiment for more pages.",
      );
      return;
    }
    const sheet = newNotebookPage(id);
    if (recipe) {
      update({ journalPages: [...pagesFor(recipe), sheet] });
      setFocusPage(sheet.id);
      navigate("journal");
    } else {
      const r: Recipe = {
        id: newId(),
        title: "Untitled journal",
        category: "Uncategorized",
        servings: 2,
        ingredients: "",
        steps: "",
        notes: "",
        attempts: [],
        journalPages: [sheet],
      };
      setRecipes([...recipesRef.current, r]);
      setFocusPage(sheet.id);
      navigate("journal", r.id);
    }
  }
  return (
    <PlannerContext.Provider
      value={{
        weeks: plans,
        recipes,
        onChange: updatePlans,
        openRecipe: (id) => navigate("recipes", id),
        week: plannerWeek,
        setWeek: setPlannerWeek,
      }}
    >
      <div
        className={
          "app-shell sectioned-app" + (scrapbook ? " scrapbook-theme" : "") + (appearance === "toddler" ? " toddler-theme" : "")
        }
      >
        <aside className="sidebar">
          <a className="brand" href="#/journal">
            savorly<span>✳</span>
          </a>
          <p className="eyebrow">YOUR PERSONAL RECIPE LAB</p>
          <button className="primary new-button" onClick={create}>
            ＋ New journal
          </button>
          <nav className="main-navigation" aria-label="Main pages">
            {sections.map(([id, icon, label]) => (
              <a
                key={id}
                href={
                  "#/" +
                  id +
                  (!["recipes", "journal"].includes(id) && selected
                    ? "/" + encodeURIComponent(selected)
                    : "")
                }
                aria-current={page === id ? "page" : undefined}
              >
                <span aria-hidden="true">{icon}</span>
                {label}
              </a>
            ))}
          </nav>
          <div className="navigation-note">
            A little messy.
            <br />
            <strong>A little more delicious.</strong>
          </div>
        </aside>
        <main className={"page-" + page}>
          <header className="topbar">
            <span>My kitchen / {heading[2]}</span>
            <div className="context-actions">
              <label className="theme-picker">
                <span>Theme</span>
                <select aria-label="App theme" value={appearance} onChange={(e) => changeAppearance(e.target.value)}>
                  <option value="plain">Plain paper</option>
                  <option value="scrapbook">✿ Scrapbook</option>
                  <option value="toddler">☁ Toddler planner</option>
                </select>
              </label>
              <button type="button" className="save-now-button" onClick={saveNow}>Save now</button><span className="pill">Autosave on</span>
              {recipe &&
                !(["recipes", "journal"].includes(page) && !route.recipeId) &&
                !["settings", "templates", "planner"].includes(page) && (
                  <button
                    className="delete-experiment danger"
                    onClick={() => deleteExperiment(recipe.id)}
                  >
                    Delete journal
                  </button>
                )}
            </div>
          </header>
          <div className="page-heading">
            <div>
              <p className="eyebrow">{heading[2].toUpperCase()}</p>
              <h1>{heading[3]}</h1>
              <p>{heading[4]}</p>
            </div>
          </div>
          <p className="global-status" role="status">
            {status}
          </p>
          {deletedId && trash.some((r) => r.id === deletedId) && (
            <div className="undo-banner">
              Experiment deleted.
              <button onClick={() => restoreExperiment(deletedId)}>
                Undo delete
              </button>
            </div>
          )}
          {removedAttempt && (
            <div className="undo-banner">
              Attempt deleted.
              <button
                onClick={() => {
                  setRecipes((list) =>
                    list.map((r) =>
                      r.id === removedAttempt.recipeId
                        ? {
                            ...r,
                            attempts: [removedAttempt.attempt, ...r.attempts],
                          }
                        : r,
                    ),
                  );
                  setRemovedAttempt(null);
                }}
              >
                Undo attempt delete
              </button>
            </div>
          )}
          {page === "templates" ? (
            <TemplateLibrary onUse={applyTemplate} toddler={appearance === "toddler"} />
          ) : page === "settings" ? (
            <div className="settings-layout">
              <section className="card settings-card">
                <h2>Backups & recovery</h2>
                <p>
                  Keep a complete copy of recipes, notebook pages, handwriting,
                  and photos.
                </p>
                <button
                  type="button"
                  className="text-button"
                  disabled={journalBusy}
                  onClick={() => void download()}
                >
                  ↓ Export journal + photos
                </button>
                <label className="restore-picker">
                  ↑ Restore backup
                  <input
                    type="file"
                    accept=".json,application/json"
                    disabled={journalBusy}
                    onChange={(e) => {
                      void restore(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => void exportRecovery()}
                >
                  Export recovery copy
                </button>
                <CloudSync
                  getBackup={() =>
                    makeBackup(recipesRef.current, plansRef.current)
                  }
                  replaceJournal={replaceJournal}
                />
              </section>
              <section className="card settings-card">
                <h2>Recently deleted</h2>
                {trash.length ? (
                  trash.map((r) => (
                    <div className="trash-row" key={r.id}>
                      <span>{r.title}</span>
                      <button onClick={() => restoreExperiment(r.id)}>
                        Restore experiment
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No deleted experiments.</p>
                )}
                <h2>Your data, on your devices</h2>
                <p>
                  Changes save in this browser. Export regularly, especially
                  before clearing browser data. Cloud sync is optional and must
                  be connected to your Supabase project.
                </p>
                <p>
                  Writing tools preserve handwriting as ink. AI can work with
                  typed notebook notes; handwriting recognition is not
                  connected.
                </p>
              </section>
            </div>
          ) : page === "journal" && !route.recipeId ? (
            <JournalLibrary recipes={recipes} onCreate={create} onOpen={id=>{setFocusPage("");navigate("journal",id);}} onDelete={deleteExperiment} />
          ) : page === "planner" ? (
            <SharedPlanner />
          ) : page === "recipes" && !route.recipeId ? (
            <RecipeBook
              recipes={recipes}
              onCreate={createRecipe}
              openRecipe={(id) => navigate("recipes", id)}
            />
          ) : !recipe ? (
            <section className="card empty">
              <h2>A fresh page for your next idea.</h2>
              <button className="primary" onClick={create}>
                Create a journal
              </button>
            </section>
          ) : (
            <>
              {page === "journal" && (
                <JournalWorkspace
                  key={recipe.id + ":" + focusPage}
                  appearance={appearance}
                  getRecipe={() => recipesRef.current.find(r => r.id === recipe.id)}
                  initialPageId={focusPage}
                  recipe={recipe}
                  onChange={update}
                  openTemplates={() => navigate("templates")}
                  weeks={plans}
                  week={plannerWeek}
                  recipes={recipes}
                />
              )}
              {page === "recipes" && (
                <section className="editor card recipe-page-editor">
                  <div className="editor-heading">
                    <PdfExportButton recipe={recipe} getRecipe={() => recipesRef.current.find(r => r.id === recipe.id)} appearance={appearance} />
                    <button
                      className="text-button"
                      onClick={() => navigate("recipes", "")}
                    >
                      ← All saved recipes
                    </button>
                    <button
                      className="text-button"
                      onClick={() => {
                        setCook(true);
                        setStep(0);
                      }}
                      disabled={!steps.length}
                    >
                      ▷ Cook mode
                    </button>
                  </div>
                  <label className="title-label">
                    Recipe name
                    <input
                      className="recipe-title"
                      value={recipe.title}
                      onChange={(e) => update({ title: e.target.value })}
                    />
                  </label>
                  <div className="metadata">
                    <label>
                      Category
                      <input
                        list="recipe-category-options"
                        maxLength={100}
                        placeholder="Choose or type your own…"
                        value={recipe.category}
                        onChange={(e) =>
                          update({ category: e.target.value, subcategory: "" })
                        }
                      />
                      <datalist id="recipe-category-options">
                        {categoryOptions(recipes.map((r) => r.category)).map(
                          (c) => (
                            <option key={c} value={c} />
                          ),
                        )}
                      </datalist>
                    </label>
                    <label>
                      Subcategory (optional)
                      <input
                        list="recipe-subcategory-options"
                        maxLength={100}
                        placeholder="e.g. Creamy, Sourdough, Curries…"
                        value={recipe.subcategory ?? ""}
                        onChange={(e) =>
                          update({ subcategory: e.target.value })
                        }
                      />
                      <datalist id="recipe-subcategory-options">
                        {[
                          ...new Set([
                            ...(Object.entries(defaultSubcategories).find(
                              ([key]) => sameCategory(key, recipe.category),
                            )?.[1] ?? []),
                            ...recipes
                              .filter((r) =>
                                sameCategory(r.category, recipe.category),
                              )
                              .map((r) => r.subcategory)
                              .filter((s): s is string => Boolean(s)),
                          ]),
                        ].map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                      <small>
                        Pick a suggestion or type a custom name. Changes save
                        automatically.
                      </small>
                    </label>
                    <label>
                      Base servings
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={recipe.servings}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (n >= 1 && n <= 100) update({ servings: n });
                        }}
                      />
                    </label>
                  </div>
                  {page === "recipes" && (
                    <div className="tab-content">
                      <PhotoGallery
                        key={recipe.id}
                        label="Recipe photos"
                        ids={recipe.photoIds ?? []}
                        onChange={(photoIds) =>
                          setRecipes((list) =>
                            list.map((r) =>
                              r.id === recipe.id ? { ...r, photoIds } : r,
                            ),
                          )
                        }
                      />
                      <label>
                        <span className="field-heading">01 / Ingredients</span>
                        <small>
                          One ingredient per line. Start with a number to enable
                          scaling.
                        </small>
                        <textarea
                          rows={7}
                          placeholder="1 cup red lentils"
                          value={recipe.ingredients}
                          onChange={(e) =>
                            update({ ingredients: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        <span className="field-heading">02 / Method</span>
                        <small>Write each step on a separate line.</small>
                        <textarea
                          rows={7}
                          placeholder="Describe how you make it…"
                          value={recipe.steps}
                          onChange={(e) => update({ steps: e.target.value })}
                        />
                      </label>
                      <div className="scaling">
                        <label>
                          Adjust servings
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={target}
                            onChange={(e) =>
                              setTarget(
                                Math.max(
                                  1,
                                  Math.min(100, Number(e.target.value) || 1),
                                ),
                              )
                            }
                          />
                        </label>
                        <pre>
                          {scaleIngredients(
                            recipe.ingredients,
                            target / recipe.servings,
                          ) || "Add ingredients above to scale them here."}
                        </pre>
                        <small>
                          Preview only. Check seasonings and cooking time
                          yourself.
                        </small>
                      </div>
                    </div>
                  )}
                  <NutritionPanel key={recipe.id + recipe.ingredients + recipe.steps + recipe.servings} recipe={recipe} />
                  <footer className="editor-footer">
                    <span role="status">
                      {status || "Changes save automatically in this browser"}
                    </span>
                  </footer>
                </section>
              )}
              {page === "attempts" && (
                <section className="editor card attempts-page">
                  <div className="section-recipe-label">{recipe.title}</div>
                  {page === "attempts" && (
                    <div className="tab-content">
                      <h2>Every attempt teaches you something.</h2>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          update({
                            attempts: [
                              {
                                id: newId(),
                                date: new Date().toLocaleDateString("en-CA"),
                                changes: changes.trim(),
                                result: result.trim(),
                                rating,
                                photoIds: draftPhotoIds,
                              },
                              ...recipe.attempts,
                            ],
                          });
                          setChanges("");
                          setResult("");
                          setDraftPhotoIds([]);
                        }}
                      >
                        <label>
                          What did you change?
                          <textarea
                            required
                            value={changes}
                            onChange={(e) => setChanges(e.target.value)}
                            rows={2}
                          />
                        </label>
                        <label>
                          How did it turn out?
                          <textarea
                            required
                            value={result}
                            onChange={(e) => setResult(e.target.value)}
                            rows={2}
                          />
                        </label>
                        <label>
                          Your rating
                          <select
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                          >
                            {[5, 4, 3, 2, 1].map((n) => (
                              <option key={n} value={n}>
                                {n} / 5
                              </option>
                            ))}
                          </select>
                        </label>
                        <PhotoGallery
                          key={recipe.id + "-draft"}
                          label="Photos for this attempt"
                          ids={draftPhotoIds}
                          onChange={setDraftPhotoIds}
                          onBusyChange={setPhotoBusy}
                        />
                        <button
                          className="primary"
                          type="submit"
                          disabled={photoBusy}
                        >
                          ＋ Save attempt
                        </button>
                      </form>
                      <div className="attempts">
                        {recipe.attempts.map((a) => (
                          <article key={a.id}>
                            <button
                              type="button"
                              className="delete-attempt danger"
                              onClick={() => removeAttempt(recipe.id, a)}
                            >
                              Delete attempt
                            </button>
                            <div>
                              <strong>{a.date}</strong>
                              <span className="stars">
                                {"★".repeat(a.rating)}
                              </span>
                            </div>
                            <p>
                              <strong>Changed:</strong> {a.changes}
                            </p>
                            <p>
                              <strong>Result:</strong> {a.result}
                            </p>
                            <PhotoGallery
                              key={a.id}
                              label="Attempt photos"
                              ids={a.photoIds ?? []}
                              onChange={(photoIds) =>
                                updateAttemptPhotos(recipe.id, a.id, photoIds)
                              }
                            />
                          </article>
                        ))}
                        {!recipe.attempts.length && (
                          <p>
                            Your first attempt belongs here—even if it wasn’t
                            perfect.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              )}
              {page === "companion" && (
                <div className="companion-page">
                  <section className="card companion-context">
                    <p className="eyebrow">WORKING WITH</p>
                    <h2>{recipe.title}</h2>
                    <p>
                      {pagesFor(recipe).length} notebook pages ·{" "}
                      {recipe.attempts.length} attempts
                    </p>
                    <p>
                      Your original journal stays intact. Review and edit the
                      draft, then save a new copy to your Recipe Book.
                    </p>
                    <button onClick={() => navigate("journal")}>
                      ← Open journal
                    </button>
                    <button onClick={() => navigate("recipes")}>
                      Open recipe →
                    </button>
                  </section>
                  <aside className="assistant card">
                    <div className="assistant-symbol">✧</div>
                    <p className="eyebrow">A LITTLE HELP IN THE KITCHEN</p>
                    <h2>Your kitchen companion.</h2>
                    <p>Give your ideas a little room to grow.</p>
                    <div className="assistant-actions">
                      <button disabled={busy} onClick={() => ask("polish")}>
                        <strong>✦ Polish my recipe</strong>
                        <small>Turn your notes into clear instructions</small>
                      </button>
                      <button disabled={busy} onClick={() => ask("compare")}>
                        <strong>↗ Learn from my attempts</strong>
                        <small>Find what changed and what worked</small>
                      </button>
                      <button disabled={busy} onClick={() => ask("swaps")}>
                        <strong>♧ Explore ingredient swaps</strong>
                        <small>Consider alternatives for your recipe</small>
                      </button>
                      <button onClick={caption}>
                        <strong>Draft a creator caption</strong>
                        <small>Editable local template</small>
                      </button>
                    </div>
                    {busy && <p role="status">Thinking through your recipe…</p>}
                    {aiError && (
                      <p className="inline-error" role="alert">
                        {aiError}
                      </p>
                    )}
                    {output && (
                      <AIResult
                        key={outputMeta.recipeId + output}
                        text={output}
                        recipeMode={outputMeta.action === "polish"}
                        source={
                          records.find((r) => r.id === outputMeta.recipeId) ??
                          recipe
                        }
                        onSave={saveAIRecipe}
                      />
                    )}
                    <div className="assistant-note">
                      <strong>Your ideas. Your taste.</strong>
                      <p>
                        AI suggestions need your review. The AI tools require a
                        configured server; captions work locally.
                      </p>
                    </div>
                  </aside>
                </div>
              )}
            </>
          )}
          <footer className="page-footer">
            Small experiments. Recipes worth keeping.
          </footer>
        </main>
        {cook && recipe && (
          <div
            className="cook-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Cook mode"
          >
            <div className="cook-card">
              <button
                className="text-button"
                autoFocus
                onClick={() => setCook(false)}
              >
                ← Exit cook mode
              </button>
              <p className="eyebrow">{recipe.title}</p>
              <h2>
                Step {step + 1} of {steps.length}
              </h2>
              <p className="cook-step">{steps[step]}</p>
              <details>
                <summary>View ingredients</summary>
                <pre>{recipe.ingredients}</pre>
              </details>
              <div className="cook-controls">
                <button disabled={step === 0} onClick={() => setStep(step - 1)}>
                  Previous
                </button>
                {step < steps.length - 1 ? (
                  <button className="primary" onClick={() => setStep(step + 1)}>
                    Next step →
                  </button>
                ) : (
                  <button
                    className="primary"
                    onClick={() => {
                      setCook(false);
                      navigate("attempts");
                    }}
                  >
                    Finished! Log my attempt
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PlannerContext.Provider>
  );
}

import "./Cooking.css";

import "./Polish.css";

import "./Scrapbook.css";
