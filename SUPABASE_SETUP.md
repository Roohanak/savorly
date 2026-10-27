# Connect your computer and iPad

The app is ready for Supabase, but cloud sync is not active until you create and configure a project. You do not need this setup for local photos or recipes.

1. Create a project at https://supabase.com/dashboard. Review the plan and limits shown there before choosing it.
2. Open SQL Editor, paste `supabase/setup.sql`, and run it once. It creates the journal table and policies so each signed-in user can read and update only their own journal.
3. In Authentication → Email Templates → Magic Link, use a code template:

   ```html
   <h2>Your Savorly sign-in code</h2>
   <p>{{ .Token }}</p>
   ```

   Email sign-in must be enabled. Supabase's default email sender restricts who can receive email and is for testing; add your test email to the project's allowed team addresses as supported by the dashboard, or configure your own SMTP provider in Authentication for real users. See https://supabase.com/docs/guides/auth/auth-smtp.

4. Find the project URL and **publishable** key in the project's Connect dialog / Settings → API Keys. Add these to `.env` in the cooking-journal-app folder:

   ```env
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
   ```

   These values are intended for browser apps. Never put a secret or service-role key here. Leave RLS enabled.

5. Restart `npm run dev`. Open **Sync between devices**, enter your email and the emailed code.
6. On the first device, click **Save this device to cloud**. On the second device, sign in using the same email and click **Load cloud journal** before editing. Save back to cloud when finished. The app refuses a save if another device changed the cloud copy since your last load/save. This is manual whole-journal sync, not simultaneous collaboration or automatic merging.

Recipes and compressed photo data travel together as one private JSON snapshot. Cloud snapshots are limited to 15 MB in the app (16 MB in the database). This keeps the first version simple; larger journals should migrate photos to private object storage. No public photo bucket is created.

## Open on iPad

For a local test, connect both devices to the same trusted Wi-Fi. In the project terminal run:

```powershell
npm run dev -- --host 0.0.0.0
```

Open the **Network** URL printed by Vite on your iPad. Windows may ask whether to allow access on your private network. Stop the server when finished. This is for testing, not a public deployment. Supabase sign-in and journal sync use HTTPS even during a local UI test. The AI proxy still needs its separate local server.

For regular use, deploy the frontend to an HTTPS hosting service, set the same two VITE variables in its build settings, and host the AI backend separately. The Vite proxy does not exist in a static production build. Do not expose the current unauthenticated AI helper publicly.

## Keep a backup

Export includes recipes **and photos**. Restore validates the file and preserves the prior journal as a recovery copy in this browser. **Export recovery copy** lets you download it. Clearing browser data can remove local photos, recipes and recovery copies; keep exported files somewhere safe.

## Verify before relying on cloud sync

Use two different test accounts: account B must not be able to read or update account A's journal. Then test one account in two browsers: a stale save must fail, and a load must retrieve photos. These live checks require your configured Supabase project and have not been performed by Codex without it.

Official references: https://supabase.com/docs/guides/auth/auth-email-passwordless and https://supabase.com/docs/guides/database/postgres/row-level-security.
