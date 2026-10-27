# Labmate handoff

## Project and role

Savorly is a cooking journal built for the Nebius x NVIDIA hackathon. Roohanak has built the current working prototype and is inviting a teammate for product feedback, testing, bug fixes, UI polish and submission preparation.

Start with the README quickstart and use a feature branch. The app uses React + TypeScript + Vite with a small Node HTTP helper, not Python or a local GPU. The model is called remotely through Nebius Token Factory. You can review all local features without an API key; use your own Nebius key to test AI.

## What to try

1. Create an experiment and add different colored notebook pages.
2. Type notes, upload a canvas photo, move/resize it, add/drag/tilt a sticker, draw with the pen, reload and verify persistence. Toggle Scrapbook / Plain paper and check both views.
3. Turn typed cooking notes into an AI draft, edit it, save a copy, and open it from Recipe Book. Check that the source journal remains intact.
4. Add meals in the weekly template and verify the same week in Meal Planner. Check servings/grocery scaling and cooked status.
5. Log an attempt, export a backup, and test restore in a separate profile. Verify experiment delete/restore.
6. Check narrow phone and tablet widths; test on a physical iPad/Pencil if available.

## Known gaps and limits

- Public hosted app/API is not set up. Backend auth, rate limits and production routing are required before exposing the AI endpoint.
- Supabase setup exists but live sync/account-isolation verification is pending a configured project. It is not simultaneous shared editing.
- No handwriting/photo recognition. Only typed cooking content goes to AI.
- AI output may still be inaccurate; review suggestions and preserve missing quantities as missing.
- Physical Apple Pencil behavior needs device testing. Ink undo history lasts for the open editor session.
- Grocery aggregation combines matching ingredient labels, not different units or synonyms; seasonings and cooking times require judgment.
- Styling is layered and App.tsx is large; focused changes are safer near the deadline than a broad rewrite.
- Old freeform weekly notes remain notes and are not automatically transformed into scheduled meals.
- Recipe Book includes experiments with ingredients/method, so its saved-recipe state is derived rather than a separate published flag.
- Review rights for bundled images/assets and choose an open-source license before public submission.

## Suggested remaining work

Prioritize usability and data integrity over adding new features. Fix the most noticeable responsive/pointer issues; test a clean clone; prepare a working hosted demo or distributable test build; document the runtime Nebius/NVIDIA integration; prepare the short demonstration video and Devpost description together.

## Message and assigned review priorities

See [TEAM_MESSAGE.md](TEAM_MESSAGE.md) for a ready-to-send invitation covering the MVP, current work, environment, costs/prizes and proposed ownership. See [TEST_PLAN.md](TEST_PLAN.md) for the prioritized acceptance checklist. The teammate should lead independent testing and focused usability fixes; cloud/deployment work is explicitly still pending. Proposed tasks require the teammate's agreement.
