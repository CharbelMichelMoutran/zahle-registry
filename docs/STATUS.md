# Status — Zahle on Record

Last updated: 22 Nov 2026. Read this first, then `plan.md` (source of truth) and `DESIGN.md` (before UI work). Older detail is in git history.

## Where it stands

- **Live:** https://zahle-registry.vercel.app (behind sign-in). Production = commit `744e8ea`.
- **Repo:** https://github.com/CharbelMichelMoutran/zahle-registry. **Private until the owner says.**
- **Database:** 8 migrations applied (last `20261119000000_residents.sql`). Append-only triggers on.
- **Data:** 4 engineer accounts, 4 reports, 1 resident, 1 resident building, all from the owner's testing. Reports are permanent unless the owner approves a cleanup.

## What's built

- **Map:** Zahle buildings from OpenStreetMap, coloured by condition (worst = red `#D6402B`), toned grey map with hillshade, collapsible key. Trackpad pans, pinch zooms, + and − buttons.
- **Engineers:** sign up, sign in, building tray (status, year built, last date), history, full-screen report (rating is the only required field). Reports are add-only.
- **Go to building:** top-bar button; "Use current location" currently picks a random real Zahle building.
- **Residents:** front-end show only. Fixed phone and code (000000), no real check, one shared resident. Map shows "Your building" and a "Request inspection" button that does nothing yet.
- **Landing page:** public start screen with a pre-rendered map of Zahle.
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
| `src/app/` | Pages: welcome, login, signup, waiting, resident, API |
| `src/components/` | Map, trays, report, landing, top-bar menus |
| `src/components/map-navigation.ts` | Trackpad and zoom engine (uses private Leaflet methods) |
| `src/lib/location.ts` | `getCurrentLocation()`, the stand-in for real location |
| `src/lib/inspection-chat.ts` | Empty `openInspectionChat()`, the hook for the next feature |
| `supabase/migrations/` | Database schema |
| `scripts/` | Building import, hillshade, landing map, logo renders |

## Open tasks

1. **Next feature:** the Claude inspection chat behind "Request inspection". Needs the Anthropic Console and a spec from the owner.
2. Then, in the order the owner chooses: resident building log and requests, Claude sorting and flagging, rulebook, engineer map query, Cmd+K, sample data, README, full test.
3. UI pass stage 4 (final check) not started.
4. Owner choices: show "Record" alone in the top bar (the Arabic is too faint at 32px)? Make the footer tie a single sweep (the loop reads like a paperclip)? DESIGN.md 15.1 is out of date.
5. Owner to do: set up the Anthropic Console; connect Vercel to GitHub.
6. Commit or ignore the new `.agents/` skills folder and `skills-lock.json` change (installed 22 Nov).

## Known bugs and gaps

- No agent has tested the 17 Nov features or the second UI pass in a browser beyond Chrome. Not checked yet: Safari, Firefox, phones, the signed-in map with real data, and Arabic text.
- Anyone can approve themselves as an engineer. Reports can be backdated.
- Canvas buildings cannot be selected by keyboard.
- A mouse wheel pans instead of zooming. Ctrl+wheel page zoom is blocked on the map.
- Shared demo resident: the first visitor sets the building for everyone.
- The 000000 code is one locked field, not the six boxes that DESIGN.md describes.
- Deploys use a workaround until Vercel is linked to GitHub: `git archive HEAD` into a scratch folder, copy `.vercel/`, then `vercel deploy --prod --yes`.
