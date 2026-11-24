# Status — Zahle on Record

Last updated: 24 Nov 2026 (night). Read this first, then `plan.md` (source of truth) and `DESIGN.md` (before UI work). Older detail is in git history.

## Where it stands

- **Live:** https://zahle-registry.vercel.app (open to anyone while login is frozen). Production = commit `63623a8` (portfolio landing page and Volunteer map, deployed 24 Nov; the engineer report went live just before). `ANTHROPIC_API_KEY` is not set yet, so every Claude step shows "Claude is not connected yet" and falls back to manual entry.
- **Repo:** https://github.com/CharbelMichelMoutran/zahle-registry. **Private until the owner says.**
- **Database:** 13 migrations applied (last `20261125000000_engineer_report.sql`, 24 Nov: report details, photos, report numbers; then `20261124000000_map_looks.sql`; before it `20261123000000_emt_assessments.sql`: assessments, debriefs, Claude call log, private `assessment-photos` storage, map colours from reports and assessments). Append-only triggers on.
- **Data:** 4 engineer accounts plus the 2 stand-ins (Demo Engineer, Demo EMT), and 2 EMT assessments. **No reports:** the 6 old reports were deleted on 24 Nov (owner's one-time exception, plan item 27); backup in `backups/reports-2026-11-24T01-54-03-346Z.json` on the owner's laptop. Append-only guards checked back on.

## What's built

- **Two maps (22 Nov):** the landing page offers "Engineer" (`/engineer`) and "EMT" (`/emt`, Red Cross). Each has its own copy of the map screens in `src/components/engineer/` and `src/components/emt/`, and both share one database: a report saved on one shows on the other after a reload. Same features on both.
- **Login frozen (22 Nov):** `LOGIN_FROZEN` in `src/lib/maps.ts`. Both maps are open to anyone; reports are signed by the map's stand-in account. Login, sign-up and waiting pages send you to `/`. The code stays.
- **Map:** Zahle buildings from OpenStreetMap, coloured by condition (worst = red `#D6402B`), toned grey map with hillshade, collapsible key. Trackpad pans, pinch zooms, + and − buttons.
- **Both maps:** building tray (status, year built, last date), history, full-screen report (rating is the only required field). Reports are add-only.
- **EMT safety assessment (22 Nov, plan item 25):** "Start assessment" on the EMT map. ATC-20 Detailed core plus the Lebanese form's scene safety, location, construction and Actions. Photos to private storage, Claude reads each one, the EMT changes anything, stops on danger with an evacuation order. Saved once at the end; posting colours the building on both maps, labelled "EMT posting, not yet reviewed by an engineer". Files: `src/lib/atc20.ts` (the form), `src/lib/claude.ts` (every Claude call), `src/components/emt/assessment/`, `src/components/report/AssessmentParts.tsx`, `src/app/api/emt/`.
- **Map colours (23 Nov, plan item 26, live):** an engineer report fills the building; an EMT posting colours only the outline (red: thick, on top); green fades to dark grey after 6 months; no red dots. New key rows. Logic in `src/lib/record.ts` (`mapLook`), drawing in both `BuildingMap.tsx`. Migration `20261124000000_map_looks.sql` (function `building_map_records()`) applied.
- **Claude debrief (22 Nov):** 2–4 lines at the top of the tray and history on both maps. Stored in `building_debriefs`, rewritten after a page load when the record has grown (`src/lib/debrief.ts`).
- **Go to building:** top-bar button; "Use current location" currently picks a random real Zahle building; on the EMT map, the building with an unfinished assessment if there is one.
- **Landing page:** public start screen with a pre-rendered map of Zahle and the two map buttons. Text unchanged (two lines still mention residents; the owner said not to touch the wording yet).
- **Look:** renamed **Zahle on Record**; IBM Plex type, Amiri زحلة, accent `#1E5A8C`, off-white `#F6F7F8`, Record logo with river ribbon.

## Key decisions

- Worst rating is red; orange is reserved for Claude's flags.
- Records are add-only: reports are never edited or deleted.
- No demo notices in the app.
- No engineer side panel (on the Later list).
- **Golden rule:** the app must never frustrate the person using it (top of plan.md).
- AI direction (22 Nov): the EMT assessment and the debrief. Old items 16–19 are on the Later list.
- Claude model: Sonnet 5.5 (owner's choice for cost); Opus is one line in `src/lib/claude.ts`.

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

## Start here next session (owner back from a break)

1. Owner sends the Anthropic API key. Add it with `vercel env add ANTHROPIC_API_KEY production` (and preview), and as `ANTHROPIC_API_KEY=` in `.env.local`. Never in code or git. Restart `npm run dev`, then redeploy (workaround at the bottom).
2. Quick check: `curl -X POST -H "x-zr-map: emt" -H "Content-Type: application/json" <site>/api/emt/posting -d '{"draft":{"items":{},"photos":[]}}'` should no longer say `"claudeStatus":"off"`.
3. Owner tests at Stanford as the EMT: EMT map → Go to building → Use current location → Start assessment, with real photos. The first save is the first real assessment record.
4. Tune Claude's instructions in `src/lib/claude.ts` from what the owner sees (ratings, sketches, posting). Opus switch is `CLAUDE_MODEL` there.
5. HTML debrief of the 22 Nov build: https://claude.ai/artifact/7ZuPYAo6NEyF3kE7EbekXf

## Open tasks

00. **Plan item 29 (built 24 Nov, local only, not deployed):** Claude's confidence, downgrade warning and disagreement tags; the priority formula (`src/lib/priority.ts`); "Ask" on the engineer map (`src/components/engineer/AskPanel.tsx`, `src/app/api/engineer/query/route.ts`, `src/lib/query-filter.ts`); "Near me" on the volunteer map (`src/components/emt/NearMePanel.tsx`); real location in Zahle (`src/lib/location.ts`); "How buildings are ranked" on the landing page. Migration `20261126000000_claude_confidence.sql` **applied** to the live database (adds `assessments.claude_confidence`). On phones under 420px the top-bar logo is hidden so the buttons fit.
    - Checked in the browser with Claude off: the ready-made searches, the ranked list, the map highlight, tap-to-fly, Near me (random-building path), the landing section, both top bars at 390px. The ranking was checked on 14 made-up buildings.
    - **Not tested yet (needs the Anthropic key):** Claude's confidence numbers, typed questions in "Ask", the downgrade warning with a real Claude posting. Real GPS in Zahle not tested. Existing 2 assessments have no confidence (Claude was not used), so they rank first.
000. **Portfolio landing page (plan item 28): live 24 Nov (owner's go), with the photo-rights issue below still open.** Files: `src/components/landing/` (`Landing.tsx`, `motion.tsx`, `landing.css`), words in `src/lib/landing-content.ts`, author photo `public/landing/author.webp`. Checked headless at 1440 and 390 px: no errors, no sideways scroll. Not yet checked: Safari, a real phone, hover effects. Owner to approve the wording section by section.
    - **Owner, 23 Nov (later):** removed "How it's built", the Result section (numbers, Red Cross as owner) and the sources list; sources now open from the small numbered badges. Next.js dev badge hidden (`next.config.ts`). Owner's photos placed: Zahle from the hill (Task, `public/landing/zahle.webp`) and a damaged building (Claude sketch, `public/landing/damaged-building.webp`).
    - **Photo rights to settle before deploy:** the damaged-building photo is UNDP Lebanon's on Flickr (UNDP209), marked **All rights reserved**: ask UNDP Lebanon for permission or swap for a free-licence photo. The Zahle photo's source is unknown (627 × 650 px, looks like a social-media repost): find its author or replace it with a larger free one.
    - **Placeholders to replace before launch** (grey frames tagged "Placeholder"): (1) Situation photo: damaged building in Tripoli; (2) clip: engineer map; (3) clip: volunteer assessment; (4) **Claude's real sketch** of the damaged-building photo (run it through `drawSketch` once `ANTHROPIC_API_KEY` is set; never hand-drawn); (5) triage screen (the confidence triage is not built yet, Later list).
    - LinkedIn URL confirmed by the owner: `linkedin.com/in/charbelmoutran`.
    - Old-report cleanup: already done by another session before this one ran it (0 reports, 2 assessments kept); the backup taken here is empty.
    - **EMT map renamed Volunteer map** (labels, page `/volunteer`, `/emt` redirects in `src/proxy.ts`). Internal name and API paths stay `emt`. `MAP_PATH` in `src/lib/maps.ts`.
    - Vercel Web Analytics added in `src/app/layout.tsx` (switch it on in the Vercel dashboard when deploying).
    - The original WhatsApp photo in the repo root is not committed (personal file); delete or keep outside the repo.

00. **Professional engineer report (item 27): live since 24 Nov (not pushed to GitHub).** Checked in a browser (laptop and phone) without saving: the form, Claude links hidden with no key, the saved view and the printed copy, using a browser-only fake report. Waiting on the owner's go, in this order:
    1. ~~Apply the migration~~ done 24 Nov. ~~Backup and cleanup~~ done 24 Nov.
    2. ~~Deploy~~ done 24 Nov; the live form was opened and filled without saving. **No real save yet:** the owner's first report will be `ZR-2026-0001`.
    - Not tested: a real save, photo upload, Claude's "Read photo" and "Draft remarks" (need the key), printing in Safari.
    - Owner choice: the tray, history and map key still say "Good condition / Needs some work / Imminent risk"; the report says "Satisfactory / Repair required / Unsafe". Align them (both maps share the words)?
0. **Map colours (item 26):** owner to look at it live. Not yet seen in the browser: an EMT red outline, an EMT outline over an engineer colour, a faded green (no such records exist yet).
1. **Next: the owner gives the Anthropic API key.** It goes in `.env.local` and Vercel as `ANTHROPIC_API_KEY` (never in code). Set a monthly spend limit in the Console. Then test with the owner's Stanford photos and tune Claude's instructions.
2. Then, in the order the owner chooses: map query, Cmd+K, sample data, README, full test.
3. UI pass stage 4 (final check) not started.
4. Owner choices: show "Record" alone in the top bar (the Arabic is too faint at 32px)? Make the footer tie a single sweep (the loop reads like a paperclip)? DESIGN.md 15.1 is out of date. Landing text still mentions residents.
5. Owner to do: connect Vercel to GitHub.
6. Commit or ignore the new `.agents/` skills folder and `skills-lock.json` change (installed 22 Nov), and the untracked `Lebanon_Building_Safety_Assessment_Form_Phone.pdf`.

## Known bugs and gaps

- No agent has tested the 17 Nov features or the second UI pass in a browser beyond Chrome. Not checked yet: Safari, Firefox, phones, the signed-in map with real data, and Arabic text.
- While login is frozen, anyone with the link can read every building and save reports (10 an hour per map, shared by everyone). Reports can be backdated.
- Canvas buildings cannot be selected by keyboard.
- A mouse wheel pans instead of zooming. Ctrl+wheel page zoom is blocked on the map.
- The EMT report shows "OEA no. DEMO-EMT" and the form's engineer wording; left as is (no feature changes).
- Not tested with Claude connected: photo reading, sketches, posting proposal, debrief writing. Everything else was checked in the browser on 22 Nov (phone and laptop) with Claude off, and the saved view with a browser-only fake record.
- Not tested for real: saving an EMT assessment (skipped so no fake assessment lands in the live record; the server's checks were tested).
- Uploaded photos of an assessment that is never saved stay in storage (harmless, small).
- Not tested in the browser: saving a report from either map (skipped so no fake report lands in the live record). Reading, the tray, the form and the stand-in signer were checked on 22 Nov.
- Deploys use a workaround until Vercel is linked to GitHub: `git archive HEAD` into a scratch folder, copy `.vercel/`, then `vercel deploy --prod --yes`.
