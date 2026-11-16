# Status and handoff — Zahle Building Registry

Last updated: 16 Nov 2026, when the project owner paused for the day. Read this first when work resumes, then `plan.md` (the source of truth) and `DESIGN.md`.

## Snapshot

- **Live site:** https://zahle-registry.vercel.app (everything is behind login).
- **Repo:** https://github.com/CharbelMichelMoutran/zahle-registry. **Private.** The owner wants it to stay private until fully ready.
- **Git:** `main`, 42 commits, everything pushed. Last commit `21d106d` "Label ratings by meaning, not colour name". The working folder is clean.
- **Agents running:** none. All were stopped or finished.
- **Last deploy:** a production deploy about 4 minutes before the pause. It most likely includes the last commit, but **I did not confirm the new rating labels in the live app**. Check first thing.

## What is built and live

| Area | State |
|---|---|
| Map | 4,595 Zahle buildings copied once from OpenStreetMap into our own database. Smoother pan and zoom (zoom stops where you let go, capped flick speed, min zoom 14, tap tolerance 6px). |
| Building window | Click a building and a preview opens (latest report, or "Not yet inspected"). Maximize gives **History** and **Create report** tabs. Minimize returns. |
| Reports | Date (day/month/year), residents, construction date (autofilled, editable, an edit needs a reason and keeps the old value), roof, columns, foundations, final observation (each with a "Not inspected" box with reason, except the final one), then the rating. Add-only: the database refuses edits and deletes (triggers). |
| Map colour | Grey with a fine hatch until inspected. After a report, the building takes the latest report's colour. |
| Accounts (simulated) | Sign-up with full name, contact, OEA number, discipline, username, password. No email. "Waiting for OEA approval." then Refresh approves automatically and goes into the map. Name, discipline, contact and OEA number are locked onto each report from the account, on the server. Passwords stored as salted hashes. All data routes need login. |
| Design pass | Done from `DESIGN.md`: Zahle theme, stacked bilingual wordmark with زحلة, Source Serif display type, springy Motion tray, arch icons, hatch for unknowns, reduced-motion support, 375px phone layout. |
| Ratings | Labelled by meaning ("Good condition", "Needs some work", "Imminent risk") with colour and arches beside them. Data values stay `green`, `yellow`, `red`. Screen colours: green, amber, orange (no red). |
| Server region | Pinned to Vercel's Portland region (`vercel.json`), next to the database (US West), so loading is about 450ms. |

## Not built yet

- Ctrl+K / Cmd+K command bar and search by address, street or landmark.
- Sample buildings with realistic history (plan item 6).
- Photos in reports. Floors, structure type, seismic measures, units (all on the Later list).
- AI document-to-form (plan item 5). Needs the Anthropic Console and key, which the owner deferred.
- The polished README with screenshots, and making the repo public.
- Everything in `docs/feature-backlog.md` (owner's pasted list, not scheduled; it conflicts with the plan in places, see that file).

## How the work is divided

The main session is the **orchestrator**: it talks to the owner, keeps `plan.md` current, writes the briefs, commits plan and docs, runs the loop, and reports honestly. It writes no app code.

| Agent | Model | Job | Writes |
|---|---|---|---|
| `civil-engineer` | Sonnet | Engineering content: fields, rating wording (aligned with the US post-earthquake tags), the Lebanese codes (all still "not verified"), questions for the owner's OEA contact | Only `docs/engineering.md` |
| `coder` | Opus | All app code, database migrations, deployment | App code |
| `devils-advocate` | Session default | Tries to break features in a real browser; reports ranked problems; never fixes | Nothing |

**Loop:** civil-engineer (if engineering content is needed) → coder → devils-advocate → coder fixes what matters → owner reviews. The owner makes every decision, and the orchestrator brings choices with a recommendation.

Files that carry the work: `plan.md` (decisions, scope), `DESIGN.md` (look and motion), `docs/engineering.md` (Part A is the demo spec the coder builds from, Part B is Later), `docs/devils-advocate-checklist.md` (8 test sections), `docs/feature-backlog.md`, and this file.

## Decisions the owner has made (all recorded in `plan.md`)

- Engineers only. Nothing public. Everything behind login.
- The "Demo — fictional data" label was removed. **No "demo" wording anywhere in the app** unless the owner asks.
- Anthropic Console deferred. No AI features until it is set up.
- Report format as above; colour is a required last field with no default; history rows show the date, name, discipline, colour word and the first line of the final observation.
- Simulated accounts: no email, OEA number stored and shown on reports, no login attempt limit, discipline is trusted not checked, all signed-in engineers see each other's data (so a new engineer can call the previous one).
- Rating colours: **option A**, green, amber, orange with no red on screen. Then **A1**: labels by meaning, no colour names.
- Design references: Family (main), Raycast, and the Beirut Urban Lab family (Beirut Built Environment Database, Precarious Homes, the lab's home page). Zahle theme is a hard rule.
- Repo stays private until the owner says.
- Settings: auto-compact window set to 400,000 tokens in the owner's personal Claude settings.

## Waiting on the owner

1. **Connect Vercel to GitHub** (vercel.com/account → Connections → GitHub). Until then, deploys go by a workaround (deploying a clean copy of the committed files), because Vercel cannot match the commit email.
2. **Arch icons:** keep "more filled = more concern" (green 1, amber 2, orange 3)? The coder chose it. The orchestrator recommends keeping it.
3. **Waiting-screen text:** the civil-engineer's true version ("Your account has been created. Press Refresh to check.") is in use. The coder's alternative claimed the OEA confirms membership, which the app does not do.
4. **Send the OEA questions** (questions 1 to 15 at the end of `docs/engineering.md`) to the owner's senior OEA contact.
5. **Which feature group to do next** from `docs/feature-backlog.md` (group A recommended).
6. **Reference sites already given; `DESIGN.md` already written.** Nothing more needed for design unless the owner wants changes.

## Data and accounts

- The database was cleaned on 16 Nov 2026 after testing. Reports: 0. Construction-date changes: 0. Sessions and rate-limit counters cleared. **One account remains: the owner's "Charbel".** All test accounts were deleted. The password is the owner's own and is not recorded anywhere.
- The cleanup was a one-off owner action: append-only triggers were switched off, rows deleted, triggers switched back on in one transaction, and checked afterwards (all four are enabled). The app itself can never delete reports.
- Sign-up limit: 5 accounts per hour per visitor, 500 per day for everyone. Report saves: 10 per hour per engineer, 300 per day overall.
- Secrets live only in Vercel settings and `.env.local` (git-ignored). The Supabase project is named "CharbelMichelMoutran's Project" (the owner wanted it renamed `zahle-registry`; the CLI cannot rename it, so it is a 10-second dashboard change). Region: US West.

## Testing so far, and what is not yet verified

- **Short devil's-advocate test (about 17 steps, no Critical or High findings):** signed-out and pending accounts are refused everywhere, a forged report author is ignored, edits and deletes are refused, bad or reused cookies are refused, oversized bodies are refused. Findings: anyone can approve themselves (intended, and means rule 2 is not enforced in this version), reports can be backdated, and every engineer sees every contact (intended).
- **Not done:** the full 8-section test (stopped by the owner), the formal ui-design-review and ux-audit skill runs (the orchestrator only reviewed some screenshots by eye), a real-device check on iOS Safari, landscape phones, two tabs saving at once, and Arabic right-to-left rendering checked visually by a tester.
- **Known:** map tiles are filtered OpenStreetMap (the light CARTO tiles need a paid key). Church-cross and hospital icons show faintly.
- **Playwright MCP:** it was changed to use bundled Chromium in `.mcp.json`, but the running session never reloaded it. A scripted browser is installed in the session scratchpad. In a new session the MCP should start normally; if it does not, say so.

## How to resume

1. Read this file, `plan.md`, `DESIGN.md`.
2. Open the live site and confirm the three rating labels read "Good condition", "Needs some work", "Imminent risk". If they still say Green / Yellow / Red, ask the coder to deploy commit `21d106d`.
3. Ask the owner the questions under "Waiting on the owner".
4. Then, in this order: a focused devil's-advocate test, the formal UI review, then the next feature group the owner picks.
5. Keep the repo private. Keep "no demo wording". Keep adding features to the checklist as they are built.
