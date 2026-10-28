# Savorly — your personal recipe lab

A cooking journal for keeping messy kitchen notes, photos, recipe experiments and the next attempt together. Built with React 19, TypeScript 6 and Vite 8. The optional AI companion calls an NVIDIA Nemotron model through Nebius Token Factory.

## Start here

Prerequisites: **Node.js 24 LTS**, npm (bundled with Node), and Git. No Python, Docker, GPU, local AI model or database is needed. Development has been checked on Windows with Node 24.21.0 / npm 11.19.0. `.nvmrc` selects Node 24 for version-manager users.

After accepting the private GitHub collaboration invitation:

```powershell
git clone https://github.com/roohanak/savorly.git
cd savorly
npm ci
Copy-Item .env.example .env
npm run dev
```

macOS/Linux: use `cp .env.example .env` instead of `Copy-Item`.
Open **http://localhost:5173/** (or the URL Vite prints if that port is occupied). Use the same hostname consistently: `localhost`, `127.0.0.1` and an iPad's LAN URL have separate browser storage.

The journal, photos, planner and local caption template work without credentials. To use the AI actions, fill `.env` with your own key, keep the frontend running, and start a **second terminal in this folder**:

```powershell
npm run server
```

The AI helper listens on `127.0.0.1:3001`. Open the app on **5173**; opening 3001 directly returns `Not found` because it is an API, not a website. If you see `EADDRINUSE`, an existing process is already listening: stop the earlier server in its terminal with Ctrl+C before restarting it.

## AI configuration and data flow

`.env.example` contains the integration's base URL and model identifier; only the API key is blank:

```env
AI_API_KEY=your_private_key_here
AI_BASE_URL=https://api.tokenfactory.nebius.com/v1
AI_MODEL=nvidia/Nemotron-3_5-Lightning
```

Model availability and account credits are controlled by Nebius. Use an exact model identifier available to your account. Restart the AI helper after changing `.env`; restart Vite after changing `VITE_` settings.

Browser -> Vite `/api` proxy -> local Node helper -> Nebius `/chat/completions` -> formatted draft in the browser. Requests send the selected recipe's typed cooking content and recorded attempts. Photos and ink are not sent for recognition. `server/assistant.mjs` requests final answers, omits internal IDs and rejects truncated/planning responses. AI drafts still need human review; they can be edited and saved as a new recipe without replacing the source notebook. Provider requests may consume paid credits.

Never put `AI_API_KEY` in a `VITE_` variable, frontend source, screenshots, issues or commits. `.env` is ignored. Each collaborator supplies their own key locally; do not commit or email the owner's `.env`.

## Scrapbook appearance and stickers

The scrapbook palette uses cherry-red gingham accents, cream paper and brighter pastel notes. Handwritten headings and journal text use locally hosted Gaegu (regular/bold); its SIL Open Font License is included in `public/fonts/Gaegu-OFL.txt`. Smaller UI labels retain their readable sans-serif font.

The top-bar **Scrapbook / Plain paper** button switches between the cozy notebook-photo backdrop and the original white workspace; the preference stays on this device. Sketches blend into dotted/lined paper in Scrapbook mode. Grocery items appear in four sticky-note groups (Produce, Dairy & protein, Pantry, Other); automatic keyword grouping is a visual convenience, not a food taxonomy. Each sticky also has a directly writable multiline notes area. These freeform notes save per week and are shared between the weekly notebook and Meal Planner; they do not automatically become checkbox items. Use Add a shopping item for checkable items.

Inside a notebook's Handwriting & sketches area, open **Stickers** to add original vector pasta, strawberry, mushroom, flower, cat, chicken, heart, sparkle, coffee, bread and 16 more doodles. Use **Move photos / Text** to drag stickers, or focus a sticker and use arrow keys. Drag the corner to resize or the round handle to rotate. Delete/Backspace removes the selected sticker, Escape deselects, and Ctrl/Cmd+Z undoes the last sticker change. Choose Pen to draw over stickers/photos. Up to 30 stickers per page; positions, size and tilt are saved with the notebook and included in validated backups/cloud snapshots. Ink and stickers are not sent to AI.

The supplied reference photo in `public/backgrounds/cozy-notebook.png` is used unmodified as the page backdrop. Confirm distribution rights or replace it before public release. `kitchen-doodles.svg` and `StickerArt.tsx` are original code-drawn assets.

## Current app

- **My journal:** experiments with independent pages; text, colored templates and lined/dotted/plain paper.
- **Handwriting & sketches:** bounded ink canvas; ballpoint, pencil, highlighter, widths, colors, eraser and session undo/redo. Add up to six photos directly to the canvas, drag them, resize from the corner, then choose Pen to draw over them. Existing page photos are retained. Physical Apple Pencil behavior still needs device testing.
- **Recipe Book:** searchable clickable saved-recipe cards, category dropdowns (Soups, Bread, Chicken and more), and custom category/subcategory names. Open a recipe to choose or type a category and optional subcategory; browse and filter the library by both. Open ingredients/method, adjust servings and use step-by-step cook mode. Recipes with ingredients or a method appear here; empty journal experiments do not.
- **Attempt log:** dated changes, outcomes, ratings and attempt photos.
- **Meal Planner:** dated weekly meals, recipes or custom meals, servings, cooked status, weekly notes, scaled grocery quantities and custom shopping items. The weekly notebook template shares this data and selected week. Freeform handwritten/loose notes are not converted into meals.
- **AI companion:** polish a recipe, compare attempts, explore swaps, edit/save drafts; captions use a local template.
- **Settings & sync:** export/restore complete backups; recover deleted experiments; optional manual Supabase snapshots.

Changes save in browser localStorage; photos live in IndexedDB. **Git shares code, not personal journal data.** To share a test journal, deliberately export a sanitized backup from Settings and send it separately. Clearing browser data removes local content. Keep backups outside the repository.

Photos: JPEG/PNG/WebP; HEIC depends on browser decoding. Maximum input 20 MB, resized to at most 1600 px and re-encoded as JPEG without original EXIF. Limits: 200 pages per experiment, 1,000 ink strokes per page, 4,000 points per stroke. Ink and photo undo history is temporary; saved strokes and image positions persist.

## Optional Supabase / iPad

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md). Supabase is not required for local use and is not provisioned by cloning this repo. Cloud sync is **manual whole-journal save/load**, not live multiuser editing. It includes recipes, planner, photos and notebook data, with revision checks and a 15 MB app limit. Live account-isolation tests require a configured project.

For a trusted same-Wi-Fi iPad test, `npm run dev -- --host 0.0.0.0` prints a LAN URL. Stop it after testing. The loopback-only Node helper stays on the computer. HTTPS production hosting and AI endpoint access controls are separate deployment work.

## Verify changes

```powershell
npm test
npm run lint
npm run build
```

Tests cover backup validation, notebook formats/ink, planner arithmetic, recipe draft parsing, photo layout persistence and AI request/response filtering. They do not make paid model calls or verify a live Supabase account. `npm run preview` serves built frontend files only; it does **not** provide the development `/api` proxy.

See [CONTRIBUTING.md](CONTRIBUTING.md) for branches and pull requests, and [docs/HANDOFF.md](docs/HANDOFF.md) for the labmate brief and remaining priorities. [docs/TEAM_MESSAGE.md](docs/TEAM_MESSAGE.md) is the invitation draft; [docs/TEST_PLAN.md](docs/TEST_PLAN.md) is the independent test checklist.

## Code map

| File | Responsibility |
| --- | --- |
| `src/App.tsx` | Routes, shared state, local saves, AI actions, recovery and backups |
| `src/JournalWorkspace.tsx`, `src/notebook.ts`, `src/TemplateFields.tsx` | Notebook pages, template data and typed fields |
| `src/PenEditor.tsx`, `src/ink.ts` | Active ink tools, normalized strokes and drawing |
| `src/PhotoCanvas.tsx` | Page photo upload, drag, resize and layout |
| `src/PhotoGallery.tsx`, `src/photoStore.ts` | Recipe/attempt galleries, image preparation, IndexedDB and backup payloads |
| `src/MealPlanner.tsx`, `src/planner.ts` | Planner UI, dates, validation and grocery scaling |
| `src/SharedPlanner.tsx`, `src/plannerContext.ts` | Shared planner state in journal and dedicated page |
| `src/AIResult.tsx`, `src/recipeDraft.ts`, `src/RecipeBook.tsx` | Safe formatted drafts, editing and saved-recipe gallery |
| `src/StickerBoard.tsx`, `src/StickerArt.tsx`, `src/stickers.ts` | Sticker tray, drag controls, SVG art and validation |
| `src/model.ts` | Types, validation and backup compatibility |
| `src/CloudSync.tsx`, `supabase/setup.sql` | Optional manual cloud snapshots and per-user RLS |
| `server/index.mjs`, `server/assistant.mjs` | Local-only API helper and model prompt/output handling |
| `src/App.css`, `src/Notebook.css`, `src/Cooking.css`, `src/Polish.css`, `src/Scrapbook.css` | Layered styles; Scrapbook is imported last |
| `tests/` | Node test-runner checks |

`src/JournalCanvas.tsx` is an older, unused canvas; the active editor is `PenEditor.tsx`. `src/components/ListGroup.tsx` and `src/Message.tsx` preserve early learning exercises.

## Deployment and submission status

This is a local prototype, not a deployed public service. The AI helper currently has no user authentication or rate limiting and must remain loopback-only until those are implemented. A static frontend build alone cannot call the helper through Vite's development proxy. Before a public deployment, configure a hosted API, authentication, usage limits and allowed origins.

The repository can stay private during collaboration. The hackathon submission rules require a public source repository with an open-source license and a working demo/test build. Choose the license with the team before making it public; this handoff does not grant an open-source license or publish the code. Review image/asset rights before public distribution, including `src/assets/hero.png`. Check the official event rules for the final submission requirements.

## PDF copies

Use Save recipe PDF in a recipe or Save notebook PDF in the journal to download a portable PDF. Notebook copies include typed fields, ink, photos, stickers and the selected weekly plan. Changes also autosave in the browser; PDF downloads are separate snapshots, not editable backups. Choose Sketch paper beside the drawing area for plain, lined or dotted paper.

### Toddler planner theme
Use the Theme dropdown in the top bar to choose Plain paper, Scrapbook, or Toddler planner. Toddler planner adds original vector baby, teddy, cloud and star wallpaper, lavender navigation, pastel day cards and matching grocery panels. The selection is saved in this browser and does not change notebook content.
