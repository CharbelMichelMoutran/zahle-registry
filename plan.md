# Zahle Building Registry — Project Plan

This file is the shared plan for the project. The orchestrator and every agent (civil-engineer, coder, devils-advocate) read it before starting any task. If a task conflicts with this plan, stop and ask the project owner.

---

## 1. Problem

Building records in Lebanon are either kept on paper that no one can reach, or were never made. So the Order of Engineers and Architects (OEA) and municipalities end up inspecting buildings from scratch, again and again.

A senior OEA engineer confirmed to the project owner that records are missing, that inspections get repeated, and that a tool like this would be useful.

The registry is not a disaster tool. It is a lasting record of every building, made by and for engineers. It becomes most valuable after a disaster, such as the 2023 earthquakes, when unstable buildings must be found and reinspected quickly.

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

**Success:**
1. A person with the link can run the full flow in under 5 minutes, as an engineer, without help.
2. The GitHub repo (github.com/CharbelMichelMoutran) presents the project well: a README with screenshots or a short GIF, the live link at the top, the problem in a few lines, the design principles, and the tech stack. Clean commit history. The repo is pinned on the profile.

---

## 3. Chosen approach

A tool for **civil engineers only**. One website with a map of Zahle's buildings. The engineer:

1. **Picks a building.** When the site opens, it uses the engineer's location to suggest the building they are standing at, and the engineer confirms with one tap (phone location is rough indoors, often 20–50 m off). Or the engineer types an address, or clicks a building on the map.
2. **Sees the building's record:** its facts, every past inspection, and every scanned document. This is the payoff of the whole product: the next engineer does not start from scratch.
3. **Adds an inspection** with photos, a condition colour (section 4b), and remarks.
4. **Can upload a photo of an old paper document.** The AI fills in the building facts it can read, and the engineer checks and corrects them before saving.

Residents, the public, and the Order do not use the app in this version.

**Voluntary use is a goal.** Engineers should want to use the registry because it saves them time (e.g. the paper-to-form feature), not only because someone forces them.

### Stack

| Part | Choice |
|---|---|
| Frontend | Next.js + React |
| Map | Leaflet + OpenStreetMap building outlines |
| Database and photo storage | Supabase |
| Hosting (public link) | Vercel |
| Document reading | Claude API (budget: up to $50) |

The project owner writes **no code**. Agents write all the code, and Claude handles setup (repo, Supabase, Vercel, keys) through the command line. The project owner directs, decides, and reviews.

---

## 4. Design principle: a help tool, not a police tool

Engineers must be **happy to use** the product. It must not start an "arms race" where owners hide problems or pressure engineers.

### Risks if this is done badly

- **Property value loss.** Owners avoid inspections or pressure engineers for better ratings.
- **Exposure.** Illegal extra floors become visible, so owners fight the system.
- **Engineer safety.** An engineer's signature on a bad rating can make them a target.

Hiding dangerous buildings is **not** the answer. Silence is what lets them collapse. The answer is design.

### Rules every agent must follow

1. **A colour never stands alone.** Every inspection shows the engineer's remarks next to its colour.
2. **Only engineers see reports.** Nothing about any building is public.
3. **Mark unknowns as "Not yet verified,"** never as findings.
4. **The record is separate from enforcement.** The registry records facts. Fines and evacuations stay with the authorities. The app is not the punisher.
5. **Never overwrite the record.** A new inspection is added to the history; old inspections stay as they were. Changes to building facts keep the previous value and who changed it.

### 4b. Condition colours

The engineer picks one colour per report:

| Colour | Meaning |
|---|---|
| Green | Good condition |
| Yellow | Needs some work |
| Red | Imminent risk |

The form must make clear to the engineer that **after an earthquake these colours are used for triage, so choose carefully.**

After earthquakes, engineers already use a standard green / yellow / red tagging, where yellow means "limited entry." The civil-engineer agent aligns the exact wording with that standard, so engineers read the colours the way they already know them.

### 4c. What is stored

| Part | What it holds | Changes how |
|---|---|---|
| **Building** | Outline and location (copied once from OpenStreetMap), year built, number of floors, structure type, seismic measures (yes / no / unknown), number of units | Facts are edited, but every earlier value is kept with who changed it and when |
| **Inspection** | Date, engineer, condition colour, engineer's remarks, photos | Added only, never edited or deleted |
| **Document** | Scanned image of an old paper record, the facts the AI read from it, the date added | Added only |

The building outlines are copied into our own database once, not loaded live from OpenStreetMap, because OpenStreetMap's building IDs change when people edit the map. That would cut records off from their buildings.

### 4d. Trust model (first version)

- **Engineers are trusted.** A report uploaded by an engineer is assumed to be honest.
- In the demo there are no real accounts. In a real version, engineers are easy to verify because each is a registered OEA member.

---

## 5. Options rejected

| Option | Why rejected |
|---|---|
| Order role (assigning reviews) | Not needed for the core flow. Engineers pick buildings themselves. |
| Resident view | Checking that someone really lives in a building is too hard. Dropped; the tool is for engineers only. |
| Paper-to-digital as a separate product | Kept, but as one feature inside the platform. |
| Google Maps | No clickable building outlines. |
| Separate "code" and "UI" agents | In React the UI is code. Two agents on the same screens overwrite each other. |
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
   - Floors, structure type, seismic measures, and units are **not** in the demo report. Photos are not in the demo report. Both go on the Later list.
5. AI document-to-form: one uploaded image, AI fills the building facts, engineer confirms. **Built right after the form, not last.** It is what sets the project apart and the main reason engineers would want to use it. Tested on the real document in week 1 (a quick check, no UI).
6. Sample data with history: several buildings with past inspections and scanned documents, so the demo shows the record paying off
7. Arabic text displays and types correctly, right to left, in reports, names, and AI output. The UI stays in English.
8. Public link, polished GitHub README (section 2)
9. The design rules in section 4

### Out (for a later version)

- Real user accounts and login (OEA membership)
- The Order role: assigning reviews to engineers
- Arabic UI translation and language switch
- Bulk scanning and a searchable document archive
- The final report template (being researched separately with an agent)
- Post-earthquake triage queue (see Later list)
- Enforcement features

---

## 8. Team (agents)

**Orchestrator: the main Claude Code session** (instructions in `CLAUDE.md`). It sees the big picture, explains the full experience to the project owner, keeps this plan up to date, breaks work into tasks, and sends them to the agents below. It is not a separate agent, because agents cannot start other agents or talk to the project owner.

The agents live in `.claude/agents/` in this repo. All of them read this file first.

| Agent | Job |
|---|---|
| **civil-engineer** | Advises on engineering content: building facts and inspection fields, condition colour wording (aligned with standard post-earthquake tagging), Lebanese codes (Law 646/2004, Decrees 14293 and 7964), realistic sample data. Writes only to `docs/engineering.md`, never app code. Its advice is checked once by the project owner's senior OEA contact. |
| **coder** | The only agent that writes app code. Builds features and the UI, following this plan, `DESIGN.md`, `docs/engineering.md`, and the examples and skills the project owner provides. |
| **devils-advocate** | Tries to break the app in a real browser (Playwright MCP), two ways: as an attacker (drain the AI budget, wipe data, inject scripts, upload huge or fake files, reach private data) and as a confused or hurried engineer (Arabic text, wrong building, half-filled forms, slow phone). Also checks the design rules in section 4. Reports problems ranked by severity. Never fixes code. |

**MCP:** only Playwright, for the devil's advocate. GitHub, Supabase, and Vercel are used through their command-line tools.

**Project owner:** makes every decision, accepts or rejects work, and watches a full demo run once a week.

### Accounts and setup

The project owner signs in to each account. Claude does everything after that through the command line: creating the repo, the Supabase project, the Vercel deployment, and putting keys in Vercel's settings. Keys never go into the code.

| Account | Owner does | Cost |
|---|---|---|
| GitHub (CharbelMichelMoutran) | Log in once from the terminal | Free |
| Supabase | Sign up with GitHub | Free tier |
| Vercel | Sign up with GitHub | Free tier |
| Anthropic Console | **Deferred.** Not set up for now. Needed later, before AI document-to-form (section 7, item 5) can run: sign up, add $50 credit, set a $50 spending limit, create an API key | Up to $50 |

---

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Agents build something the owner cannot judge, because the owner writes no code | The devils-advocate agent tests each feature in a real browser. The owner watches a full demo weekly. |
| AI misreads the messy document | The engineer always confirms the fields. Test on the real document in week 1, not week 3. |
| "Beautiful" stays vague and eats hours | Write `DESIGN.md` before any code. |
| Scope grows past 30 hours | Anything not in section 7 "In" goes on the "Later" list. |
| Anyone with the public link can call the AI upload and spend the $50 budget | Set a hard spending limit in the Anthropic Console. Rate-limit the upload (e.g. a few per visitor per day) and cap image size. |
| With no accounts, any visitor can edit or delete demo data | Seed data that can be restored with one action ("Reset demo"). Run a nightly automatic reset. |
| The real paper document holds personal data (owner names, ID numbers, addresses) | Black out personal details before the photo goes into the public demo or the API. Use the unedited original only for private testing. |
| The civil-engineer agent gets Lebanese codes or field names wrong | The project owner's senior OEA contact reviews the fields and colour wording once (about 10 minutes). |
| Location picks the wrong building | Location only suggests; the engineer always confirms. |
| An empty database makes the demo look like a plain form | Sample data with history is part of the scope (section 7, item 6). |
| Recruiters testing the demo are not in Zahle, or refuse location | The map opens on central Zahle, and they click a building or type an address. |
| OpenStreetMap has few street addresses in Zahle, so address search finds little | Search also matches street, neighbourhood, and landmark names, then zooms there so the engineer clicks the building. |

---

## 10. First three steps (this week)

1. **Owner:** sign in to the three accounts in section 8 (GitHub, Supabase, Vercel; the Anthropic Console is deferred). Pick 2 or 3 websites whose look you love, for `DESIGN.md`. Photograph the messy engineering document from home.
2. **Claude:** set up the GitHub repo with this `plan.md`, connect Supabase and Vercel, and test the AI on the real document.
3. **Claude:** create the three agents in `.claude/agents/`.
4. **Owner:** ask the senior OEA contact for a 10-minute look at the fields and colour wording, once the civil-engineer agent drafts them.

---

## 11. Open questions

- Final report template: being researched separately.

## Later list

(Add ideas here instead of building them now.)

- **Post-earthquake triage queue:** after an earthquake, each engineer gets a list of buildings ranked by triage colour × number of residents. (Needs a residents count per building.)
- Fuller building facts (floors, structure type, seismic measures, units) and photos in the report. Civil-engineer's draft is in `docs/engineering.md`.
- Optional "inspection type" (routine / after an event) and basement levels, suggested by the civil-engineer.
- Real engineer accounts, verified by OEA membership number.
- The Order role: assigns building reviews to engineers.
- On-site check: mark reports saved far from the building as "not filed on site."
