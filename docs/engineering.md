# Engineering content: Zahle Building Registry (DRAFT TEMPLATE)

Status: draft by the civil-engineer agent, not yet reviewed by a senior OEA engineer.
Everything marked "Not verified" must be checked before it is relied on. Nothing here is legal advice.
Sample data is not in this version of the file.

How this file is organised:
- Part A (D1 to D8) is the DEMO report format decided by the project owner (plan section 7, item 4). The coder builds from Part A only.
- Part B ("LATER") is my earlier, longer draft: building facts, photos, inspection type, the Lebanese codes in plain words, and the first question list. Nothing in Part B is in the demo. Its section numbers (1 to 5) are its own. Where Part B and Part A differ, Part A wins.

Conventions:
- "Not yet verified" is the plan's wording for unknowns (plan section 4, rule 3). It is stored and shown as a value, never as a finding. It is shown as neutral grey text, with no colour or warning icon.
- Every change to a building fact keeps the earlier value, who changed it, and when (plan 4, rule 5).
- Reports are added only, never edited or deleted.

---

# PART A: DEMO REPORT FORMAT

## D1. What the demo has

Click a building: a window with two actions, "Building history" and "Create report".

- **Building history** lists past reports: report year, engineer's name, colour. Opening one shows the full report read-only, in the same layout as the form.
- **Create report** is the form in D2.
- Colour = how the building is rated for natural disasters (green / yellow / red).

Form title: "Create report". Banner under the title: "Draft template. Not the final report form."

## D2. Form fields: labels, help text, limits

Order on the form: engineer, year, residents, construction date, the three observations, final observation, then the colour (see D5 for why the colour comes last).

### D2.1 Engineer name

| Item | Value |
|---|---|
| Label | Engineer name |
| Input | Text. Demo: chosen from a list of demo names. |
| Required | Yes |
| Limits | 2 to 100 characters. English or Arabic. |
| Help text | Your full name as it appears on your OEA registration. |

### D2.2 Engineer contact

| Item | Value |
|---|---|
| Label | Contact (phone or email) |
| Input | Text |
| Required | Yes (one of the two) |
| Limits | Phone: digits, spaces, plus sign and dashes, 7 to 20 characters. Or an email address. |
| Help text | How the next engineer can reach you about this report. Only engineers see this. |
| Note | In the demo use clearly fake numbers and addresses. Do not store a real person's contact. |

### D2.3 Date of report

| Item | Value |
|---|---|
| Label | Date of report |
| Input | Full date: day / month / year. Defaults to today. |
| Required | Yes |
| Limits | Year 1990 or later. Cannot be in the future. Must be a real calendar date (no 31 February). |
| Help text | The day you inspected the building. If you are entering an old paper report, use the date written on it. If only the year is known, use 1 January and say so in the final observation. |

Why 1990: it is a practical floor for old reports being added later. Not verified, accepted by the owner as drafted. The OEA contact may prefer a different lower limit.

Where the old "year of report" appeared (history rows, residents caveat), read "date of report" instead. History rows show the full date (day/month/year). Newest date first; if two reports share a date, the one saved later is first.

### D2.4 Number of people currently living in the building

| Item | Value |
|---|---|
| Label | People currently living in the building |
| Input | Whole number, or "Not yet verified" |
| Required | Yes (a number, or the "Not yet verified" tick box) |
| Limits | 0 to 1000 |
| Help text | Your best count on the day of your visit, from the owner, the doorbell panel or the neighbours. 0 means empty. Tick "Not yet verified" if you could not find out. This is not a census. |
| Caveat shown beside the field | "Reported on the day, not checked." |

See D6 for what this field means and its limits.

### D2.5 Building construction date

| Item | Value |
|---|---|
| Label | Construction date |
| Input | Year (4 digits) with an optional month, or the "Not yet verified" tick box |
| Prefill | From the previous report for this building. For a first report, empty. |
| Required | Yes (a year, or "Not yet verified") |
| Limits | 1800 up to the year of the report date. It cannot be later than the report year. |
| Approximate | Tick box "Approximate (estimated)". Many old Zahle buildings have no certificate. |
| Help text | When the main building was finished, not later added floors. If you do not know, tick "Not yet verified", do not guess. Change it only if you have a document or clear evidence. |
| Unknown | Shows "Not yet verified" in grey. Never shown as a finding. |

Editing rule (plan rule 5): when the engineer changes the prefilled value, the old value is kept with who changed it and when. The form shows a short note after a change: "Previous value: [old]. It will be kept in the history."

**Reason for change (required when the value is edited).**

| Item | Value |
|---|---|
| Label | Reason for changing the construction date |
| Input | Short text, shown only after the date is changed |
| Required | Yes, when the value differs from the prefilled one. The report cannot be saved without it. |
| Limits | 10 to 300 characters. English or Arabic. |
| Prompt | "Why are you changing it? For example: 'Occupancy certificate dated 1974', 'Owner confirmed, no document', 'Previous report was a rough estimate'." |
| Kept | The previous value, the new value, the reason, who changed it and when. All stay in the history. |

If the prefilled value was "Not yet verified" and the engineer enters a date, this also counts as a change and needs a reason (for example, the source document). If the engineer changes a date back to "Not yet verified", the reason is also required.

Why it matters: the date hints at which building rules, if any, applied. Lebanese seismic provisions came late, and I could not verify the dates (Part B, 3).

### D2.6 Engineer observations

Four areas (roof, columns, foundations, final observation), each required, each English or Arabic (right to left). Each has the same shape: a text box and a "Not inspected" tick box.

| Item | Value |
|---|---|
| Limits | At least 10 characters, at most 2000. Cannot be saved empty. |
| Tick box | "Not inspected". Help text: "Tick this if you could not see or check this part. You must say why." |
| When ticked | The observation box is replaced by a required box "Reason it was not inspected" (10 to 300 characters; for example "Roof locked, no key", "Columns hidden behind finishes", "Foundations buried, no basement access"). The area then counts as complete. |
| Shown in the record | A clear neutral label "Not inspected" with the reason, in the same place the observation would be, in the form, in a past report, and beside the colour. Never blank, and never styled as a warning. |
| Do not | Do not write "OK" or "Fine" for a part you did not see. Use the tick box. |

Final observation with "Not inspected" ticked: allowed because the owner decided it for all four areas. It means "no overall view given", and the reason is required. I flag in D7 whether this makes sense.

Labels and prompts:

1. **Roof.** Prompt: "What did you see on the roof and the top floor? Say where and how bad."
2. **Columns.** Prompt: "What did you see on the columns and beams? Say which ones and how bad."
3. **Foundations.** Prompt: "What did you see at the foundations and the ground around the building? If you could not see them, say so."
4. **Final observation.** Prompt: "Your overall view of the building, and what you recommend. This is what the colour is based on."

Guidance for each is in D3.

## D3. What to look at, with example phrases

This is guidance shown as a collapsed "What to look at" link under each box. Example phrases are clickable suggestions the engineer can edit. They are examples of tone, not findings. Plain English, the engineer may write Arabic instead.

### D3.1 Roof

Look at: water leaks and damp stains on the top-floor ceiling; cracks in the roof slab or at the edges; condition of waterproofing; heavy added loads (water tanks, solar panels, added rooms or floors); parapet and chimney stability; for old stone buildings, the vault or timber roof and any tiles.

Example phrases:
- "Roof slab dry, no visible cracks. Waterproofing in fair condition."
- "Damp stains on top-floor ceiling, north-east corner. Waterproofing worn. Needs repair before winter."
- "Added room on the roof, not shown on earlier reports. Weight and connection to the frame not checked."
- "Parapet cracked at the base, may fall. Needs securing."
- (If the roof cannot be reached, do not write a phrase. Tick "Not inspected" and give the reason, for example "Roof locked, no key".)

### D3.2 Columns

Look at: cracks (especially diagonal or at column ends); spalled concrete and exposed or rusted rebar; leaning or bulging; short or slender columns; a weak ground floor (open parking or shops with few walls); columns changed or removed for shops; for masonry, cracks in load-bearing walls and piers.

Example phrases:
- "Columns visible on ground and first floor, no cracks seen. Concrete in good condition."
- "Rusted rebar exposed on two ground-floor columns, concrete spalling. Needs repair."
- "Diagonal cracks at the top of three ground-floor columns (shop side). Serious. Recommend propping and a detailed study."
- "Ground floor open for parking with few walls. Weak storey in an earthquake. Needs a study."
- "Only the ground-floor columns are visible. Upper columns are behind finishes and were not seen." (If none can be seen, tick "Not inspected" instead.)

### D3.3 Foundations

Look at: settlement, cracks running from the base upward; signs of water or poor drainage near the base; erosion or a cut slope or retaining wall next to the building (common on Zahle's slopes; not verified for specific sites); neighbouring excavation; visible footings in basements; whether foundations could be seen at all.

Example phrases:
- "Foundations not visible. Ground-floor walls and floor show no settlement cracks."
- "Vertical crack running from ground to first floor at the corner. Possible settlement. Monitor and recheck."
- "Excavation next to the north wall, depth about 3 m. Recommend checking support of the foundation."
- "Water pooling at the base on the west side. Drainage needs to be fixed."
- "Basement foundation walls dry, no cracks. Good condition."

### D3.4 Final observation

Look at: how the three observations fit together; what the main concern is; what should happen next and how soon; what you could not check.

Example phrases:
- "No significant defects seen in the parts inspected. Routine maintenance only. Foundations not visible."
- "Needs repair of roof waterproofing and two columns within the year. Safe to use meanwhile. Recheck after work."
- "Serious damage to ground-floor columns. Restrict use of the ground floor. Detailed engineering study needed."
- "Imminent risk. Recommend people leave. Authority informed on [date]."
- "Inspection limited to the exterior. This is not a full structural assessment."

## D4. Colour wording

Standard I align with: ATC-20 post-earthquake safety placards (Applied Technology Council; ATC-20 and ATC-20-2, 2005): INSPECTED (green), RESTRICTED USE (yellow), UNSAFE (red). Source to check: https://atcouncil.org/atc-20. One regional page calls yellow "limited entry". Both are used below.

Field label: **Colour rating for natural disasters**
Help line under the label: "How the building is rated for natural disasters such as earthquakes, based on your four observations."

| Colour | Label on the form | Description shown on the form |
|---|---|---|
| Green | Green: Good condition | No serious defect found in the parts you inspected. No restriction on use at the time of your visit. |
| Yellow | Yellow: Needs some work (restricted use) | Defects found. Work is needed. Parts of the building may be used only under the conditions in your observations. |
| Red | Red: Imminent risk (unsafe, do not enter) | Serious danger found. People should not enter or stay, unless the engineer or authority allows it. This is not a demolition order. |

The last sentence for red follows the ATC-20 red placard. The registry records. Authorities decide (plan rule 4).

Warning text, shown directly above the colour choices, always visible:

> **Choose carefully.** After an earthquake, these colours are used to decide which buildings are checked first and who may enter. Green means no restriction on use at the time of your visit. It does not mean the building is earthquake-resistant. Choose the colour your observations support. A saved report cannot be changed. If something changes later, add a new report.

Short version for small screens:

> After an earthquake these colours are used for triage. Choose carefully. Your observations are always shown with the colour. A saved report cannot be changed.

## D5. Where the colour is picked and how it relates to the observations

- Owner decision 1: the colour is a REQUIRED field at the END of the form, picked after the four observations. A report cannot be saved without a colour. Required message: "Choose a colour to save this report." There is no default colour selected, so the engineer must choose one on purpose. Reason: the colour should follow from what was written, not the other way round.
- Owner decision 2: in "Building history", each colour is shown with the first line of that report's final observation beside it (cut at about 120 characters with "...", full text on opening the report).
- Above the colour, the form shows the four observations again in short (first line of each), so the engineer sees what the colour will sit next to.
- The engineer cannot pick a colour until all four areas are complete. An area is complete when it has an observation of at least 10 characters, or "Not inspected" ticked with a reason. The save button is disabled until then, with the text "Complete all four observations to choose a colour." (The word "observations" here covers a "Not inspected" reason.)
- Where an area is "Not inspected", the short summary above the colour shows "Not inspected: [reason]", so the engineer sees what the colour is resting on.
- Yellow: the final observation prompt changes to "Which parts or uses are restricted, and what work is needed?"
- Red: the final observation prompt changes to "What is the danger, and what did you tell the owner or authority?" These are prompts only, not extra fields.
- The colour is never shown alone (plan rule 1):
  - In "Building history", each row shows report date (day/month/year), engineer name, the colour word (Green / Yellow / Red) with the dot, and the first line of that report's final observation beside it. Never a bare dot. If the final observation starts with a label or is empty, show it as written; do not substitute text.
  - A past report opens with the colour and all four observations on one screen.
  - Do not rely on colour alone. Always put the word next to the dot.
- "No report yet" is shown in neutral grey, never in a warning style.
- Newest report first. Old reports stay visible.

## D6. Number of people currently living in the building

What it means: the engineer's best count of people living in the building on the day of the visit. It tells the next engineer, and later a possible triage list, how many people are exposed if the building is unsafe. This is why the plan's Later list wants a residents count.

Does it need a caveat? Yes.
- It is self-reported on the day, usually from the owner or neighbours, and not checked. Show "Reported on the day, not checked" beside the number, and in history views.
- It changes over time (tenants move, people leave, seasonal use, displaced families). It must be read as a number for the report date only. Do not show it as the building's current population later on.
- It is personal-adjacent data, though no names are stored. Only engineers see it (plan rule 2). Keep it out of any public view.
- It could be misused: owners might understate residents to avoid pressure, or the number could be used to prioritise buildings in a way that leaves people out. The registry only records it. It is not an official census figure.
- "0" and "Not yet verified" are different. 0 means empty (for example, abandoned or being renovated). Not yet verified means the engineer did not find out. The form must make this clear.
- Do not include people who only work or shop in the building. Say so in the help text. Ask the OEA contact whether this is the right choice for triage (D8, question 6).

## D7. Flags on the format, ranked

Most important first. I have not added fields. The project owner decides.

1. **Colour mixes two meanings.** The plan's yellow, "needs some work", can be a maintenance matter. ATC-20 yellow, "restricted use", is about safety after an event. Green in ATC-20 terms (no new damage) can still be an earthquake-weak building. The wording in D4 and the warning text reduce the risk. The cleaner fix is a separate "inspection type" (routine or after an event). The owner has decided it is not in the demo; it stays in Part B (Later). See Part B, 2.2.
2. **Colour is not tied to the building's type.** With no structure type, floors or seismic measures in the demo, a green on an old unreinforced stone building looks the same as a green on a new frame. The final observation must carry that. Part B has these fields for later.
3. **Green with "Not inspected" areas.** The form allows a colour when roof, columns or foundations are marked "Not inspected", including green. A green resting on unseen parts reads as better evidence than it is. The record shows "Not inspected" and the reason beside the colour, which is the safeguard. Whether the form should do more (for example, warn on green when any area is not inspected) is for the owner and the OEA contact. No change made.
4. **"Not inspected" on the final observation** has no clear meaning, because the colour must still be chosen. Allowed as decided; flagged only.
5. **Residents count is not checked.** See D6.
6. **No photos.** Fine for the demo. For real use, photos matter more than anything else in the report. Already on the Later list.
7. **Engineer contact is not protected beyond "engineers only".** Engineer safety is a stated risk in plan section 4. In the demo it is fake data. A real version would need a decision on who sees contacts.

## D8. Questions for the senior OEA contact (about 10 minutes)

Questions 1 to 4 matter most.

1. Colours. Are the labels in D4 right, and what words do Lebanese engineers use for green, yellow and red (English, French, Arabic)? Is "Good condition / Needs some work / Imminent risk" an acceptable way to say it?
2. Is it acceptable to use one colour for both everyday condition and disaster rating? Or should routine and after-earthquake ratings be separate?
3. Is a visual check of roof, columns and foundations enough for a "rated for natural disasters" colour? The owner chose not to put a "visual check only" line on the form, so the observations carry this. Is that acceptable to engineers?
4. Do OEA or municipalities use ATC-20-style tags in Lebanon (for example after the 2020 port blast or the 2023 earthquakes)? If there is an official form, should we follow it?
5. Are roof, columns, foundations and a final observation the right four headings? Would engineers expect walls or slabs too?
6. The number of residents: is "people living in the building on the day" the right measure for triage? Should it include people who work there? How accurate can it be?
7. Construction date: how do engineers normally find it (permit, occupancy certificate, owner)? Is "Approximate" acceptable? Is the year 1800 a sensible lowest value?
8. Can a colour, especially green, be given when one of roof, columns or foundations is "Not inspected"? Should the report be allowed to carry green in that case?
9. Anything in the warning text in D4 that worries an engineer, for example liability, signature, or safety?
10. Do the three Lebanese texts in Part B, 3 (Law 646/2004, Decrees 14293 and 7964) say anything about what a report must contain, so that "draft template" is accurately labelled?

---

# PART B: LATER (not in the demo)

Everything below is my earlier longer draft. It is kept for the later version. Not in the demo: floors, structure type, seismic measures, units, photos, inspection type. Section numbers 1 to 5 below are its own. Its wording for "inspection" and "remarks" is replaced in the demo by "report" and "observations" (Part A). The earlier colour wording in B 2.1 is superseded by D4.

---

## 1. Building facts

Shared rule for all five fields: each has a visible state "Not yet verified". It is the default for a new building. It is shown as grey text "Not yet verified" with no colour and no warning icon. It must never look like a bad result. The engineer can set a value at any time. Values read by the AI from a scanned document start as "From document, please confirm" until the engineer confirms them.

### 1.1 Year built

| Item | Value |
|---|---|
| Label | Year built |
| Input | Number, 4 digits, or "Not yet verified" |
| Allowed | 1800 up to the current year. Whole numbers only. |
| Extra option | "Approximate" tick box (many old buildings have no certificate; engineers estimate by decade) |
| Help text | Year the main building was completed. If you are estimating, tick "Approximate". Use the year of the original building, not of later added floors. |
| Not yet verified | Field empty, grey text "Not yet verified". |

Why it matters: it tells the next engineer which seismic rules, if any, the building could have been designed under. Lebanon's first seismic provisions came late. Exact dates of the codes: Not verified (see section 3).

### 1.2 Number of floors

| Item | Value |
|---|---|
| Label | Number of floors above ground |
| Input | Whole number, 1 to 40, or "Not yet verified" |
| Allowed | 1 to 40 |
| Extra field (suggestion, see 1.7) | Basement levels below ground: whole number, 0 to 10 |
| Help text | Count every level above ground that people use, including the ground floor and any added or roof-level floors. Do not count basements here. |
| Not yet verified | Field empty, grey text "Not yet verified". |

Note: counting added floors honestly is exactly what the plan worries about (illegal extra floors become visible). Rule 4 applies: the registry records the physical fact, it does not say whether the floor is legal. Do not add a "legal / illegal" field in this version.

### 1.3 Structure type

| Item | Value |
|---|---|
| Label | Structure type |
| Input | Single choice (dropdown), plus a short free-text "Other / note" box |
| Help text | The main system that carries the loads. If the building is mixed or was extended, choose "Mixed / extended" and describe it in the note. |
| Not yet verified | Choice "Not yet verified" (the default). |

Allowed values (draft list for Zahle):

1. Reinforced concrete frame (columns and beams, with infill walls). Most common for buildings from about the 1960s onward.
2. Reinforced concrete shear wall or wall-frame
3. Load-bearing stone masonry (old houses, often with stone walls and a vault or timber or steel-and-vault roof; typical of older Zahle neighbourhoods)
4. Load-bearing concrete block masonry
5. Steel frame
6. Mixed / extended (for example an old masonry building with added reinforced concrete floors, or a concrete frame with a later added floor)
7. Other (use the note)
8. Not yet verified

Honesty note: I am confident these types exist in Lebanon. I have not verified the share of each type in Zahle. The list may need local words (for example "Ottoman / old stone house", "red-tile roof house"). Ask the OEA contact. Mixed / extended is deliberately its own value because added floors on older buildings are a known weak point.

### 1.4 Seismic measures

| Item | Value |
|---|---|
| Label | Seismic measures |
| Input | Three-way choice: Yes / No / Unknown (plan 4c). Plus a short optional note. |
| Help text | Yes: the building was designed to a seismic code or strengthened afterwards, and you have seen evidence (drawings, report, visible work). No: you have seen evidence there are none, for example an old unreinforced masonry building. Unknown: you could not tell. Describe what you saw in the note. |
| Not yet verified | "Unknown" is the default and is shown as "Not yet verified". Choosing "Unknown" and not having checked are the same on screen. |

Important wording choice: "No" is a finding. "Unknown" is not. The form should not push the engineer from Unknown to No just because there are no papers. Help text says so.

### 1.5 Number of units

| Item | Value |
|---|---|
| Label | Number of units |
| Input | Whole number, 1 to 200, or "Not yet verified" |
| Help text | Apartments, shops, offices or other separate units that are used or sold on their own. Count what exists, not what the permit says. |
| Not yet verified | Field empty, grey text "Not yet verified". |

Note: this is not a count of residents. The residents count is on the Later list (plan, Later list), not in this version.

### 1.6 Fields handled outside this section

Outline and location come from OpenStreetMap, copied once (plan 4c). Not edited by the engineer in this version.

### 1.7 Suggestions for the project owner (not decided, keep first version small)

My view: the five fields in the plan are enough for a first version. Two additions are cheap and useful. Both are optional. Neither is in plan section 7 "In", so by project rules they go on the Later list unless the project owner decides otherwise.

1. Use of building (residential / commercial / mixed / public / other). Reason: a school or a hospital changes how an engineer reads the same colour. Not essential.
2. Basement levels, as in 1.2. Reason: floor counts are misread without it. I would fold this into the floors help text and skip the field if the owner wants fewer fields.

One thing I would flag as wrong or risky: "number of units" alone does not tell the next engineer how many people are exposed. That is already on the Later list, so no change is needed now.

---

## 2. Inspection fields

An inspection is added only, never edited or deleted (plan 4, rule 5). Fields:

| Field | Input | Rules |
|---|---|---|
| Date of inspection | Date, defaults to today, cannot be in the future | Required |
| Engineer | Chosen demo name (no real accounts in the demo) | Required |
| Condition colour | One of green / yellow / red | Required |
| Engineer's remarks | Free text, English or Arabic, right to left works | Required whenever a colour is chosen. Minimum about 20 characters. Cannot be saved empty (plan 4, rule 1). |
| Photos | Image upload, several allowed | Optional. Strongly encouraged for yellow and red. |

Remarks help text: "Say what you saw and what the colour is based on. Name the part of the building (for example 'second-floor column, north side') and what you recommend. The colour is always shown next to your remarks."

Photos help text: "Add photos of what the remarks describe. Include one photo of the whole building and close-ups of any damage or defect."

Optional extra for the engineer (suggestion, not decided): a drop-down "Inspection type" with "Routine / Condition survey" and "After an earthquake or other event". See the alignment problem below. I recommend it.

### 2.1 Condition colour wording

Standard I align with: ATC-20 post-earthquake safety evaluation placards (Applied Technology Council; ATC-20 and ATC-20-2 revised 2005, Rapid and Detailed Evaluation forms). Placard names there are INSPECTED (green), RESTRICTED USE (yellow), UNSAFE (red). Source to check: https://atcouncil.org/atc-20. One regional page calls yellow "limited entry". The ATC site and forms use "Restricted Use". The plan uses "limited entry". I use both, "Restricted use (limited entry)".

Plan meanings, and the wording I propose:

| Colour | Plan meaning | Short label on the form | One-line description (shown on the form) |
|---|---|---|---|
| Green | Good condition | Green: Inspected, no restriction | No damage or defect found that limits use. Safe to use as inspected. |
| Yellow | Needs some work | Yellow: Restricted use (limited entry) | Damage or defects found. Parts of the building may be used only under the conditions written in your remarks. Work is needed. |
| Red | Imminent risk | Red: Unsafe, do not enter | Serious danger found. People should not enter or stay, except as the engineer or authority allows. This is not a demolition order. |

The last sentence for red follows the ATC-20 red placard, which states that it is not a demolition order. The registry follows plan rule 4: it records, authorities decide.

Yellow rule on the form: the remarks must state which areas or uses are restricted, or what work is needed first. The form shows a prompt under the box when yellow is chosen: "Which areas or uses are restricted, and what work is needed?"

Red rule on the form: the remarks must say what the danger is. The form prompt: "What is the danger, and what did you tell the owner or authority?" This is a prompt, not a required extra field.

Green rule: green does not mean the building is earthquake-resistant. See the warning below.

### 2.2 Honest alignment problem (needs the project owner and OEA contact)

ATC-20 tags describe safety after an event (damage seen now). The plan's "yellow = needs some work" is also a maintenance meaning (for example, cracked plaster, corroded rebar, water damage) that can exist with no earthquake. These are not the same thing:

- A building can be green in ATC-20 terms (no new damage) and still be seismically weak (for example, old unreinforced masonry or a soft ground floor). A green colour must not be read as "earthquake safe".
- A building can be yellow in the plan (needs work) but not need any restriction on use.

My recommendation: keep the plan's three colours, and make the line "what the colour means" explicit about this, as in the warning text below. Also add the optional inspection type field (above) so that a later triage can tell a routine green from a post-earthquake green. Decision for the project owner.

Not yet verified: whether Lebanese practice (OEA, Higher Council for Disaster, municipalities after the 2023 and August 2020 events) used ATC-20-style tags, and which exact forms. I cannot confirm this from sources I could access. Ask the OEA contact.

### 2.3 Warning text the form must show

Placed directly above the colour choice, always visible, not hidden in a tooltip:

> **Choose carefully.** After an earthquake, these colours are used to decide which buildings are checked first and which people may enter. Green means no restriction on use at the time of your inspection. It does not mean the building is earthquake-resistant. Choose the colour your remarks support, and say what you saw. Inspections cannot be edited or deleted after saving. If something changes later, add a new inspection.

Short version for small screens:

> After an earthquake these colours are used for triage. Choose carefully. Your remarks are always shown with the colour. A saved inspection cannot be changed.

Also shown on the form, near the title: "Draft template. Not the final report form."

### 2.4 Showing inspections in the record

- Always show colour and remarks together, in one block (plan rule 1). Never show a colour dot alone in a list. In a list, show the colour with the first line of remarks, or the words "Yellow: Restricted use".
- Do not rely on colour alone: always put the word (Green / Yellow / Red) next to the dot, for people who cannot see colours.
- Show date and engineer name on every inspection.
- Never show a building as "not inspected" in red, orange or any warning style. No inspection yet is shown as "No inspection recorded yet" in neutral grey (plan section 5, public map reason).
- Newest inspection first. Older ones stay visible, they are never replaced.
- When the latest inspection is old, a neutral note "Last inspected [date]" is enough. Do not add a "stale" or "expired" warning. How long a colour stays valid is Not yet verified.

---

## 3. Lebanese codes in plain words

Honesty statement: I could not read the official texts. What follows comes from secondary sources (Public Works Studio, a Lebanese magazine article, FAOLEX entry, academic papers found by search). I give no article numbers, because I could not confirm them. Everything below is "not verified" unless stated otherwise. Authoritative sources to check: the Official Gazette (Al-Jarida al-Rasmiyya), the Ministry of Public Works and Transport, the OEA legal office.

### 3.1 Law No. 646/2004 (the Construction Law)

- What it is, as far as I can tell: the main building law of Lebanon, issued in 2004. It covers building permits, construction rules, and the responsibilities of those who build. Its technical audit provisions are described in some sources as being carried out through implementing decrees.
- What I could not verify: the exact wording on engineers' duties, on liability periods, on technical control during construction, and on who may carry out inspections.
- Relation to the app: the building facts (year built, floors, structure type) are the kind of facts that a permit file holds. The registry does not check permits and does not say whether a building is legal (plan rule 4).
- Status: not verified.
- One related source reports an April 2025 proposal in parliament to amend the building law. Whether it passed: not verified.

### 3.2 Decree 14293 (issued 2005)

- What it is, as far as I can tell: the decree on public safety for buildings and facilities, covering building safety, fire protection and earthquake protection. One magazine source says it replaced earlier texts and moved technical inspection to private specialised offices. Some sources give the Official Gazette date as 24 March 2005, others 11 March 2005. Date: not verified.
- Relation to the app: it is the reason a building might have a safety certificate or technical audit on paper. Old documents scanned into the registry could be such certificates. The registry stores the scan and the facts read from it. It does not decide whether the building complies.
- Not verified: what exactly must be inspected, how often, and by whom.

### 3.3 Decree 7964 (issued 2012)

- What it is, as far as I can tell: an amendment to Decree 14293. Sources say it introduced compulsory periodic technical inspection in stages starting in December 2012 (later stages 2014 and 2016), and that it raised the minimum seismic design horizontal acceleration from 0.20 g to 0.25 g. It is said to have been issued faster after the collapse of the Fassouh building in Achrafieh (2012).
- All of the above: not verified. Do not print the acceleration value in the app without the OEA contact's confirmation.
- Relation to the app: "year built" relates to which seismic rule applied, if any. The "seismic measures" field is the engineer's own observation, and is separate from anything a decree requires.

### 3.4 Other texts I came across (not asked for, not verified)

- Decree No. 144/2004 and Decree 15874/2005 appear in some sources as implementing texts. I am not sure of their role. Ask the OEA contact before mentioning them anywhere.
- Lebanese seismic design standards or guidelines (for example any national seismic code or the OEA's guidance): not verified. I did not find one I could confirm.

### 3.5 What the app must not do with these laws

- Do not quote articles or deadlines in the UI.
- Do not label any building "compliant" or "non-compliant".
- Do not show fines, evacuation orders or legal status (plan rule 4).
- Do not claim the draft template meets any legal reporting requirement. It states "Draft template".

---

## 4. Questions for the senior OEA contact (about 10 minutes)

Please answer yes / no / a short phrase. Questions 1 to 5 matter most.

1. Colours. Are these three labels right, in plain Lebanese practice: Green "Inspected, no restriction", Yellow "Restricted use (limited entry)", Red "Unsafe, do not enter"? Which words do engineers in Lebanon actually use, in English, French or Arabic?
2. Do OEA or municipalities use ATC-20-style green / yellow / red tags in Lebanon (for example after the 2020 port blast or the 2023 earthquakes)? If so, is there an official form we should copy instead?
3. The plan's yellow means "needs some work", while the ATC-20 yellow means "restricted use". Is it acceptable to combine both in one colour, and should we add an inspection type (routine vs after an event)?
4. Structure type list: is the list in 1.3 complete and in the right words for Zahle? What would you add or remove (old stone houses, vaulted roofs, flat slab, precast)?
5. Is "seismic measures: yes / no / unknown" a useful question, and how should an engineer decide "yes"? Is "designed to a code" enough, or must there be strengthening?
6. Is year built the right field, or do engineers use the permit year or the occupancy-permit year more?
7. Number of floors: should basements and added floors be counted separately? Is it acceptable to record added floors in a neutral way?
8. Law 646/2004, Decrees 14293 and 7964: are my one-line descriptions in section 3 broadly right? Is the 0.25 g figure right? Which of these laws requires a periodic inspection, and who may do it?
9. Is a free-text remarks box enough in a draft, and what must a remark always contain (for example element, extent, recommendation)?
10. Anything an engineer would be worried about in the wording of the warning text in 2.3 (for example liability, signature, safety of the engineer)?

---

## 5. Decisions for the project owner

1. Combine the post-earthquake meaning and the "needs some work" meaning in one set of colours (recommended, with the warning text), or split into two scales later.
2. Add an "Inspection type" choice (routine / after an event). Recommended. Small. Outside plan section 7, so needs your yes.
3. Add "Use of building" and "Basement levels" (optional, my suggestion is: basements yes as a short field, use of building to the Later list).
4. Whether the UI shows any law names at all (my recommendation: no, only in README background).
5. Whether remarks have a minimum length (I suggest about 20 characters) so that an empty "ok" cannot be saved next to a colour.
