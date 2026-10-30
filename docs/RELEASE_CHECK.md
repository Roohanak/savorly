# Release verification — October 30, 2026

## Confirmed in the built app

- Live multi-turn Nebius chat: convert the sample from two to five servings, follow up to three servings, ask which count is current. The answer remembered three; the entire conversation survived reload.
- Saved a polished three-serving draft as a separate recipe, searched and opened its ingredients/method; the original two-serving recipe remained unchanged.
- Create and rename a synthetic journal, replace OLD PDF TEXT with NEW PDF TEXT, and use Save now.
- Upload a synthetic PNG. The photo has a 0px border and the resize handle has opacity 0 when idle. Keyboard rotation and resize updated their values.
- Draw a stroke, Ctrl+Z removes it, Ctrl+Shift+Z restores it.
- Download and render a selected-page PDF. It contains NEW PDF TEXT, the rotated photo, strawberry sticker and pen stroke. The old text is absent.
- Toddler workspace starts without cooking data. A synthetic toddler journal remained hidden when switching to Plain paper; the cooking journals remained visible.
- No horizontal document overflow at 390×844 and 820×1180 for the tested journal/chat views. Browser viewport overrides were reset afterward.
- No browser warning/error logs during the inspected chat/editor flow.

## Bugs found and corrected in this pass

- AI questions previously sent no conversation history.
- Quick actions after a conversation could repeat the last assistant answer; actions now append an explicit new user instruction after history. Incomplete recipe drafts are rejected with Retry rather than treated as ready to save.
- Recipe draft parsing missed separate Markdown serving headings; it now parses inline and separate headings with regression coverage.
- Photo restore remapped IDs but not layout keys; both are now remapped and covered by regression tests.
- The local API had no deployable static frontend/auth/rate guards. The new production server refuses unprotected startup, uses signed HttpOnly/Secure sessions, origin checks, bounded input, request/concurrency/day limits and static path restrictions.
- The reference-only background image was copied into published assets; the built app now uses original SVG artwork and keeps the reference outside public assets.

## Automated verification

All 61 tests passed; lint and production build passed. A fresh clone of commit abcf6fc also passed npm ci, tests, lint and build without a private .env file; npm reported zero vulnerabilities. Run `npm test`, `npm run lint`, `npm run build`, and `npm audit`. The tests include conversation validation/context ordering, backups/workspace migration, planner scaling, nutrition missing quantities, PDF snapshots, production sessions, origin checks, static file protection and AI limit behavior. Provider calls are stubbed in automated tests; the browser chat checks above used the configured live provider.

## Still requiring external/device checks

- Retest the final deployment URL after hosting account setup. No public deployment URL exists yet.
- Physical iPad/Apple Pencil pressure, palm rejection and touch behavior.
- Live Supabase account isolation and cross-device restoration after project/schema setup.
- Confirm event submission requirements, demo video, asset licensing and repository license/visibility with the team.

Do not call this exhaustive testing of every possible device or input. The notes distinguish observed checks from remaining verification.
