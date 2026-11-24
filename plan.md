# Zahle Building Registry — Project Plan

This file is the shared plan for the project. Read it before starting any task. If a task conflicts with this plan, stop and ask the project owner.

> **Golden rule (owner, 22 Nov 2026): the app must never frustrate the person using it.** This overrides every other rule. No reasons demanded for overriding Claude, no nagging, and disagreeing with Claude is never punished.

---

## 1. Problem

Building records in Lebanon are either kept on paper that no one can reach, or were never made. So the Order of Engineers and Architects (OEA) and municipalities end up inspecting buildings from scratch, again and again.

A senior OEA engineer confirmed to the project owner that records are missing, that inspections get repeated, and that a tool like this would be useful.

The registry is not a disaster tool. It is a lasting record of every building, made by engineers and used by EMTs (section 3). It becomes most valuable after a disaster, such as the 2023 earthquakes, when unstable buildings must be found and reinspected quickly.

### Supporting context (collected by the project owner, not yet independently verified)

- The OEA has repeatedly warned that thousands of buildings lack structural assessments, technical audit reports, and safety surveys. ([NOW Lebanon](https://nowlebanon.com/lebanons-building-crisis-over-16000-structures-at-risk-of-collapse/), [Majalla](https://en.majalla.com/node/313096/business-economy/lebanon-building-collapses-are-latest-manifestation-state-collapse), [LBCI](https://www.lbcgroup.tv/news/news-bulletin-reports/904634/tripolis-unsafe-buildings-risk-survey-shows-major-blind-spots/en))
- **No complete national survey.** Existing risk lists rely mostly on quick visual checks, not detailed engineering diagnostics. ([L'Orient Today](https://today.lorientlejour.com/article/1368769/thousands-in-northern-lebanon-living-in-unsafe-housing-amnesty-international-warns.html))
- **Blind spots in risk lists.** After deadly collapses in Tripoli in early 2026, municipal reviews found that some collapsed buildings were not on high-risk lists, because there was no money for detailed inspections. ([LBCI](https://www.lbcgroup.tv/news/news-bulletin-reports/904634/tripolis-unsafe-buildings-risk-survey-shows-major-blind-spots/en))
- **Laws exist but are not enforced.** Law No. 646/2004 and Decrees 14293 and 7964 require technical audits for solidity, seismic protection, and fire safety. Engineers report widespread non-compliance, illegal extra floors, and missing safety certificates. ([OEA](https://oea.org.lb/), [NOW Lebanon](https://nowlebanon.com/lebanons-building-crisis-over-16000-structures-at-risk-of-collapse/))
- **Added stress on buildings.** Economic crisis, deferred maintenance, seismic activity, water damage, and war damage have weakened buildings that never had baseline reports. ([Akhbar Al Yawm](https://en.akhbaralyawm.com/news/191056/Demolish-or-Repair:-Lebanon-Confronts-Its-Unsafe-Building-Dilemma))
- **Scale.** Estimates put roughly 16,000 to 18,000 buildings across Lebanon at risk of collapse, including thousands in Beirut and Tripoli. ([Public Works Studio](https://publicworksstudio.com/en/buildings-collapse-in-lebanon/))
- **OEA demands.** OEA leadership has called for structural engineers on official assessment panels, stricter enforcement of building codes, and state-backed inspections to sort buildings for reinforcement.

**What this means for the product:** inspections do happen, but their results do not build into a lasting, trusted record. The registry fixes that gap. It does not fix the lack of money for inspections.

---

## 2. Goal

Build a public, working **portfolio demo** for Zahle in **3 weeks (about 30 hours, more if needed)**.

**Audience:** recruiters and master's admissions. They care about polish, a working live link, and a clear story.

**Aim:** build the closest thing to what the OEA would be willing to use. Whether they adopt it is a policy problem and out of scope (see section 6).

**Scope note (16 Nov 2026):** the owner added 12 features (section 7, items 11 to 22): location, an AI that sorts and flags, and more. The owner chose the larger scope, so the 30-hour estimate no longer holds. The build order in section 7 keeps the demo working at every step.

**Success:**
1. A person with the link can run the full flow in under 5 minutes, on the Engineer map or the EMT map, without help.
2. The GitHub repo (github.com/CharbelMichelMoutran) presents the project well: a README with screenshots or a short GIF, the live link at the top, the problem in a few lines, the design principles, and the tech stack. Clean commit history. The repo is pinned on the profile.

---

## 3. Chosen approach

A tool for **engineers and EMTs** (owner decision, 22 Nov 2026, replacing "engineers and residents"; residents are removed). One website with a map of Zahle's buildings. The opening page offers two maps:

- **Engineer map** (`/engineer`), for civil engineers, structural engineers and architects. The Order of Engineers and Architects role is **merged into this one**.
- **EMT map** (`/emt`), for emergency medical teams (Red Cross). It started as a copy of the engineer map and has its own code, so the two can grow apart.
- Both maps read and save through the same database, so a report saved on one shows on the other after a reload. Live updates without reload are on the Later list.
- **Login is frozen** (owner, 22 Nov 2026): both maps are open to anyone with the link, and every report is signed by that map's stand-in account ("Demo Engineer" or "Demo EMT"). The login, sign-up and waiting code stays, switched off by `LOGIN_FROZEN` in `src/lib/maps.ts`.

**The engineer:**

1. **Picks a building.** When the site opens, it uses the engineer's location to suggest the building they are standing at, and the engineer confirms with one tap (phone location is rough indoors, often 20–50 m off). Or the engineer types an address or street, or clicks a building on the map.
2. **Sees the building's record:** its facts, every past inspection and every scanned document. This is the payoff of the whole product: the next engineer does not start from scratch.
3. **Adds an inspection** with a condition colour (section 4b) and remarks. (Photos come with the fuller report.)
4. **Can upload a photo of an old paper document.** The AI fills in the building facts it can read, and the engineer checks and corrects them before saving.
5. **Sees which buildings Claude flagged** and why, can agree or disagree with each flag, and can ask the map questions in plain words.

**The EMT** has the same features as the engineer for now (owner, 22 Nov 2026: no feature changes yet).

**Claude (the AI)** sorts every new submission (urgent, normal, needs a person, unwise), flags buildings that need an engineer, and learns from the engineers' verdicts through a rulebook that engineers can see and approve. Section 7, items 16 to 19.

**Voluntary use is a goal.** Engineers should want to use the registry because it saves them time (e.g. the paper-to-form feature), not only because someone forces them.

### Stack

| Part | Choice |
|---|---|
| Frontend | Next.js + React |
| Map | Leaflet + OpenStreetMap building outlines |
| Database and photo storage | Supabase |
| Hosting (public link) | Vercel |
| Claude API | Document reading, sorting, flagging, the rulebook, and map queries (budget: up to $50, hard limit set in the Anthropic Console) |
| Nearest building | Turf.js |
| Scheduled jobs | Vercel Cron (the rulebook reflection job) |

The project owner writes **no code**. Agents write all the code, and Claude handles setup (repo, Supabase, Vercel, keys) through the command line. The project owner directs, decides, and reviews.

---

## 4. Design principle: a help tool, not a police tool

Engineers must be **happy to use** the product. It must not start an "arms race" where owners hide problems or pressure engineers.

### Risks if this is done badly

- **Property value loss.** Owners avoid inspections or pressure engineers for better ratings.
- **Exposure.** Illegal extra floors become visible, so owners fight the system.
- **Engineer safety.** An engineer's signature on a bad rating can make them a target.

Hiding dangerous buildings is **not** the answer. Silence is what lets them collapse. The answer is design.

### Rules

1. **A colour never stands alone.** Every inspection shows its word and the engineer's remarks next to its colour. If the engineer wrote no remarks, the report says "No remarks". (Owner, 17 Nov 2026: remarks are optional.)
2. **Nothing is public.** Signed out, nothing about any building is reachable. Engineers and EMTs see every building and report. The database is read only through our server, never from the browser. **Suspended while login is frozen (owner, 22 Nov 2026):** both maps are open to anyone with the link.
3. **Mark unknowns as "Not yet verified,"** never as findings.
4. **The record is separate from enforcement.** The registry records facts. Fines and evacuations stay with the authorities. The app is not the punisher.
5. **Never overwrite the record.** A new inspection is added to the history; old inspections stay as they were. Changes to building facts keep the previous value and who changed it.
6. **The AI never hides or deletes anything.** A submission Claude labels "unwise" (personal attacks, someone else's private data, the wrong building, spam) is **held for a human**, never deleted and never hidden from the engineers. An engineer can override any label in one tap.
7. **Some warning signs always flag.** The protected list (cracking sounds, new or widening cracks, cracks after a tremor, sagging, doors or windows suddenly sticking, tilting) can never be learned away or pruned by the rulebook. This is enforced in code, not only in the AI's instructions.

### 4b. Condition colours

The engineer picks one colour per report:

| Colour | Meaning |
|---|---|
| Green | Good condition |
| Yellow | Needs some work |
| Red | Imminent risk |

The form must make clear to the engineer that **after an earthquake these colours are used for triage, so choose carefully.** (Owner, 17 Nov 2026: one short line by the rating, no longer text.)

**On screen the worst rating is red** (owner, 16 Nov 2026, reversing the earlier "no red" decision), so engineers read the colours the way they already know them. Orange is kept free for Claude's flags (section 7, item 17).

After earthquakes, engineers already use a standard green / yellow / red tagging, where yellow means "limited entry." The wording is aligned with that standard, so engineers read the colours the way they already know them.

### 4c. What is stored

| Part | What it holds | Changes how |
|---|---|---|
| **Building** | Outline and location (copied once from OpenStreetMap), year built, number of floors, structure type, seismic measures (yes / no / unknown), number of units | Facts are edited, but every earlier value is kept with who changed it and when |
| **Inspection** | Date, engineer, condition colour, engineer's remarks, photos | Added only, never edited or deleted |
| **Document** | Scanned image of an old paper record, the facts the AI read from it, the date added | Added only |
| **Claude label and flag** | The label for each submission, and Claude's flag, urgency, reason, rules used and evidence for each building | Added only. An engineer's override or verdict is a new row |
| **Engineer verdict** | "Flag was right" or "Not needed", an optional note, who, when. Table `verdicts` | Added only |
| **Rule** | Rulebook rules (text, kind flag or don't-flag, status candidate, active or retired, times used, times agreed, evidence) and their history. Tables `rules`, `rule_history` | Edited by the reflection job within the limits in item 19; every change is kept in the history |

The building outlines are copied into our own database once, not loaded live from OpenStreetMap, because OpenStreetMap's building IDs change when people edit the map. That would cut records off from their buildings.

### 4d. Trust model (first version)

- **Engineers are trusted.** A report uploaded by an engineer is assumed to be honest.
- Engineer accounts are simulated (section 7, item 10). In a real version, engineers are easy to verify because each is a registered OEA member.
- **Claude's output is advice for engineers, not a finding.** A flag is a prompt to look, shown with its reason and evidence, and an engineer's verdict is the record.

---

## 5. Options rejected

| Option | Why rejected |
|---|---|
| Order role (assigning reviews) | Not needed for the core flow. Engineers pick buildings themselves. **The owner merged the Order into the engineer role (16 Nov 2026).** |
| Paper-to-digital as a separate product | Kept, but as one feature inside the platform. |
| Google Maps | No clickable building outlines. |
| Public map showing inspection status | Even "not yet inspected" can read as "suspect," especially after a quake. |

---

## 6. Riskiest assumption (out of scope for this project)

The system only works in real life if engineers use it. Ideally they use it because it saves them time. Where that is not enough, someone with authority would have to require it: the OEA could make it a membership requirement, or municipalities could refuse permits without it.

The project owner chose to leave adoption out of this project. **Later test:** one conversation with whoever in the OEA or a municipality decides what engineers must submit, through the project owner's senior engineer contact.

---

## 7. First version scope

### In (in build order)

1. Map of Zahle with clickable buildings (OpenStreetMap coverage confirmed good), outlines copied into the database
2. Pick a building: location suggests it and the engineer confirms, or typed address, or a click (no real accounts; the engineer picks a demo name)
3. Building record: facts, inspection history, and documents (section 4c)
4. Building window and report form, clearly marked "draft template". **Decided by the project owner (16 Nov 2026), replacing the earlier facts-and-inspection split for the demo:**
   - **Clicking a building opens a window with two actions:** "Building history" and "Create report".
   - **Building history** lists past reports: report date (day, month, year), engineer's name, and the building's colour from that report. Opening a past report shows it in the same format as the form below, read-only.
   - **Colour** = how the building is rated for natural disasters (green / yellow / red, section 4b). It is a **required field at the end of the form**, picked after the four observations. In the history list, each colour is shown with the first line of that report's final observation beside it (rule 1: a colour never stands alone).
   - **Create report** fields: engineer info (name and contact); **date of report (day, month, year)**; number of people currently living in the building; building construction date (autofilled from the previous report, editable; an edit keeps the earlier value and **asks for a short reason**, section 4); engineer's observations on the roof, the columns, the foundations, and a final observation. **Each observation area has a "Not inspected" tick box** (with a reason) for parts the engineer could not see. Limits (report year from 1990, construction date from 1800, observations at least 10 characters) are accepted for the demo and unverified. No "visual check only" line near the colour; no inspection-type field in the demo.
   - **Window behaviour (owner, 16 Nov 2026):** clicking a building opens a small **preview** (latest report summary: date, colour word, first line of final observation, or "Not yet inspected"). A **maximize** button expands it to a full view with two tabs, **History** and **Create report**; **minimize** returns to the preview.
   - **Map colour:** a building with no report is **grey** (not yet inspected). After a report is submitted, the building takes the colour of its **latest** report. The colour always appears with its word and remarks in the panel (rule 1), never as colour alone.
   - **Map navigation:** smooth panning and comfortable zoom, without being imprecise or shifty.
   - **Report redesign (owner, 17 Nov 2026), overriding the points above where they differ.** First rule: **the report gives the engineer maximum freedom.** The app never tells the engineer what to write and never forces an order. (1) The preview stays as it is; **maximize fills the whole map** (full screen). (2) **Only the rating is required to save.** The date defaults to today. Residents, construction date, all four observations, "Not inspected" reasons and the construction-date change reason are optional, with no minimum length. The rating can be chosen at any time, in any order. (3) **One calm page:** short labels, no help text, examples, "look at" lists or prompts; only one line by the rating, "Used for triage after an earthquake." Rating as three big chips near the top. One "Save report" button. Every existing feature stays (locked author, autofilled construction date that keeps the old value, "Not inspected" per area, add-only). The "draft template" banner is removed. Like an iPhone: few buttons, little text.
   - Floors, structure type, seismic measures, and units are **not** in the demo report. Photos are not in the demo report. Both go on the Later list.
5. AI document-to-form: one uploaded image, AI fills the building facts, engineer confirms. **Built right after the form, not last.** It is what sets the project apart and the main reason engineers would want to use it. Tested on the real document in week 1 (a quick check, no UI).
6. Sample data with history: several buildings with past inspections and scanned documents, so the demo shows the record paying off
7. Arabic text displays and types correctly, right to left, in reports, names, and AI output. The UI stays in English.
8. Public link, polished GitHub README (section 2)
9. The design rules in section 4
10. **Engineer verification (simulated), decided by the project owner 16 Nov 2026.** An engineer creates an account. The demo then says "Waiting for OEA approval. Refresh." When the engineer refreshes, the demo approves the account automatically. This stands in for the real OEA check, which is out of scope. The engineer's account details (name and contact) are filled into every report they write, **immediately and locked (not editable)**. Decisions: **no email** anywhere (sign-up uses a username and password, plus name, contact and a demo OEA membership number; exact fields from the civil-engineer, to be confirmed); the old "pick a demo name" step goes away; **everything is behind login**, so nothing about any building is visible before sign-in (rule 2). **No "demo" notices or wording anywhere in the app (owner, 16 Nov 2026): everybody knows it is a demo. Do not add "This is a demo" text unless the owner asks for it.** **Further decisions (owner, 16 Nov 2026):** the OEA membership number **is stored** (for accountability) and **shown on reports**; no "check your name" step; no login attempt limit; no "Try the demo" button, because the demo should feel like the real thing; after the engineer refreshes, the account is approved and they **go straight into the map**; **all signed-in engineers can see each other's data, including contact details**, so a new engineer can call the previous one. Any test data typed in is cleared before the registry is put to real use. **Discipline:** at sign-up the engineer states what they are (civil engineer, structural engineer, or architect). We trust them for now. It is stored, locked, and shown on reports with their name. Made-up details being typed in is accepted and not a concern.

**Items 11 to 22 were added by the project owner on 16 Nov 2026.** The full original text is in `docs/feature-backlog.md`. Where a feature conflicted with the plan, the owner chose the feature and the plan was changed (listed after item 22). **Items 16 to 19 and 21 need the Anthropic Console and key (section 8).**

11. **Find my building (location).** On open, ask for browser location. Use Turf.js to find the closest building and the 2 next-closest. Show a tray, "Is this your building?", with the closest highlighted, the 2 alternatives, and "None of these — pick on the map". Outside Zahle (more than about 20 km): offer a real Zahle street, with a visible "Demo location" label. Location denied: go straight to "Pick your building on the map". For testing, Chrome DevTools Sensors with 33.846, 35.902. Works on both maps.
    **Engineer version first (owner, 17 Nov 2026), replacing the above for engineers for now:** a "Locate building" button in the top bar opens a popover with "Type address" (disabled, no explanation) and "Use current location". All location logic sits in one function, `getCurrentLocation()`. For now it returns a random real Zahle building on each call, with no UI wording saying so and no "Demo location" label. The map spring-flies to the building, selects it and opens its tray at once, with no "Is this your building?" step. Real GPS (Turf.js nearest) and address search replace the function body later.
16. *(Moved to the Later list, 22 Nov 2026: the AI direction is now item 25.)* **Claude sorts submissions.** (Its input was resident submissions, removed on 22 Nov 2026; to be redefined before it is built.) On each new submission, a server route calls Claude. It returns `{ label: "urgent" | "normal" | "needs_person" | "unwise", reason }`. "Unwise" items are held for a human, never deleted or hidden (rule 6). Engineers can override any label in one tap.
17. *(Moved to the Later list, 22 Nov 2026.)* **Claude flags buildings (the main feature).** After each new report, Claude re-reads the building's history. Input: the context file (item 20), the protected list, the active rules, and 3 to 5 similar past cases with verdicts. It returns `{ flag, urgency, reason, rules_used, evidence }`. Protected-list signs always flag (rule 7). Flagged buildings turn Claude orange (#F07B2E) with a pulsing ring on the engineer map. Tapping one opens a tray with Claude's report.
18. *(Moved to the Later list, 22 Nov 2026.)* **Engineer verdicts.** In Claude's report: "Flag was right" or "Not needed", plus an optional note. Table `verdicts`. Engineers see Claude's running accuracy ("Flags confirmed: X%").
19. *(Moved to the Later list, 22 Nov 2026.)* **Claude's rulebook (learning and self-pruning).** Tables `rules` and `rule_history`. A reflection job (Vercel Cron, or every 5 verdicts) lets Claude propose to add, edit, merge, generalize or retire rules. A candidate becomes active after 3 agreeing verdicts. "Flag" rules activate automatically; "don't flag" rules need an engineer's approval. The protected list can never be learned away or pruned, enforced in code. A rulebook page for engineers shows rules, scores, history, and Approve and Reject.
20. **Lebanon engineering context file.** `claude/lebanon-engineering-context.md`: laws and codes, the seismic setting, common construction, cosmetic versus structural defects, Arabic, French and English terms, and how the OEA, municipalities and mukhtars work. Short (2 to 4 pages), every fact sourced, edited by hand only and never by the reflection job. The civil-engineer drafts it, and the owner's OEA contact reviews it.
21. **Engineer map query.** Any engineer types a request in plain words. Claude turns it into a structured filter (allowed fields only), never raw SQL. The server validates and runs it. Results show as a list tray and highlighted on the map, with a one-line reason per building.
22. **Enjoyable map navigation.** Spring fly-to on tap, a Cmd+K or Ctrl+K command bar to jump to a street or building, gentle zoom, clear highlights, staggered lists. Follows the motion tokens in `DESIGN.md` and respects reduced motion. (Smoother panning and zoom, springs and fly-to are built; the command bar is not.) **Owner decision, 17 Nov 2026:** two-finger trackpad scroll pans the map horizontally and vertically, smoothly and slowly, and never zooms. Zoom is by trackpad pinch or the + and − buttons. Built in commits `29c4234` and `903e552`; not yet tested in a browser.

23. **UI pass and public landing page (owner, 17 Nov 2026).** Evolve the current design, not a new identity. Laptop first; phone must still work. Screens in scope: a new public landing page, the engineer map, the building tray and report, and login, sign-up and waiting. A **public landing page** comes before login: a calm, serious story (serif headline, one line on the problem), a map-visual hero of Zahle (terrain and footprints, **no real ratings or building data**, so rule 2 holds), no photographs, then a way in. **Red buildings stand out** more than the rest. Coder only, no devil's-advocate browser test for this pass. Details are in `DESIGN.md` section 13.
    **Owner, 17 Nov 2026 (later), replacing the above where they differ:** (1) **No engineer side panel** (status summary, recent activity, legend): moved to the Later list. (2) **No mockups.** The references are studied first, then the coder changes the real product in stages; the owner reviews each stage on the real app. Nothing is pushed or deployed until the owner says so. Stages: 0 study the references; 1 map look (terrain, river blue, red stands out); 2 landing page; 3 fonts and polish on the other screens; 4 final check with `break-ui` and `emil-design-eng`.
    **Owner, 17 Nov 2026 (second UI pass):** the product is renamed **Zahle on Record**; new ground colour, fonts, buttons, logo, landing copy, one sign-in button, a river-blue ribbon and a footer easter egg. Details in `DESIGN.md` section 15.

**What changed in this plan to make room for items 11 to 22 (owner's call, 16 Nov 2026):**
- Section 3: the Order role is merged into engineers. Rules 6 and 7 are new.
- The worst rating is **red on screen** (the earlier "no red" decision is reversed). This also frees orange for Claude's flags. See `DESIGN.md`.
- The "Demo location" label (item 11) is allowed because the owner asked for it. It is the only exception to "no demo wording".
- The Anthropic Console is no longer deferred (section 8).

24. **Engineer and EMT maps (owner, 22 Nov 2026).** Residents are removed: their screens, sign-in, server routes and database tables. The landing page's sign-in button becomes two buttons, "Engineer" and "EMT". Each map has its own page and its own copy of the map screen, building tray, report form and view, map key, "Go to building" menu and top bar (`src/components/engineer/` and `src/components/emt/`). Shared: the database, the building and report server code, the trackpad and zoom engine, the logo and the basic buttons. Login is frozen (section 3). The top bar shows the map's name ("Engineer" or "EMT · Red Cross", plain text, no emblem) and "Switch map". Same features on both maps. The landing page text is unchanged for now.

25. **EMT safety assessment and Claude debrief (owner, 22 Nov 2026). This is now the AI direction.** On the EMT map, "Start assessment" runs an ATC-20 style earthquake safety check on a phone, so a less-trained EMT can do what an ATC-20 engineer does. Form: the ATC-20 Detailed Evaluation core (overall, structural, non-structural and ground items, each rated Minor/none, Moderate, Severe or Not seen, each level with a one-line explanation; posting Inspected / Restricted use / Unsafe; damage estimate), plus from the owner's form (`Lebanon_Building_Safety_Assessment_Form_Phone.pdf`): scene safety first, Lebanese location fields, construction types, occupancy and features lists, and the Actions page. No blast items, no focus on the cause. Steps: Start, Scene safety, Outside (photos), Building, Go inside?, Inside (photos), Posting, Actions, Save.
    - **Claude** (Sonnet 5.5, one line to switch to Opus) asks for one photo at a time, rates the items the photo clearly shows with a one-line reason, fills building facts, draws a simple line sketch from each photo (only what the photo shows), and proposes the posting, actions and damage estimate. The EMT changes anything with one tap and is never asked why. An EMT answer is never overwritten by Claude. The record keeps Claude's answer next to the EMT's, and "EMT overrode Claude" is ticked automatically.
    - **Stops:** any Yes on scene safety or the inside gas/sparking check, or "Do not enter", stops the assessment with "Order evacuation immediately. Do not enter." and the emergency numbers. It is saved as Unsafe. "I tapped the wrong answer" goes back.
    - Location and the building's facts from its last visit are filled in at Start; a later visit is marked "Re-inspection". Claude tells the EMT what to ask residents (units, people inside).
    - Photos are shrunk on the phone and kept in private Supabase storage. The draft stays on the phone until one save at the end; it is then a permanent record (rule 5). Offline mode is on the Later list.
    - **Both maps** show EMT assessments in the history and tray, colour the building (Inspected green, Restricted yellow, Unsafe red), and label it "EMT posting, not yet reviewed by an engineer". The engineer report form is unchanged.
    - **Claude's debrief:** 2 to 4 lines at the top of a building's tray and history on both maps (state, main damage, what changed, next step), covering engineer reports and EMT assessments. Stored, and rewritten only when the record grows.
    - Without the Anthropic key, every Claude step falls back to manual entry. Cost guard: 150 Claude calls per visitor per hour, plus the Console spend limit.
26. **Map colours: EMT outline, engineer fill, green fades (owner, 23 Nov 2026).** Overrides "colour the building" in item 25 and "Map colour" in item 4.
    - An **engineer report** colours the whole building. An **EMT posting** colours only its **outline**; the fill stays as the last engineer report left it (or the "Not yet inspected" hatch). The newest record decides: a newer engineer report takes the whole building again and the EMT outline goes.
    - An EMT red is a thick red outline drawn on top: no fill, no dot. **No red building has a white dot any more** (engineer red too).
    - **Green fades to dark grey 6 months** after its day (report date for an engineer report, save day for an EMT posting, Beirut time), for both the fill and the outline, so nobody reads a building as safe forever. Yellow and red never fade. The record itself is unchanged: the tray and history still show the original report.
    - Map key: Green, Yellow, Red, "Outline: EMT posting", dark grey "Inspected more than 6 months ago", "Not yet inspected".
27. **Professional engineer report (owner, 23 Nov 2026).** **Engineer map only**: the EMT map keeps its assessment and today's simple report, an exception to "same features on both maps". Replaces the engineer form and view of item 4 where they differ. Aim: a report engineers are glad to leave for whoever comes after, and that impresses in a demo. Inspired by ASCE 11 (part-by-part condition), Eurocode 8 Part 3 (knowledge level), ATC-20 and the Lebanon form (`Lebanon_Building_Safety_Assessment_Form_Phone.pdf`). **The UI stays simple and pleasant to use; a professional, engineering tone, not playful.** The detailed look waits for a dedicated UI session.
    - **One page, numbered sections:** (1) **Identification**: report number `ZR-<year>-<0001>` (one sequence per year), date, GPS from the building, building name, street, landmark, cadastral plot number, optional "front of building" cover photo. **No owner details.** (2) **Building description**: construction year, floors, basements, floors added on the roof, units, residents, structure type (the Lebanon form's 7 local types), use, features. Filled in from the last report; a change keeps the old value. (3) **Inspection method**: Visual only, Visual and drawings, On-site tests. (4) **Condition of structural elements**: a table of 7 parts (foundations, columns, beams and slabs, walls, stairs, roof incl. tanks and solar, facade and balconies incl. parapets), each Minor/none, Moderate, Severe or Not seen (the EMT scale), with an optional note and up to 4 photos. "Not seen" replaces the "Not inspected" tick box; its reason goes in the note. (5) **Observations and remarks**. (6) **Overall classification**: Satisfactory (green), Repair required (yellow), Unsafe (red), with "Used for triage after an earthquake", plus estimated damage (None, 0–1%, 1–10%, 10–30%, 30–60%, 60–100%, 100%). (7) **Recommended actions**: any of No action, Monitor, Repair, Detailed investigation, Restrict use, Evacuate; optional "Inspect again by" date and note. (8) **Certification**: name, discipline, OEA number, contact, save time.
    - **Only the overall classification is required.** Everything else is optional, any order. Colours unchanged; the map key keeps its words until the item 26 work is done, then the two are aligned.
    - **Claude, once the API key is set** (hidden without it): a quiet "Read photo" link on each photo suggests that part's rating and a note; "Draft remarks" drafts the remarks and suggests recommended actions. Suggestions are greyed with "Use"; nothing fills in by itself; ignoring costs nothing.
    - **Saved report:** the same sections read-only, and "Print / Save as PDF" (browser print) for a clean paper copy with the cover photo, the parts table, photos and a blank stamp and signature space.
    - **Old reports are deleted, once (owner's exception to rule 5, 23 Nov 2026):** every simple report on both maps, the construction-date change history and the Claude debriefs (they rewrite themselves). EMT assessments are kept. A private backup file is saved on the owner's laptop first (never in git). Runs only on the owner's "go", when the new report is ready.

28. **Portfolio landing page (owner, 23 Nov 2026).** Replaces the landing page at `/`. A case study in STAR order for recruiters: hero; Situation (Lebanon's buildings at risk, the 2026 Tripoli collapses, sourced numbers only); Task (why Zahle: the owner's hometown, one line on work with the Zahle municipality and the Red Cross Zahle Center; what engineers told us, quoted only as "engineers we talked to"); Action (ATC-20 explained simply and why it saves lives; how we adapted it; the OEA once looked at Red Cross volunteers doing first safety checks and found the technology not ready; the two maps; Claude given the most space: photo reading, the sketch, confidence triage); Result (real product clips, numbers, the Lebanese Red Cross as a possible owner); How it's built; Author (photo with his mother, no caption; name; Stanford CS; born and raised in Rassieh, Zahle; "passionate about using CS for world impact"; LinkedIn charbelmoutran, GitHub, `cmoutran[at]stanford[dot]edu`); Try it.
    - **Look:** template A (`docs/templates/a-editorial.html`) with C's faint giant زحلة and the camera flight into the city. **Light only**: white, greys, river blue. No beige; red and green only for map ratings. Inter Tight and Instrument Serif on the landing page; the "Record" logo stays. Photos allowed on this page (exception to `DESIGN.md`).
    - **Writing:** first person, plain, short, precise, no clichés. The owner approves each section.
    - **Placeholders until later**, each a labelled grey frame listed in `docs/STATUS.md`: photos (free-licence only), product clips, the confidence triage, the Claude sketch (real product output once the API key is set; never drawn by hand and passed off as Claude's).
    - **EMT map renamed the Volunteer map** (Red Cross volunteers, EMTs, rescuers), page `/volunteer`; `/emt` redirects. Internal name stays `emt`.
    - Vercel Web Analytics (no cookies).
    - **Owner, 23 Nov 2026 (later):** no "How it's built" chapter, no Result chapter (numbers, Red Cross as owner) and no sources list at the bottom; the page goes from Claude straight to the author. Sources open from small numbered badges by each fact. More colour through photos.
    - Then: backup and cleanup of old reports (owner confirms right before), no new sample reports.

### Out (for a later version)

- Real user accounts and login with real OEA membership checks (the demo has a simulated version, see section 7 "In", item 10)
- Arabic UI translation and language switch
- Bulk scanning and a searchable document archive
- The final report template
- Post-earthquake triage queue (see Later list)
- Enforcement features

---

## 8. Working setup

One Claude Code session does all the work, following this plan, `DESIGN.md` and `docs/STATUS.md` (instructions in `CLAUDE.md`). GitHub, Supabase and Vercel are used through their command-line tools. The project owner makes every decision, accepts or rejects work, and watches a full demo run once a week.

### Accounts and setup

The project owner signs in to each account. Claude does everything after that through the command line: creating the repo, the Supabase project, the Vercel deployment, and putting keys in Vercel's settings. Keys never go into the code.

| Account | Owner does | Cost |
|---|---|---|
| GitHub (CharbelMichelMoutran) | Log in once from the terminal | Free |
| Supabase | Sign up with GitHub | Free tier |
| Vercel | Sign up with GitHub | Free tier |
| Anthropic Console | **Needed now** (the owner's 16 Nov 2026 features depend on it; it was deferred before). Sign up, add $50 credit, set a **$50 hard spending limit**, create an API key. Needed for document-to-form (item 5) and items 16 to 19 and 21 | Up to $50 |
| Twilio | Needed once, for one real SMS to the owner's own US number (item 12). Sign up and verify the number; the trial credit should be enough | Free trial |

---

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| The owner writes no code and cannot judge the build | Each feature is checked in a real browser. The owner watches a full demo weekly. |
| AI misreads the messy document | The engineer always confirms the fields. Test on the real document in week 1, not week 3. |
| "Beautiful" stays vague and eats hours | Write `DESIGN.md` before any code. |
| Scope grows past 30 hours | Anything not in section 7 "In" goes on the "Later" list. |
| Anyone with the public link can call the AI upload and spend the $50 budget | Set a hard spending limit in the Anthropic Console. Rate-limit the upload (e.g. a few per visitor per day) and cap image size. |
| With no accounts, any visitor can edit or delete demo data | Seed data that can be restored with one action ("Reset demo"). Run a nightly automatic reset. |
| The real paper document holds personal data (owner names, ID numbers, addresses) | Black out personal details before the photo goes into the public demo or the API. Use the unedited original only for private testing. |
| Claude gets Lebanese codes or field names wrong | The project owner's senior OEA contact reviews the fields and colour wording once (about 10 minutes). |
| Location picks the wrong building | Location only suggests; the engineer always confirms. |
| An empty database makes the demo look like a plain form | Sample data with history is part of the scope (section 7, item 6). |
| Recruiters testing the demo are not in Zahle, or refuse location | The map opens on central Zahle, and they click a building or type an address. |
| OpenStreetMap has few street addresses in Zahle, so address search finds little | Search also matches street, neighbourhood, and landmark names, then zooms there so the engineer clicks the building. |
| Claude says "don't flag" for a real danger, or an engineer relies on a missed flag | The protected list always flags and cannot be learned away (rule 7, enforced in code). Claude's output is advice, the engineer decides (section 4d). The civil-engineer writes the protected list and the context file, and the OEA contact reviews them before the AI ships. "Don't flag" rules need an engineer's approval. |
| Strangers run up AI cost or spam reports on the public link | Rate limits on reports and AI calls. The $50 hard limit in the Anthropic Console. |
| The larger scope runs far past 30 hours | The build order keeps the demo working at every step. The owner can stop after any item. Progress is reported against the order each session. |

---

## 10. First three steps (this week)

1. **Owner:** sign in to the three accounts in section 8 (GitHub, Supabase, Vercel; the Anthropic Console is deferred). Pick 2 or 3 websites whose look you love, for `DESIGN.md`. Photograph the messy engineering document from home.
2. **Claude:** set up the GitHub repo with this `plan.md`, connect Supabase and Vercel, and test the AI on the real document.
3. **Owner:** ask the senior OEA contact for a 10-minute look at the fields and colour wording.

---

## 11. Open questions

- Final report template: being researched separately.

## Later list

(Add ideas here instead of building them now.)

- **Added 23 Nov 2026 (item 28):** build Claude's confidence triage (unsure postings go first to engineers; human corrections are saved to tune Claude); real photos and product clips for the landing page; polish the map screens in the landing page's style and fonts; buy a domain; make the repo public when everything is done.

- Sample buildings with realistic history (scope item 6, still open).
- Live updates between the Engineer and EMT maps, without a reload.
- Switch login back on, with real EMT accounts.
- Items 16 to 19 (Claude sorts submissions, flags buildings, engineer verdicts, rulebook), moved here on 22 Nov 2026 when the EMT assessment became the AI direction.
- Offline mode for the EMT assessment (save and send photos when signal returns).
- A priority list for engineers, ranking EMT postings to review.
- Switch the assessment to Claude Opus 5.5 if Sonnet's readings are not good enough (one line in `src/lib/claude.ts`).
- Engineer review of an EMT posting (confirm or change it).
- **Claude's confidence level** (owner, 23 Nov 2026): Claude says how sure it is of each reading, sketch and proposed posting, so the person knows where to look twice.
- **Triage formula** (owner, 23 Nov 2026): a written, visible formula that ranks buildings for reinspection (rating, residents, age of the last report, and more). It feeds the post-earthquake triage queue below.

- **Post-earthquake triage queue:** after an earthquake, each engineer gets a list of buildings ranked by triage colour × number of residents (the report's residents count).
- Optional "inspection type" (routine / after an event) and basement levels.
- Real engineer accounts, verified by OEA membership number.
- Assigning building reviews to engineers (the Order's role is now merged into engineers; assignment itself is still later).
- On-site check: mark reports saved far from the building as "not filed on site."
- **Engineer side panel** (removed from the UI pass by the owner, 17 Nov 2026): counts per rating with tap-to-filter, recent activity by all engineers, an always-on legend. Bottom sheet on phone.
