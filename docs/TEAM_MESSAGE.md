# Message to send your labmate

Hey! Would you like to join me for the Nebius × NVIDIA Global AI Hackathon? I've been building **Savorly**, a personal cooking journal, and I'd really value your product insight and help getting it ready to submit.

**The idea / MVP:** Keep the whole cooking experiment in one place: jot down a rough idea, add photos or sketches, record how each attempt turned out, turn typed notes into a clear recipe with AI, save it, and plan when to cook it again. The useful part is keeping our own cooking history and learning from it.

**What is already working:**
- Separate journal, recipe book, attempt log, weekly planner, templates, AI companion, and settings pages.
- Colored notebook templates, text and pen tools, movable/resizable photos, cute draggable stickers, and a scrapbook background with a plain-paper option.
- AI recipe drafts, attempt comparisons and ingredient-swap suggestions using NVIDIA Nemotron through Nebius Token Factory. Drafts can be edited and saved without overwriting the original journal.
- Clickable saved recipes, servings adjustment and step-by-step cook mode.
- A weekly notebook template linked to Meal Planner, with grocery sticky notes, shopping checkboxes and weekly notes.
- Local saving, full backups, and experiment delete/restore. There are 25 automated checks; lint and production build pass. This still needs independent testing, especially on an actual iPad.

**Where I'd love you to take the lead:**
1. **Test the MVP end to end:** start from a clean clone; try normal and awkward inputs, reloads, photos, sticker/pen interactions, backups and deletion recovery. Check mobile/tablet layouts and an iPad/Pencil if you have access. Please log reproducible bugs with screenshots and fix the important ones first.
2. **Make it clearer and more interactive:** give honest feedback on navigation, editor tools, meal planning, empty states and feedback after actions. Polish confusing interactions, touch targets and accessibility. Let's agree on one or two useful improvements instead of expanding every feature.
3. **Help finish the technical gaps:** verify optional Supabase sync and account isolation with a configured project; help prepare a hosted demo or test build. The AI backend needs authentication, usage limits and production routing before public hosting.
4. **Submission prep together:** review the demo flow, record a video under three minutes, document how we use Nebius/NVIDIA, check asset permissions and agree on the open-source license before making the repo public.

I'll keep responsibility for the product direction, journal/recipe workflow, integration context and Devpost submission, and we can review each other's changes through branches and pull requests. The MVP is the priority; handwriting/photo recognition and richer grocery unit conversion are stretch work, not features we should promise yet.

**Setup:** Node.js 24, npm, Git and VS Code. Once you accept the private GitHub invitation:

```sh
git clone https://github.com/roohanak/savorly.git
cd savorly
npm ci
npm run dev
```

Open the URL printed by Vite, normally http://localhost:5173/. The local journal works without credentials. For AI, copy `.env.example` to `.env`, add your own Nebius key, and run `npm run server` in a second terminal. No Python, Docker or local GPU is needed. README.md, CONTRIBUTING.md and docs/TEST_PLAN.md cover the environment and workflow. Cloning shares code, not my journal data or API key.

**Cost and prizes:** Local development has no AI API cost unless you enable those calls. Nebius AI usage consumes your account credits; hosting costs depend on what we deploy, so let's agree on a budget first. The event advertises $50,000+ in prizes, including a $20,000 grand prize. We would likely enter Best Apps and Agents. Let's agree on roles, credit and any prize split before submitting.

**Deadline: Friday, October 30, 2026, at noon Central / 10 AM Pacific.** I'd like to freeze core features and aim for a submission-ready build on Thursday so we're not rushing at the deadline.

Send me your GitHub username if you're interested, and I'll invite you. We'll also need to add you to the Devpost team separately. What would you improve first after trying the app?

Official event/prizes/deadline: https://nebiusglobalaihackathon.devpost.com/
