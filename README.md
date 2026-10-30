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

The AI helper listens on `127.0.0.1:3001`. Open the app on **5173**; after `npm run build`, port 3001 also serves the built website and API. If you see `EADDRINUSE`, an existing process is already listening: stop the earlier server in its terminal with Ctrl+C before restarting it.

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

The top-bar **Scrapbook / Plain paper** button switches between the original illustrated cozy backdrop and the original white workspace; the preference stays on this device. Sketches blend into dotted/lined paper in Scrapbook mode. Grocery items appear in four sticky-note groups (Produce, Dairy & protein, Pantry, Other); automatic keyword grouping is a visual convenience, not a food taxonomy. Each sticky also has a directly writable multiline notes area. These freeform notes save per week and are shared between the weekly notebook and Meal Planner; they do not automatically become checkbox items. Use Add a shopping item for checkable items.

Inside a notebook's Handwriting & sketches area, open **Stickers** to add original vector pasta, strawberry, mushroom, flower, cat, chicken, heart, sparkle, coffee, bread and 22 more doodles. Use **Move photos / Text** to drag stickers, or focus a sticker and use arrow keys. Drag the corner to resize or the round handle to rotate. Delete/Backspace removes the selected sticker, Escape deselects, and Ctrl/Cmd+Z undoes the last sticker change. Choose Pen to draw over stickers/photos. Up to 30 stickers per page; positions, size and tilt are saved with the notebook and included in validated backups/cloud snapshots. Ink and stickers are not sent to AI.

The backdrop uses original `cozy-desk.svg` artwork. The supplied reference is preserved outside published assets in `reference-assets/`; review rights before publishing source. `kitchen-doodles.svg` and `StickerArt.tsx` are original code-drawn assets.

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

The deployment configuration is prepared but no public URL is live yet. The production server serves the frontend/API with a demo password, signed sessions, origin checks and usage limits. See docs/DEPLOYMENT.md for setup and the final production smoke test.

The repository can stay private during collaboration. Confirm the event’s source visibility, license and demo requirements with the team. Choose the license with the team before making it public; this handoff does not grant an open-source license or publish the code. Review image/asset rights before public distribution, including `src/assets/hero.png`. Check the official event rules for the final submission requirements.

## PDF copies

Use Save recipe PDF in a recipe or Save notebook PDF in the journal to download a portable PDF. Notebook copies include typed fields, ink, photos, stickers and the selected weekly plan. Changes also autosave in the browser; PDF downloads are separate snapshots, not editable backups. Choose Sketch paper beside the drawing area for plain, lined or dotted paper.

### Toddler planner theme
Use the Theme dropdown in the top bar to choose Plain paper, Scrapbook, or Toddler planner. Toddler planner adds original vector baby, teddy, cloud and star wallpaper, lavender navigation, pastel day cards and matching grocery panels. The selection is saved in this browser. Toddler has its own workspace; Plain paper and Scrapbook share cooking content.

Each notebook page also has Save this page PDF beside its page title. This exports that selected page only, using its title in the filename. Save all pages PDF still includes all pages. Plain freeform, lined and dotted pages retain their sketch area even without ink.

### Toddler notebook templates
Templates includes Toddler day planner (meals, naps, play, mood and tomorrow), Toddler memory notes, and Toddler sketchbook. Toddler templates appear only in the Toddler workspace. They use the same pen/eraser, photo canvas, draggable/resizable/rotatable stickers and per-page/all-notebook PDF exports. The sticker tray includes baby, teddy, cloud, rainbow, blocks and bottle designs. Outside text fields, Ctrl/Cmd+Z undoes the latest page edit, Ctrl/Cmd+Shift+Z or Ctrl+Y redoes it; Delete/Backspace removes a selected sticker and Escape deselects. History is limited to 30 edits per page while that journal workspace stays open; text fields retain browser-native undo.

PDF notebook copies preserve each page's chosen color and template headings, including empty field cards. Toddler pages include their baby wallpaper and lavender accents. Long field values continue onto additional pages; the export uses a printable A4 layout rather than capturing browser controls.

## Partner priorities (October 29)

Start with [docs/HANDOFF.md](docs/HANDOFF.md). A selected-page PDF has been downloaded and visually verified with replaced text, photo, ink and sticker. Prioritize physical iPad/Pencil checks, live Supabase isolation and the final deployed URL. The handoff distinguishes implemented features from unverified device/cloud behavior and proposes optional areas for the partner to choose. [docs/TEST_PLAN.md](docs/TEST_PLAN.md) includes the edit-to-PDF regression checklist.

## Saving, journal library and nutrition

My Journal opens searchable journal cards; Recipe Book keeps its own recipe gallery. The old mixed sidebar list is removed. New journal creates a notebook. Changes still autosave; Save now explicitly writes the current journal/planner state and reports success or a storage error. PDF export is separate from saving.

Canvas photos and stickers have no selection-border boxes. In Text mode, hover over an item to reveal resize/rotate handles, or tap on a touch screen. There is no Arrange toggle. Use Delete/Backspace on a selected photo/sticker, Escape to deselect, and session-local undo/redo for page edits.

Recipes have Estimate calories & macros. It sends only the recipe title, base servings, ingredients and method to the configured AI provider. Results are approximate model estimates, not verified food-database calculations. Missing essential quantities suppress numeric results and prompt for more details. Editing ingredients, method or base servings clears the estimate. One live provider request with synthetic ingredients succeeded; physical-device and browser UI testing remain partner tasks.

### Recipe vs Companion responsibilities

Recipe makes is the yield for the entered ingredient amounts. Scale batch to previews a different batch size; Nutrition uses exactly that batch size and the same scaled ingredient text. Scaling a whole batch changes total food, not normally nutrition per portion. To divide the unchanged original food into five portions, set Recipe makes to five. Nutrition needs ingredient amounts as well as servings; it does not invent missing quantities or report assumptions when no estimate is possible.

AI Companion has Ask a cooking question for technique, swaps and suggested recipe amounts. Suggestions are untested and do not automatically change the saved recipe. Nutrition has a link that prefills a question about missing amounts for the selected batch size. Numeric calories/macros stay in the recipe Nutrition panel to avoid competing estimates. Question context excludes separate notebook pages; it uses recipe ingredients, method, notes and attempts.

## Separate toddler and cooking workspaces

Plain paper and Scrapbook share the cooking journals/recipes/planner. Toddler planner opens a separate workspace with its own journals, recipes, weeks, trash and recovery backups. Switching areas returns to the journal library and clears in-flight AI/editor state. New toddler journals start with a toddler planner page.

A one-time migration separates existing toddler-template pages from mixed legacy notebooks. Cooking fields/notes/attempts stay in cooking; toddler pages move to the toddler area. Existing generic pages cannot reliably be classified by theme history and stay with cooking. Mixed cooking copies are labeled “(cooking pages)”. No media are deleted. Settings → Export original pre-separation copy downloads the original combined snapshot if needed.

Backups identify their workspace and cannot silently replace another workspace. Cloud rows are scoped by account and workspace. Existing Supabase projects must run `supabase/workspaces-migration.sql` before using the updated sync controls; new projects use the updated setup.sql. This schema change is prepared locally, not applied to a live project or live-tested.

## Conversational AI and deployment

AI Companion now keeps a conversation per recipe and workspace. Ask follow-up questions in the same thread; New chat starts over with a session-local undo option. Stop reply and Retry handle interrupted requests. Up to 60 messages are saved with the recipe and its backup; the latest bounded 20 messages plus recipe context are sent to the provider. Typed notebook text is included only when explicitly polishing notes into a recipe. No photos or ink are sent.

The complete frontend/API can run together with `npm run build` then `npm start`. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the prepared protected-demo deployment and [docs/RELEASE_CHECK.md](docs/RELEASE_CHECK.md) for observed tests and remaining physical-device/cloud checks. Automated checks also run in GitHub Actions. Never put an AI key in VITE-prefixed configuration.
