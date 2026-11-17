# Project reference — Zahle Building Registry

> **Update, 17 Nov 2026 (evening):** much was built after this file was written (map navigation, Locate building, the simpler full-screen report, resident login and map). `docs/STATUS.md` has the current state and wins where this file is older.

**For any Claude that logs in to this project.** This is the long, complete picture: what the project is, who does what, what is built, what is left, how to operate everything, and the traps to avoid. It was written on 17 Nov 2026. `docs/STATUS.md` is the short "where are we right now" file and may be newer. `plan.md` is the source of truth for scope and rules. If this file and `plan.md` disagree, `plan.md` wins.

## 0. Read this first (five minutes)

1. Read `CLAUDE.md` (your role), then `plan.md`, then `docs/STATUS.md`, then `DESIGN.md` before any UI work. `docs/engineering.md` Part A is the spec for the report and account screens.
2. The project owner **writes no code**. They direct, decide and review. Explain things in plain, short English without jargon. Bring them choices with a recommendation. They decide scope, design and engineering content.
3. Check the live state before you trust any file: `git log --oneline | head`, `git status`, and open https://zahle-registry.vercel.app.
4. If you are in a session on a different account from the one that did earlier work, you have **no memory of past sessions**. Everything you need is in the files listed in section 14.

## 1. What the project is

A **building registry for Zahle, Lebanon**. Building records in Lebanon are on unreachable paper or were never made, so engineers inspect buildings from scratch again and again. The registry is a lasting record of every building: its facts, every past inspection, and what residents have reported, so the next engineer does not start from zero.

- A **portfolio demo** for recruiters and master's admissions. They care about polish, a working live link, and a clear story.
- It is meant to be the closest thing to what the Order of Engineers and Architects (OEA) would be willing to use. Whether they adopt it is out of scope.
- A senior OEA engineer confirmed to the owner that records are missing and inspections repeat.
- The owner's GitHub is `CharbelMichelMoutran`. The repo is `github.com/CharbelMichelMoutran/zahle-registry` and is **private**. **Keep it private until the owner says it is ready.**

## 2. The people and the rules of conduct

| Who | What they do |
|---|---|
| **Project owner** (Charbel) | Decides everything, accepts or rejects work, tests the live site. Not a programmer. Prefers short plain English. |
| **Orchestrator** (the main Claude session) | Sees the big picture, keeps `plan.md` current, writes briefs, sends work to the agents, commits plan and docs, reports honestly. **Writes no app code.** |
| **Agents** | civil-engineer, coder, devils-advocate (section 3). |

Rules that apply to everyone:

- **Secrets never go into code or git.** Keys live in Vercel and Supabase settings and in `.env.local` (git-ignored). Never print or paste a key.
- **The record is never overwritten.** Inspections, documents, requests and log entries are added, never edited or deleted. The database itself enforces this for reports (triggers).
- **No "demo" wording in the app** ("This is a demo", "simulated", "made-up details") unless the owner asks. The owner asked for exactly two labels: "Demo location" and "Demo code".
- **The UI is in English.** Arabic text must display and type correctly, right to left.
- **Commits:** small, clear messages, end with the attribution line the session gives you. The repo must look good on the owner's GitHub.
- **Ask before changing production data.** The Supabase command line refuses production changes without the owner's confirmation. Read-only queries are fine.
- **Report honestly.** If something is broken, unfinished or skipped, say so. Do not claim a deploy or a test result you did not check.
- **Decisions belong to the owner.** Anything outside `plan.md` section 7 "In" goes on the Later list. If a request conflicts with the plan, ask. (If the owner explicitly asks for the conflicting thing, change the plan and say what changed.)

## 3. The agents: what each can do

Agents live in `.claude/agents/`. **Every agent starts with no memory of the conversation.** A brief must say what to build, which plan sections apply, and what "done" means. Start one with the Agent tool (`subagent_type` = its name), run long jobs in the background, and resume or correct a running or finished agent with SendMessage using its id. Stop one with TaskStop. Agents report back to the orchestrator, not to the owner. The owner cannot chat with an agent directly from the main session.

| Agent | Model | Tools | Writes | Job |
|---|---|---|---|---|
| **civil-engineer** | Sonnet | Read, Grep, Glob, Write, Edit, WebSearch, WebFetch | Only `docs/engineering.md` and `claude/lebanon-engineering-context.md` | Engineering content: building facts and inspection fields, rating wording (aligned with the US post-earthquake ATC-20 tags), the Lebanese codes (Law 646/2004, Decrees 14293 and 7964, all still marked "not verified"), sample data, the protected list of warning signs, the Lebanon context file, and questions for the owner's OEA contact. Never writes app code. |
| **coder** | Opus | All tools | All app code, database migrations, scripts, deployment | The **only** agent that writes app code. Follows `plan.md`, `DESIGN.md`, `docs/engineering.md`. Verifies its own work in a real browser, commits in small steps, pushes, and deploys. |
| **devils-advocate** | Session default | Read, Grep, Glob, Bash, Playwright MCP | Nothing | Tries to break each finished feature in a real browser, as an attacker and as a confused person. Reports problems ranked Critical, High, Medium, Low. **Never fixes code.** Works from `docs/devils-advocate-checklist.md`. |

**The loop for each feature:** civil-engineer (if it has engineering content) → coder → devils-advocate → coder fixes what matters → owner reviews.

How the agents have actually behaved, so you can plan around it:

- Tell the coder to **verify on the live site** and to **list what does not match** `DESIGN.md` or the spec. It reports honestly when asked.
- The coder labels its commits "Claude Opus 5.5" (the model that ran). That is fine.
- The devil's advocate cannot watch a clock. To time-box it, give it a tool-call budget and stop it with TaskStop if it overruns. Its first full run was stopped by the owner after about 33 minutes with no report. A focused run of about 17 tool calls worked well.
- Usage limits hit during long coder runs once. A stopped agent can be resumed with SendMessage and its work so far is saved in the working folder.

Other tools in the environment: the Playwright MCP is configured in `.mcp.json` (set to bundled Chromium). A session only reads that file at start, so a session started before the change still looks for Google Chrome. Installed plugins and skills (UI review, VectorLab UX skills, an audit suite) are listed in `DESIGN.md` section 9.

## 4. The product, in plain words

Two roles, set by the account (the owner's decision of 16 Nov 2026; see `plan.md` sections 3 and 7):

- **Engineer** (civil engineer, structural engineer, or architect). Sees every building and report. The Order's role is merged into this one.
- **Resident** (verified by phone). Sees **only their own building**. *Not built yet.*
- **The public sees nothing.** Signed out, no building data is reachable.

### What an engineer does today (built)

1. Signs up (full name, contact number, OEA membership number, discipline, username, password; no email anywhere).
2. Sees "Waiting for OEA approval." Presses **Refresh** and is approved automatically (simulated) and goes straight into the map.
3. Clicks a building. A small **preview** shows the latest report (date, rating word, first line of the final observation) or "Not yet inspected".
4. **Maximizes** the tray to get two tabs: **History** (past reports, newest first) and **Create report**.
5. Fills the report: date (day/month/year), people living in the building, construction date (autofilled from the previous report, editable, an edit requires a reason and keeps the old value), observations on the roof, the columns, the foundations, and a final observation (each of the first three has a "Not inspected" tick box with a reason), then picks the **rating** (required, last, no default).
6. The building turns the rating colour on the map. Unrated buildings are grey with a fine hatch.

The engineer's name, discipline, contact and OEA number come from the account **on the server** and are locked onto every report. All signed-in engineers can see each other's data and contact details, on purpose, so a new engineer can call the previous one.

### Ratings

Three ratings, labelled by **meaning** (never by colour name): **Good condition** (data value `green`), **Needs some work** (`yellow`), **Imminent risk** (`red`). On screen: green `#1FA971`, amber `#F5A524`, and **red** (owner decision of 16 Nov 2026; start at `#D6402B`). A one, two or three filled arch icon sits next to the word so colour is never the only signal. The form warns that after an earthquake these ratings are used for triage. Wording comes from `docs/engineering.md` D4.

## 5. Product rules (from `plan.md` section 4)

1. **A colour never stands alone.** Every rating is shown with the engineer's remarks and its word.
2. **Nothing is public.** Engineers see all; a resident sees only their own building (database row-level security, not only the screens).
3. **Unknowns are "Not yet verified"**, never findings.
4. **The record is separate from enforcement.** The app records facts. Fines and evacuations stay with the authorities.
5. **Never overwrite the record.**
6. **The AI never hides or deletes anything.** "Unwise" submissions are held for a human.
7. **The protected list always flags** and cannot be learned away (cracking sounds, new or widening cracks, cracks after a tremor, sagging, doors or windows suddenly sticking, tilting), enforced in code.
8. **A resident never sees another building's status or any Claude flag.**

## 6. Technical overview

| Part | Choice |
|---|---|
| App | Next.js 16 + React 19, TypeScript, App Router, Tailwind 4. **This is a newer Next.js than most training data. Read `node_modules/next/dist/docs/` before writing code** (`AGENTS.md` says so). |
| Map | Leaflet + OpenStreetMap tiles (desaturated with CSS). Building outlines were copied **once** into our database from OpenStreetMap (4,595 buildings in central Zahle; box south 33.835, west 35.885, north 33.86, east 35.92). Never loaded live, because OSM ids change. |
| Motion | The `motion` package (springs), tokens in `src/lib/motion.ts`. |
| Database and storage | Supabase (Postgres + PostGIS), project ref `wnbftekrtaprovjpyvpv`, region us-west-2. The project is still named "CharbelMichelMoutran's Project"; the owner wanted it renamed `zahle-registry` (dashboard only, the CLI cannot rename). |
| Hosting | Vercel, project `zahle-registry`, team of user `charbelmichelmoutran`. Server code is pinned to Vercel's Portland region (`vercel.json`, `pdx1`) next to the database. |
| AI | Claude API, **planned, not connected**. The owner said on 17 Nov 2026 "we'll connect AI to the website later". |

### Repo map

- `src/app/` pages (`/login`, `/signup`, `/waiting`, `/`) and API routes (`api/auth/*`, `api/buildings`, `api/buildings/colours`, `api/buildings/[id]/reports`).
- `src/components/` the map (`BuildingMap`, `MapView`), the tray (`BuildingPanel`), `report/*` (form, read-only view, rating badge), `auth/*`, `ui/*` (wordmark, arch icon, button).
- `src/lib/` `content.ts` (**all user-facing wording lives here**), `report.ts` (validation and limits), `account.ts`, `session.ts`, `api-auth.ts`, `motion.ts`, `supabase-server.ts`.
- `src/proxy.ts` redirects signed-out users.
- `supabase/migrations/` six migrations (buildings, building functions, reports, report functions, a lock fix, engineer accounts).
- `scripts/import-osm-buildings.ts` the one-off, re-runnable OSM import (`npm run import:buildings`).

### Data tables

`buildings`, `reports`, `construction_date_changes`, `report_rate_limits`, `engineers`, `sessions`, `signup_rate_limits`. Reports and construction-date changes have **triggers that refuse update, delete and truncate**. Accounts: passwords are salted scrypt hashes; sessions are a signed httpOnly cookie checked on the server; the browser never talks to the database, only our server does, using the secret key. Environment variables are `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (plus a Vercel token Vercel adds). Their values are never in git.

### Limits already in place

Sign-up: 5 per visitor (hashed IP) per hour, 500 per day overall. Report saves: 10 per hour per engineer and per visitor, 300 per day overall. Request bodies are capped (1 MB reports, 5 KB sign-up). A stale-form check refuses a report if a newer one arrived while the engineer was typing.

## 7. Design

`DESIGN.md` is the spec: Family's springy trays, Raycast's precision, **a Zahle theme**, and the Beirut Urban Lab sites (stacked bilingual wordmark, serif display titles, uppercase micro-labels, dashed hairlines, a hatch for unknowns). Light and warm only: no black, no dark mode. Fonts: Inter, Inter Tight, Source Serif 4 (display moments only), IBM Plex Sans Arabic. Red is allowed for the "Imminent risk" rating **only**; form errors use dark orange. Orange (`#F07B2E`) is reserved for Claude's flags. Where a generic skill disagrees with `DESIGN.md` (for example springs), `DESIGN.md` wins.

## 8. What has been done (as of 17 Nov 2026)

- GitHub repo, Supabase project, Vercel deployment, three agents, Playwright config.
- `plan.md`, `DESIGN.md`, `docs/engineering.md`, `docs/devils-advocate-checklist.md` (12 sections), `docs/feature-backlog.md`, `docs/STATUS.md`, this file.
- The live app: map with 4,595 buildings and smoother navigation; sign-up, approval and login (simulated approval, everything behind login); the building tray (preview, maximize, History, Create report); add-only reports with locked author details; rating colours on the map; the full design pass; ratings labelled by meaning; server moved next to the database.
- Tests: one short devil's-advocate run (about 17 steps) found no Critical or High problems. Signed-out and pending accounts are refused on every route, a forged author is ignored, edits and deletes are refused, bad cookies are refused, oversize bodies are refused.
- The database was cleaned after testing on 16 Nov 2026: 0 reports, one account (the owner's "Charbel").

## 9. What still needs doing

### In progress right now
- **Make the worst rating red** (coder, started 17 Nov 2026). Confirm the new rating labels are live.

### Planned, in the build order (`plan.md` section 12; the owner decides the order)
(a) red for the worst rating and the **Cmd+K command bar**; (b) **location suggestion** (item 11); (c) the Anthropic Console, then AI document-to-form and the context file (item 20) — **AI is deferred by the owner for now**; (d) unify login, then **residents** (items 12 to 15); (e) Claude **sorting and flagging** with verdicts (16, 17, 18); (f) the **rulebook** (19); (g) **engineer map query** (21); (h) sample data, README and the full test.

The 12 features are `plan.md` section 7 items 11 to 22, with the owner's original text in `docs/feature-backlog.md`.

### Smaller open items
- Sample buildings with realistic history (plan item 6).
- Search by street, neighbourhood or landmark (OSM has few addresses in Zahle).
- Photos in reports. Floors, structure type, seismic measures and units (all on the Later list; drafted in `docs/engineering.md` Part B).
- Polished README with screenshots, and making the repo public (only when the owner says).
- The full devil's-advocate run, the formal UI review and UX audit skills, and an iOS Safari check (none done).
- Optional inspection type, basement levels, assigning reviews to engineers, on-site check, and the post-earthquake triage queue (Later list).

### Waiting on the owner
1. Connect Vercel to GitHub (vercel.com/account → Connections → GitHub). Until then deploys use the workaround in section 11.
2. Send questions 1 to 15 at the end of `docs/engineering.md` to the owner's senior OEA contact. The Lebanese law descriptions, the seismic figure and the tag conventions are all unverified.
3. The Anthropic Console (sign up, $50, a $50 hard limit, a key) when AI is connected, and Twilio (free trial) for one real SMS at the residents step.
4. Approve the build order. Decide how to unify the two login systems (own login for engineers, Supabase Auth for residents) before residents are built.
5. Keep or change the arch icons (more filled = more concern). The orchestrator recommends keeping them.
6. Rename the Supabase project in the dashboard.

## 10. Decisions log (all in `plan.md`)

- **Engineers first, then residents.** Engineers only at the start; on 16 Nov 2026 the owner widened the scope to residents and the AI features and overturned the earlier "no resident view".
- Nothing public; engineers see all, residents only their own building.
- The "Demo — fictional data" label was removed. No demo wording anywhere, except "Demo location" and "Demo code".
- Anthropic Console deferred, then needed, then "later" (17 Nov 2026).
- Report format: required last rating with no default; History rows show date, name, discipline, rating word and the first line of the final observation.
- Accounts: no email; the OEA number is stored and shown on reports; no login attempt limit; discipline is trusted; all engineers see each other's data.
- Ratings: labelled by meaning. Screen colours: green, amber and **red** for the worst (the earlier no-red decision was reversed on 16 Nov 2026).
- Design references: Family (main), Raycast, the Beirut Urban Lab family. Zahle theme is a hard rule.
- Repo private until the owner says. Auto-compact window set to 400,000 tokens in the owner's personal settings.

## 11. How to operate things

**Run locally:** `npm install`, then `npm run dev` (needs `.env.local` with the two Supabase variables, which is git-ignored). Lint and build: `npm run lint`, `npm run build`.

**Deploy (current workaround).** Vercel blocks deploys made from the repo because the commits use GitHub's private noreply email, which Vercel cannot match to the account. The coder has been deploying a **clean copy of the committed files without git history** with `vercel deploy --prod`. The fix is for the owner to link their Vercel account to GitHub, then run `vercel git connect`. Do not change the git email to the owner's real address, because it would become public with the repo.

**Look at the database (read-only, safe):**
`supabase db query --remote --read-only "select count(*) from public.reports;"`
**Changing production data** needs `--yes`, and the tool says to ask the user first. Do ask. The reports tables refuse deletes by design. The owner-approved cleanup on 16 Nov 2026 did this in one transaction: disable the two append-only triggers, delete, re-enable them, then confirm all four triggers show enabled (`select tgname, tgenabled from pg_trigger where tgname like '%append_only' or tgname like '%no_truncate'`).

**Browser testing.** The Playwright MCP may not start if the session loaded `.mcp.json` before it was fixed. A scripted fallback: in an empty folder run `npm install playwright` and `npx playwright install chromium` (no sudo; installing Google Chrome needs the owner's password, so avoid it), then drive pages from small node scripts. The earlier scripts lived in the session's scratchpad folder, which is temporary and may be gone.

**Rate limits and test accounts.** Sign-up is limited to 5 per hour per visitor, so tests exhaust it quickly. Use one test account with a clear prefix (`coder-test-`, `da-test-`) and tell the orchestrator what you created so it can be cleaned up. Passwords are hashed, so a forgotten test password cannot be recovered; create a new account instead.

**Commit etiquette.** `git add` named files, small messages, push to `origin main`. Do not commit `.env*`.

## 12. Known issues and traps

- Anyone can approve themselves by pressing Refresh (intended). It means plan rule 2 is enforced for the public but not against a determined stranger who signs up. The README should say so honestly when it is written.
- Reports can be backdated (useful for old paper reports). The stale-form check only compares to the newest report by date.
- Map tiles are filtered OpenStreetMap. The light CARTO tiles need a paid key. Church and hospital icons show faintly.
- The deploy workaround above, and the fact that the Playwright MCP needs a session restart after `.mcp.json` changes.
- Buildings are drawn on a canvas, so keyboard and screen-reader users cannot select them (known gap).
- The live feed `/api/buildings` is login-protected now (it was public and cached earlier).
- A usage limit can stop a long agent run. Check `git status` after a stop; the coder commits in small steps.
- Plugins installed by the owner (audit suite, VectorLab UX skills, UI Design Review) add many skills. Use them, but `DESIGN.md` wins where they conflict.

## 13. Glossary (plain words)

- **Tray:** the panel that slides up from the bottom (phone) or sits bottom-left (desktop) when a building is clicked.
- **Preview / maximize / minimize:** the small tray, the full tray with tabs, and back.
- **Rating:** the green, amber or red condition for natural disasters. **Imminent risk** is the worst.
- **Hatch:** the fine diagonal pattern for "Not yet inspected" and "Not yet verified".
- **Arches:** the one, two or three filled arch icons next to a rating, from Zahle's three-arch windows.
- **Append-only:** rows can be added, never edited or deleted. The database enforces it.
- **RLS (row-level security):** database rules that decide which rows each logged-in person may read.
- **Protected list:** warning signs that must always raise a flag.
- **Orchestrator:** the main Claude session that directs the agents and talks to the owner.

## 14. Document map

| File | Use |
|---|---|
| `CLAUDE.md` | Your role as orchestrator and the rules for everyone |
| `plan.md` | **Source of truth:** problem, approach, rules, scope (items 1 to 22), team, risks, build order |
| `docs/STATUS.md` | Short current state and what the owner is waiting on |
| `docs/REFERENCE.md` | This file |
| `DESIGN.md` | Look, colours, type, motion, screens |
| `docs/engineering.md` | Engineering content. **Part A** = the demo spec the coder builds from. **Part B** = Later (fuller facts, laws, photos) |
| `docs/devils-advocate-checklist.md` | What the devil's advocate must test (12 sections) |
| `docs/feature-backlog.md` | The owner's 12 features, original text, and how conflicts were resolved |
| `README.md` | Public-facing stub (full README still to write) |
| `AGENTS.md` | Next.js agent rule block written by `next dev` |

When you change something that others rely on, update `plan.md` first, then `docs/STATUS.md`, and tell the owner what changed.
