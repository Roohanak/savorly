# MVP acceptance and teammate testing plan

Use synthetic cooking notes in a separate browser profile. Never test destructive restore against the owner's only journal. Record browser/OS/device, steps, expected/actual behavior, a screenshot and severity for each issue.

## P0 — PDF regression: first priority (not yet visually verified)

Use disposable notes and retain the downloaded files as evidence. The last wiring fix is `78eb2cf`; use that revision or newer.

- [ ] In the same page, replace a unique phrase such as OLD-NOTE with NEW-NOTE. Export immediately and confirm only NEW-NOTE appears on that page. Repeat after navigation and reload, including a cold first export while the PDF module loads.
- [ ] Change title, freeform text and a template field separately. Confirm all three update in the PDF, not just the title.
- [ ] Export the selected second/last page: its PDF must contain that page only. All-pages export must contain every existing page in notebook order; earlier saved pages remain included.
- [ ] In Toddler planner appearance, export older freeform/cooking pages and toddler pages together. Verify wallpaper/accents on all exported pages, blank writable fields and correct current text. A theme change must not rewrite user content.
- [ ] Compare photos, rotated/resized stickers and pen strokes with the app. Check that erasing/deleting and undoing are reflected in the next PDF.
- [ ] Use long notes and multi-page content. No clipped text, orphaned sketch headings, missing drawings or unintended blank sheets. Check images at 100% and printed A4 layout.
- [ ] Check both a single-page and all-pages download in Chrome and an iPad browser. Record file name, app revision, browser and expected/actual page content. PDF is a snapshot; older downloads do not update automatically.

## P0 — must work for submission

- [ ] Clone on a second computer using Node 24; `npm ci`, `npm test`, `npm run lint`, `npm run build` all succeed. No secret/local files are needed for local-only features.
- [ ] Create an experiment, add/rename pages, type notes, navigate away and reload; content remains.
- [ ] Upload a photo, drag/resize it, draw over it, change pen styles/colors/sizes, erase and undo. Existing photos and strokes survive reloads.
- [ ] Add/drag/resize/tilt/remove/undo stickers; positions survive reload and export/restore. Switching page does not put edits on the wrong page.
- [ ] With a personal Nebius key, turn sparse notes into a recipe. Missing quantities must remain missing; no internal planning appears. Test account errors/offline behavior. Never expose credentials in the browser or issue screenshots.
- [ ] Edit an AI draft and save it. The original notebook remains intact; the new recipe appears as a clickable Recipe Book card with ingredients and method.
- [ ] Add a meal through the weekly notebook template; see it in Meal Planner for the same week. Edit in the other view; confirm notes, meals and grocery counts agree. Other weeks remain independent.
- [ ] Assign a default recipe category and a custom subcategory; check filtering, custom names, reload and backup restoration.
- [ ] Type multiline text directly in each grocery sticky; verify it persists after reload and matches the weekly notebook view.
- [ ] Verify grocery servings scaling, fractions, cooked filter, custom items, sticky-note classification and checked state after reload. Do not assume automatic unit conversion.
- [ ] Delete an experiment, undo it, delete again and restore from Settings after reload. Log and remove an attempt. Confirm photos remain recoverable as intended.
- [ ] Export a complete journal and restore it into a separate browser profile; confirm notebook fields, photos, ink, stickers, planner and trash survive. Invalid backups must not replace saved data.

## P1 — independent usability and device checks

- [ ] Test small phone, iPad portrait/landscape and desktop layouts: no unusable overflow, clipped controls or buttons hidden by sticky toolbars.
- [ ] Physical stylus: confirm pointer mapping, pressure, palm/touch behavior, page scrolling and movement of images/stickers. Browser emulation alone is insufficient.
- [ ] Test keyboard navigation, visible focus, labels, error/loading/empty states and non-hover touch controls.
- [ ] Switch Plain/Scrapbook/Toddler planner and revisit the app. Confirm toddler-only template filtering and that existing pages remain intact. Confirm readability and selected week/appearance persistence.
- [ ] Review confusing labels and overly complex flows. Propose two highest-impact interaction improvements, then implement focused fixes on a branch.

## P1 — remaining infrastructure (not completed)

- [ ] Provision/configure Supabase using SUPABASE_SETUP.md; test two accounts cannot see each other's journal; test stale saves and full media restoration across devices.
- [ ] Choose a deployment route. Keep AI keys server-side; add user authentication, per-user usage limits and production API routing before exposing the backend.
- [ ] Verify deployed frontend + backend from a different device using the exact demo URL. `npm run preview` alone does not provide the Vite API proxy.
- [ ] Replace or obtain distribution permission for third-party reference images before public release; confirm all asset licenses.
- [ ] Choose an open-source license together, prepare the public repository and a video under three minutes, and complete the Devpost requirements.

## Stretch — only after P0/P1

- Handwriting/image recognition with explicit data-sharing controls and a suitable model.
- More capable ingredient unit conversion, synonyms and manual grocery category overrides.
- Richer planner interactions such as moving/repeating meals after the current flow is reliable.
- Automated browser coverage and a less monolithic App.tsx, without risking a late broad rewrite.

These items are proposed ownership for the invited teammate, not a claim that they have accepted the work. Owner and teammate should agree scope, credit and prize split directly.

## Latest interaction and nutrition regressions

- [ ] My Journal opens journal cards, Recipe Book opens recipe cards, and no mixed record list remains in the sidebar. Existing journals and recipe copies stay accessible.
- [ ] Upload a photo with Arrange off: no selection box or resize handle. Enable Arrange, select/move/resize; disable it and confirm controls disappear. Check stickers, Delete/Backspace, Escape and Ctrl/Cmd+Z too.
- [ ] Autosave survives reload; Save now reports a successful local write. In a disposable test profile, check storage failure feedback. It must not claim success on failure.
- [ ] Recipe nutrition returns approximate per-serving calories/protein/carbs/fat and assumptions. Missing essential amounts must request details. Ingredient/method/serving edits clear stale results. Test server/provider errors without exposing the key. Keep notebook notes/photos out of nutrition requests.
