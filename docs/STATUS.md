# Status and handoff — Zahle Building Registry

Last updated: 17 Nov 2026, night (see "UI pass" below). Read this first, then `plan.md` (the source of truth) and `DESIGN.md`. `docs/REFERENCE.md` is the long reference; where it is older than this file, this file wins.

## Snapshot

- **Live site:** https://zahle-registry.vercel.app (everything behind login). Last production deploy is commit `67a87b6` (UI pass stages 0 to 3), confirmed Ready and aliased on 17 Nov 2026.
- **Repo:** https://github.com/CharbelMichelMoutran/zahle-registry. **Private. Keep it private until the owner says.**
- **Git:** `main`, everything committed and pushed.
- **Database:** all 8 migrations applied (last: `20261119000000_residents.sql`). Append-only triggers on reports and construction-date changes checked enabled after the 17 Nov migration.
- **Data now:** 4 engineer accounts, 4 reports, 1 resident, 1 resident building (from the owner's own testing on 17 Nov; the reports are permanent unless the owner approves a cleanup).
- **Agents running:** none.

## How the owner wants to work (17 Nov 2026)

- Replies in **concise Standard Technical English**.
- **Only the coder runs.** No devil's-advocate or browser tests unless the owner asks.
- The coder commits locally only; the orchestrator pushes, applies migrations and deploys **after the owner says so** ("push and deploy", "apply and deploy").
- **Start Claude Code inside `~/zahle-registry`.** Otherwise the project agents in `.claude/agents/` do not load; the workaround used on 17 Nov was a general-purpose Opus agent briefed with the contents of `coder.md`.

## Built on 17 Nov 2026 (live, built without browser tests; the owner tried the site and said it looks great)

| Feature | What it does |
|---|---|
| Red worst rating | "Imminent risk" is roof-tile red `#D6402B`. |
| Map navigation | Two-finger trackpad scroll pans smoothly and slowly and never zooms; pinch zooms around the cursor; + and − buttons (bottom-right desktop, top-right phone). Engine in `src/components/map-navigation.ts` uses private Leaflet methods (`_rawPanBy`, `_move`); a Leaflet upgrade could break it. Tuning constants at the top of that file. |
| Locate building (engineer) | Top-bar button, popover: "Type address" (disabled, no explanation) and "Use current location". All location logic in `getCurrentLocation()` (`src/lib/location.ts`), which for now returns a random real Zahle building. Map spring-flies to it and opens its tray. |
| Simpler full-screen report | Preview unchanged; maximize fills the whole map. One calm page: rating chips (only required field, any order), date (defaults to today), residents, built, four free-text areas with "Not inspected". No help text; one line "Used for triage after an earthquake." No minimum lengths (database relaxed by `20261118000100_report_freedom.sql`). |
| Arch removed | The arch grab handle on the preview tray is gone. |
| Resident login (front-end show) | Login asks Resident or Engineer. Resident: name, locked +1 555 010 0000, "Send code", locked 000000, "Log in". **No real phone check**: Log in creates a resident session in our own login system (`zr_resident` cookie, `resident_sessions` table). Everyone shares one resident. |
| Resident map | Real browser location prompt. Allow: `getCurrentLocation()` picks the resident's building (saved add-only in `resident_buildings`; an existing building is kept) and the map flies to it. Deny: map with Locate building, no building; "Use current location" shows "Location is off. Turn it on in your browser settings to find your building." Other buildings are faint outlines, not clickable. Tray: "Your building", status chip or "Not yet inspected", **"Request inspection"**, which calls the empty `openInspectionChat()` in `src/lib/inspection-chat.ts`. |

Resident privacy is enforced by our server (scoped to the session's resident) with database RLS on and no browser access, not by RLS policies per user. Real phone verification is on the Later list.

## Later session, 17 Nov 2026 evening (no app code changed)

- **Pivot: the owner wants to work on UI next, not features.** Ask which screen first.
- **Design skills installed** in `.claude/skills/` (git-ignored, 42 MB; sources pinned in `skills-lock.json`; reinstall with `npx skills add <source> -a claude-code`): Benji Taylor `stageshow` (faux product UI for README/demo video), Emil Kowalski's set (`apple-design`, `emil-design-eng`, `animate`, `gestures`, `mobile-native`, `break-ui`, `review-animations`, `learn-taste`, and more), Leon Lin `design-taste-frontend` (aimed at public websites; use selectively). Scanned for risky commands: none found. **Impeccable** is not installed yet: the owner runs `/plugin marketplace add pbakaus/impeccable` then `/plugin install impeccable`. To do: add the skills to `DESIGN.md` section 9 (DESIGN.md wins on conflicts) and name the right skill in each UI brief. `learn-taste` writes to `DESIGN.md`: review its edits before committing.
- **AI direction, open decision (devil's-advocate review given to the owner):** the owner proposed that Claude interviews residents, picks a rating colour shown with a Claude-orange outline, and engineers query Claude for triage. The orchestrator recommended that Claude rates **visit urgency** (Urgent / Soon / Routine, orange ring), **never the condition colour**; intake is photo-first with 4 to 6 questions; engineers get a ranked queue (urgency x residents) with Claude's summary and evidence; learning is measured by a fixed test set, protected list in code, rulebook with engineer approval; ask the OEA contact whether they would use the ranked list. **The owner has not decided.** `plan.md` is unchanged on this.
- **Teaching Claude engineering, proposed:** context file, fixed output schema, protected list in code, similar past cases, rulebook later, and a 30 to 50 case test set (civil-engineer drafts, OEA contact checks). Not started; waits for the owner.

## UI pass, 17 Nov 2026 night (plan item 23; pushed and deployed at the owner's request)

Owner decisions: no engineer side panel (Later list), no mockups, review the real app per stage. Picks: accent `#1E5A8C`, OSM toned grey plus a pre-rendered Zahle hillshade, Markazi Text 500 for Arabic display, a small collapsible map key (engineer map only). See `DESIGN.md` sections 13 and 14.

| Stage | State |
|---|---|
| 0 Reference study | Done: `DESIGN.md` section 14 |
| 1 Map look | Done: new blue, red stands out (dark edge, top layer, dot below z16), selected outline and dimming, terrain, map key |
| 2 Landing page | Done: public `/` for signed-out visitors (served from `/welcome` by `src/proxy.ts`), static map image from public OSM (`npm run render:landing`), no data or API calls |
| 3 Fonts and polish | Done: Markazi Text for زحلة, tray order (status, built, date, one line), report and sign-in polish |
| 4 Final check (`break-ui`, `emil-design-eng`) | Not started |

Not seen in a browser by any agent: the real signed-in map, tray and save with real data (no logins were made). Owner to confirm: 56px landing headline; river and roads on the hero map. Later list candidate: a building name or number field.

## Next

1. **The owner's next feature:** the Claude inspection chat behind "Request inspection" (`openInspectionChat()`). It needs the **Anthropic Console** (sign up, $50 credit, $50 hard limit, API key into Vercel and `.env.local`). Ask the owner for the spec first.
2. Then, in the plan's order: the resident building log and requests (items 13, 14), Claude sorting and flagging (16 to 18), the rulebook (19), engineer map query (21), Cmd+K command bar (22), sample data, README, full test (h). The owner decides the order.

## Waiting on the owner

1. Anthropic Console setup (for the chat and every AI feature).
2. Connect Vercel to GitHub (vercel.com/account → Connections → GitHub). Until then deploys use the workaround: `git archive HEAD` into a scratchpad folder, copy `.vercel/`, `vercel deploy --prod --yes`.
3. Send questions 1 to 15 at the end of `docs/engineering.md` to the OEA contact.
4. Optional: rename the Supabase project to `zahle-registry` (dashboard only). Delete the unused `SUPABASE_PUBLISHABLE_KEY` line from `.env.local`.
5. Optional: a cleanup of the 17 Nov test reports and accounts before real use (needs the append-only triggers switched off and on in one transaction, owner approval required).

## Known gaps and risks

- **Nothing built on 17 Nov was tested by an agent in a browser.** A devil's-advocate pass is owed when the owner allows it: trackpad pan and pinch in Chrome, Safari and Firefox; mouse wheel; zoom buttons on phones; the full-screen report on a 375px phone; resident cannot reach engineer data; Arabic text.
- Plan rule 1: the resident tray shows the rating word and arches without remarks (owner accepted).
- Shared demo resident: the first visitor who allows location picks the building for everyone; the name shown is the last one typed.
- If a resident denies location, no building is shown even if one is saved (owner accepted).
- The 000000 code is one locked field, not six boxes as `DESIGN.md` describes.
- A plain mouse wheel pans instead of zooming; ctrl+wheel page zoom is blocked on the map screen.
- Earlier known items still stand: anyone can self-approve as an engineer; reports can be backdated; canvas buildings are not keyboard-selectable; filtered OSM tiles.

## How to resume

1. `cd ~/zahle-registry`, start Claude Code there.
2. Read this file, `plan.md`, `DESIGN.md`. Check `git status`, `git log --oneline | head`, and `supabase migration list --remote`.
3. Ask the owner for the next feature's spec and whether the Anthropic Console is ready.
