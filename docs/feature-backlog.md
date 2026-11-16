# Feature backlog — Zahle Building Registry

Pasted by the project owner on 16 Nov 2026 and **not scheduled**. Nothing here is built. Per `CLAUDE.md`, anything outside `plan.md` section 7 "In" waits on the Later list until the owner decides. This file keeps the owner's full text, plus what the orchestrator found when checking it against `plan.md` and `DESIGN.md`.

## What conflicts with the plan (the owner must decide)

1. **Residents.** Items 2, 3, 4 and 5 add residents: phone verification, inspection requests, a building log, and a resident map. `plan.md` section 3 says "engineers only", section 4 rule 2 says "only engineers see reports", and section 5 rejected a resident view because verifying residency is too hard. `DESIGN.md` removed the Resident role. Adding these changes the product direction, so it needs an explicit owner decision and a plan rewrite.
2. **AI features (6 to 9, 11).** They need the Anthropic Console, which the owner deferred on 16 Nov 2026. They also change the product into an AI triage tool, and a wrong "don't flag" on a safety issue is a real risk. The civil-engineer agent must write and the owner's OEA contact must review the protected list and the context file before any of it ships.
3. **Colour clash.** Item 7 colours flagged buildings "Claude orange" (#F07B2E) with a pulsing ring. The rating colour for the worst rating is already orange (#EE7A2F). Two meanings for one colour breaks "a colour never stands alone". It needs a different signal, such as an outline or an icon.
4. **No demo wording.** Item 1 asks for a visible "Demo location" label and item 2 for "Demo code" on screen. The owner's standing rule (16 Nov 2026) is no demo wording in the app unless they ask. These two need the owner's explicit yes.
5. **Real SMS (item 2).** Sending real texts through Twilio costs money and handles real phone numbers, which `plan.md` has not budgeted. Also open: which number, and whether any real person's number is stored.

## Which items fit the current plan

| # | Item | Fit |
|---|---|---|
| 1 | Find my building (location) | **Fits** `plan.md` section 3 step 1 (location suggests the building, the engineer confirms), if built for engineers only. The resident wording and "demo as a resident" do not fit. |
| 10 | Lebanon engineering context file | **Fits** the civil-engineer's job. Partly written already in `docs/engineering.md` Part B (laws, still marked "not verified"). |
| 12 | Enjoyable map navigation | **Mostly done**: smoother panning and zoom, spring tray, fly-to. Still open: the Ctrl+K / Cmd+K command bar. |
| 11 | Engineer map query | New. Needs the Anthropic key. |
| 6 to 9 | Claude sorts, flags, verdicts, rulebook | New. Need the key, the owner's decision on direction, and OEA review. |
| 2 to 5 | Residents | Conflict. See above. |

## Suggested order when work resumes (the owner decides)

- **A. Fits the plan, no new key needed:** 1 (engineers only), the Ctrl+K command bar from 12, and finishing 10.
- **B. After the Anthropic key and owner decisions:** AI document-to-form (already in plan section 7 item 5), then 11, then 6 to 9.
- **C. Only if the owner changes the product direction:** 2 to 5.

## The owner's text, unchanged

# Features to add — Zahle Building Registry
(Read plan.md and DESIGN.md for full details.)

## 1. Find my building (location)
- On open, ask for browser location. Use Turf.js to find the closest building + 2 next-closest.
- Show a tray: "Is this your building?" with the closest highlighted, 2 alternatives, and "None of these — pick on the map".
- Outside Zahle (> ~20 km): offer "Try the demo as a resident standing on [real Zahle street]", with a visible "Demo location" label.
- Location denied: go straight to "Pick your building on the map".
- Dev testing: Chrome DevTools → Sensors → custom location 33.846, 35.902.

## 2. Resident verification (SMS only)
- Supabase Auth phone OTP.
- While building: Supabase test phone numbers with a fixed code.
- Public demo: show "Demo code: ######" on screen instead of texting.
- Once: send one real SMS via Twilio to my US number, for the demo video.
- The verified number is attached to every inspection request. Engineers see "Verified ✓" + a contact button, not the raw number.

## 3. Request an inspection
- Verified residents send a request for their building: description + photos (Supabase Storage).
- Table `inspection_requests` (id, building_id, resident_id, description, status, created_at).
- Residents only see "Received — an engineer will review."

## 4. Resident building log
- Verified residents add observations over time: text, photos, "when did you notice it".
- Tables `observations` and `observation_photos`.

## 5. Residents see only their own building
- Resident map: own building(s) in full color; all others barely visible (no fill, not even gray).
- Engineer map: every building with status + Claude's flags.
- Enforce with Supabase row-level security, not just the UI.

## 6. Claude sorts submissions
- On each new observation or request, a server route calls Claude.
- Returns JSON `{ label: "urgent" | "normal" | "needs_person" | "unwise", reason }`.
- "Unwise" (personal attacks, others' private data, wrong building, spam) is held for a human — never deleted or hidden.
- Engineers can override any label in one tap.

## 7. Claude flags buildings (main feature)
- After each new observation, Claude re-reads the building's log.
- Input: context file + protected list + active rules + 3–5 similar past cases with verdicts.
- Returns JSON `{ flag, urgency, reason, rules_used, evidence }`. Protected-list signs ALWAYS flag.
- Flagged buildings turn Claude orange (#F07B2E) with a pulsing ring on the engineer map. Tap → tray with Claude's report.

## 8. Engineer verdicts
- In Claude's report: "Flag was right" / "Not needed" + optional note.
- Table `verdicts`. Show engineers Claude's running accuracy ("Flags confirmed: X%").

## 9. Claude's rulebook (learning + self-pruning)
- Tables `rules` (text, kind flag/dont_flag, status candidate/active/retired, times_used, times_agreed, evidence) and `rule_history`.
- Reflection job (Vercel Cron or every 5 verdicts): Claude proposes add / edit / merge / generalize / retire.
- Candidate → active after 3 agreeing verdicts.
- `flag` rules activate automatically; `dont_flag` rules need engineer approval.
- Protected list (cracking sounds, new or widening cracks, cracks after a tremor, sagging, doors/windows suddenly sticking, tilting) can never be learned away or pruned — enforced in code.
- Rulebook page for engineers: rules, scores, history, Approve/Reject.

## 10. Lebanon engineering context file
- `/claude/lebanon-engineering-context.md`: laws and codes, seismic setting, common construction, cosmetic vs structural defects, Arabic/French/English terms, how the OEA, municipalities and mukhtars work.
- Short (2–4 pages). Every fact sourced. Edited by hand only, never by the reflection job.

## 11. Engineer map query (OEA merged into engineers)
- Any engineer types a request in plain words.
- Claude converts it into a structured filter JSON (allowed fields only) — never raw SQL. The server validates and runs it.
- Results shown as a list tray and highlighted on the map, with a one-line reason per building.

## 12. Enjoyable map navigation
- Spring fly-to on tap, ⌘K / Ctrl+K command bar to jump to a street or building, gentle zoom, clear highlights, staggered lists.
- Follow DESIGN.md motion tokens; respect reduced motion.
