# Partner handoff

Updated October 28, 2026.

## Start here

Savorly is a React + TypeScript + Vite cooking journal with a Node.js AI helper. Use Node 24, `npm ci`, then `npm run dev`. Open the exact URL Vite prints. The owner currently uses `http://localhost:5174`; keep that address when testing their saved journal. A clean clone normally uses port 5173. Different hostnames, ports and browser profiles have separate local data. Cloning shares code, not journal data or API keys.

Local features work without credentials. For AI, copy `.env.example` to `.env`, add your own Nebius key and run `npm run server` in a second terminal. Keep secrets out of Git and screenshots. See README.md, CONTRIBUTING.md and SUPABASE_SETUP.md.

## Current build

- Separate journal, Recipe Book, attempts, planner, templates, AI companion and settings.
- Plain paper, Scrapbook and Toddler planner appearances. Toddler templates are listed only with Toddler planner selected; regular cooking templates appear in the other themes. Existing saved pages are preserved when switching appearances.
- Toddler day planner, memory notes and sketchbook with matching artwork and baby stickers.
- Typed fields, pen styles/sizes/colors, eraser, draggable/resizable photos and 32 stickers with direct rotation/resize handles. Selected stickers support Delete/Backspace and Escape. Canvas edits have session-local keyboard undo/redo; writing fields retain browser-native undo.
- Recipe category/subcategory dropdowns, search, new recipe, servings preview and cook mode.
- Linked weekly notebook/meal planner, grocery sticky notes and checkable shopping lists.
- Local saving, complete backups and recoverable experiment deletion. Optional Supabase snapshots are prepared but live cross-device behavior is unverified.
- AI recipe drafts, attempt comparisons and ingredient-swap suggestions through Nebius/NVIDIA. Open-ended cooking questions are still a remaining improvement.
- Recipe PDF, selected-page PDF and all-pages PDF exports. The latest journal export wiring was fixed in commit `78eb2cf`, but a newly downloaded PDF has **not yet been visually verified** after that fix.

Current automated checks: 33 tests, lint and production build passed. These do not verify physical iPad/Pencil behavior, live Supabase, deployed AI or visual PDF fidelity.

## Pick a manageable piece

These are proposed tasks, not assigned commitments. Tell Roohanak what you can cover. Start with one or two priorities rather than trying to finish everything.

1. **PDF correctness first.** Follow the P0 PDF checklist in TEST_PLAN.md. Replace text in the same page, export immediately, and compare the actual file with the app. Check selected-page vs all-pages downloads, theme propagation to older pages, blank fields, long notes, images/stickers/ink and page breaks. Do not mark this complete from unit tests alone.
2. **End-to-end and device testing.** Check pen, eraser, photos, sticker movement/rotation/resize, Delete/Escape/undo/redo, recipes/search, planner and groceries on desktop, phone and a physical iPad/Pencil if available. Fix reproducible high-impact issues and smooth confusing interactions.
3. **Saving and recovery.** Verify reloads, backup/restore and deleted-item recovery in a separate test profile. Confirm text, media, ink, stickers and planner state survive. Never restore over the owner's only journal.
4. **AI usefulness.** Add an explicit question flow for “why is my batter thick?”, “can I swap this ingredient?” and measurement/serving questions. Preserve supplied quantities, identify missing details and keep model reasoning out of displayed answers. Do not promise automatic photo/handwriting recognition.
5. **Cloud and deployment, if you can cover it.** Configure and test Supabase account isolation and laptop/iPad restoration. Current support is manual snapshots, not conflict-safe live editing. Add a conflict strategy before promising automatic sync. For hosting, keep the key server-side and add authentication, usage limits and production API routing.
6. **Demo together.** Help choose a stable demo flow, record the video and polish the submission. Confirm current official requirements, asset rights and license before publishing.

## Working agreement

Use a feature branch and a focused PR. Include reproduction steps, expected/actual results, device/browser and a screenshot or sample PDF for UI/export issues. Run `npm test`, `npm run lint` and `npm run build` for code changes. Coordinate overlapping edits to App.tsx and layered styles. Roohanak retains product direction and submission ownership; discuss credit and any prize split directly.

See TEAM_MESSAGE.md for a casual message and TEST_PLAN.md for acceptance checks.
