# Deployment: protected demo

The Node service serves the built website and `/api/assist` from the same origin. No separate Vite proxy is needed in production. The API key stays on the server. A shared demo password protects the website/API; this is a hackathon demo gate, not individual user accounts.

## Prepared Render deployment

The repository contains `render.yaml`. In Render, create a Blueprint from `Roohanak/savorly`, branch `main`, then review the generated web service before creating it. The blueprint uses Node 24, runs `npm ci --include=dev && npm run build`, starts `npm start` and checks `/healthz`.

Supply these secret environment values in Render, never Git:

- `AI_API_KEY`: your provider key.
- `APP_ACCESS_PASSWORD`: a demo password of at least 12 characters; give it to judges with the demo URL.
- `SESSION_SECRET`: generated automatically by the blueprint. Keep it private.

The model/base URL are configured for Nebius. `RENDER_EXTERNAL_URL` supplies the expected browser origin automatically. A custom domain can use `APP_ORIGIN`. Optional Supabase settings must be present at build time as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; leave them unset for local-only journals. Use only a publishable key, never a Supabase secret/service-role key in a VITE variable.

The blueprint requests the free service plan. Review the service/billing screen yourself before accepting any paid plan or payment commitment. No deployment has been published by the repository configuration alone.

Official setup references: [Node web service](https://render.com/docs/deploy-node-express-app), [Blueprint specification](https://render.com/docs/blueprint-spec), [secrets](https://render.com/docs/configure-environment-variables).

## Production smoke check

1. Open the deployed `/healthz`; expect status ok, frontendBuilt true and aiConfigured true.
2. Open the root; sign in with the demo password. A wrong password must fail; API requests without the session must return 401.
3. Create a synthetic journal, edit/reload it, and test one AI question followed by a second question referring to the first answer.
4. Download a PDF and compare its current text, photo, sticker and ink with the editor.
5. Test the exact public URL from a second device. Browser viewport testing does not substitute for a physical iPad/Pencil.

The API allows eight requests per minute per session/IP, two concurrent upstream calls, and 100 AI requests per server day by default. Limits are in memory and reset after a restart/redeploy; set a provider-side spending cap for a durable billing limit. `AI_REQUESTS_PER_MINUTE` and `AI_DAILY_REQUEST_LIMIT` adjust the demo limits. A limit does not disable local journal tools.

## Data and migration

Existing data at localhost is not automatically copied to the hosted origin. Export a workspace backup locally, open the hosted app, choose the same workspace and restore the backup. Cooking and toddler workspaces stay separate. Backup restore now remaps photo layout keys as well as photo IDs. Conversation history travels in backups with its recipe.

Supabase remains optional manual snapshot sync. Existing configured projects need `supabase/workspaces-migration.sql`. Live account isolation and cross-device cloud recovery require a configured test project; they are not implied by the local checks.

The published background artwork is original SVG. The old reference notebook image is preserved under `reference-assets/` for private design reference and is not copied into `dist`. Before making source public for submission, review all source asset rights and agree on the repository license. Do not change repository visibility or publish credentials as a deployment step.

## Local production-style preview

`npm run build` then `npm start` serves the full website and API at `http://127.0.0.1:3001` in local mode. For production authentication testing, set `NODE_ENV=production`, `APP_ACCESS_PASSWORD`, `SESSION_SECRET` and optionally `PORT` in the process environment, then run `npm start`. Production refuses to start without its demo password and session secret.
