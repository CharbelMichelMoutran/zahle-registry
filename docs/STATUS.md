# Status — Zahle on Record

Last updated: 22 Nov 2026. Read this first, then `plan.md` (source of truth) and `DESIGN.md` (before UI work). Older detail is in git history.

## Where it stands

- **Live:** https://zahle-registry.vercel.app (open to anyone while login is frozen). Production = commit `b82ca8c` (deployed 22 Nov).
- **Repo:** https://github.com/CharbelMichelMoutran/zahle-registry. **Private until the owner says.**
- **Database:** 10 migrations applied (last `20261122000100_demo_accounts.sql`). Resident tables removed. Append-only triggers on.
- **Data:** 4 engineer accounts plus the 2 stand-ins (Demo Engineer, Demo EMT), and the reports from the owner's testing. Reports are permanent unless the owner approves a cleanup.

## What's built

- **Two maps (22 Nov):** the landing page offers "Engineer" (`/engineer`) and "EMT" (`/emt`, Red Cross). Each has its own copy of the map screens in `src/components/engineer/` and `src/components/emt/`, and both share one database: a report saved on one shows on the other after a reload. Same features on both.
- **Login frozen (22 Nov):** `LOGIN_FROZEN` in `src/lib/maps.ts`. Both maps are open to anyone; reports are signed by the map's stand-in account. Login, sign-up and waiting pages send you to `/`. The code stays.
- **Map:** Zahle buildings from OpenStreetMap, coloured by condition (worst = red `#D6402B`), toned grey map with hillshade, collapsible key. Trackpad pans, pinch zooms, + and − buttons.
- **Both maps:** building tray (status, year built, last date), history, full-screen report (rating is the only required field). Reports are add-only.
- **Go to building:** top-bar button; "Use current location" currently picks a random real Zahle building.
- **Landing page:** public start screen with a pre-rendered map of Zahle and the two map buttons. Text unchanged (two lines still mention residents; the owner said not to touch the wording yet).
- **Look:** renamed **Zahle on Record**; IBM Plex type, Amiri زحلة, accent `#1E5A8C`, off-white `#F6F7F8`, Record logo with river ribbon.

## Key decisions

- Worst rating is red; orange is reserved for Claude's flags.
- Records are add-only: reports are never edited or deleted.
- No demo notices in the app.
- No engineer side panel (on the Later list).
- AI direction is **undecided**. The recommendation: Claude rates visit urgency (Urgent / Soon / Routine) and never the condition colour.

## File map

| Where | What |
|---|---|
| `plan.md` | Problem, scope, rules, build order |
| `DESIGN.md` | Visual rules (sections 13 to 15 are the latest pass) |
| `docs/feature-backlog.md` | The 12 widened-scope features |
| `src/app/` | Pages: landing (`/`), engineer, emt, login, signup, waiting (frozen), API |
| `src/components/engineer/`, `emt/` | Each map's own screens: app and top bar, map, tray, report form and view, key, Go to building |
| `src/components/` | Shared: landing, auth (frozen), ui, report badges and fields, map navigation |
| `src/lib/maps.ts` | The two maps, `LOGIN_FROZEN`, stand-in account names |
| `src/components/map-navigation.ts` | Trackpad and zoom engine (uses private Leaflet methods) |
| `src/lib/location.ts` | `getCurrentLocation()`, the stand-in for real location |
| `supabase/migrations/` | Database schema |
| `scripts/` | Building import, hillshade, landing map, logo renders |

## Open tasks

1. **Next:** the owner decides what the EMT map should do differently, and the AI direction (the resident inspection chat is gone).
2. Then, in the order the owner chooses: Claude flagging, rulebook, map query, Cmd+K, sample data, README, full test. Live updates between the maps without reload are on the Later list.
3. UI pass stage 4 (final check) not started.
4. Owner choices: show "Record" alone in the top bar (the Arabic is too faint at 32px)? Make the footer tie a single sweep (the loop reads like a paperclip)? DESIGN.md 15.1 is out of date. Landing text still mentions residents.
5. Owner to do: set up the Anthropic Console; connect Vercel to GitHub.
6. Commit or ignore the new `.agents/` skills folder and `skills-lock.json` change (installed 22 Nov), and the untracked `Lebanon_Building_Safety_Assessment_Form_Phone.pdf`.

## Known bugs and gaps

- No agent has tested the 17 Nov features or the second UI pass in a browser beyond Chrome. Not checked yet: Safari, Firefox, phones, the signed-in map with real data, and Arabic text.
- While login is frozen, anyone with the link can read every building and save reports (10 an hour per map, shared by everyone). Reports can be backdated.
- Canvas buildings cannot be selected by keyboard.
- A mouse wheel pans instead of zooming. Ctrl+wheel page zoom is blocked on the map.
- The EMT report shows "OEA no. DEMO-EMT" and the form's engineer wording; left as is (no feature changes).
- Not tested in the browser: saving a report from either map (skipped so no fake report lands in the live record). Reading, the tray, the form and the stand-in signer were checked on 22 Nov.
- Deploys use a workaround until Vercel is linked to GitHub: `git archive HEAD` into a scratch folder, copy `.vercel/`, then `vercel deploy --prod --yes`.
