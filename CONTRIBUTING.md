# Working together

## First setup

Read README.md, accept the GitHub repository invitation, clone the repository, run `npm ci`, and create your own `.env` from `.env.example`. Do not copy another person's credentials into Git. No local journal content is shared by cloning.

## Branch workflow

Start from an up-to-date main branch:

```powershell
git switch main
git pull --ff-only origin main
git switch -c feature/planner-polish
```

Edit in VS Code, test locally, then:

```powershell
npm test
npm run lint
npm run build
git status
git add src/MealPlanner.tsx
# Add the other specific source/doc files you intended to change.
git commit -m "Improve weekly planner layout"
git push -u origin feature/planner-polish
```

Open the repository on GitHub and choose Compare & pull request. Describe the user-visible behavior and checks. Have the other teammate review and merge. Then return to main and `git pull --ff-only origin main` before the next task. Never force-push main or commit `.env`, exported journals, node_modules, dist, keys, or backups.

If Git asks for an author identity, set your own details locally in this repository:

```powershell
git config user.name "Your name"
git config user.email "Your GitHub-verified or GitHub noreply email"
```

For authentication, use Git Credential Manager's GitHub sign-in, GitHub Desktop, or VS Code's GitHub sign-in. Never paste an API token into a remote URL or chat.

## Review priorities

Keep original journal data intact. Test on a separate browser profile or export a backup before destructive UI tests. Add tests for behavior/data-integrity changes; use browser checks for layout and pointer interactions. Avoid editing every stylesheet at once; `Polish.css` overrides earlier styles. Coordinate changes to `App.tsx` to reduce conflicts.

## Access

The owner invites collaborators at the repository's Settings -> Collaborators page. The teammate must accept the invitation before cloning a private repo. Repository access is separate from the Devpost team invitation. Neither invitation shares the Nebius API key.
