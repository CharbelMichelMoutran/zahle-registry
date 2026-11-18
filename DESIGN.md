# DESIGN.md — Zahle Building Registry

Every agent reads this file, together with `plan.md`, before any UI work. If a design choice is not covered here, follow the spirit of this file and ask the project owner. Where this file and `plan.md` disagree, `plan.md` wins, and the orchestrator asks the owner.

Written from the owner's draft (16 Nov 2026). Changes from the draft are listed in section 12.

## 1. The idea in one line

Family's springy, friendly trays and Raycast's crisp precision, in light and warm Zahle colours, on top of a calm map.

| Site | Take | Leave |
|---|---|---|
| **Family** (main reference) | Trays that slide up and change height smoothly. Springy, physical motion. Buttons that feel good to press. Friendly, bright colour. Calm, human wording. | Crypto and wallet content. |
| **Raycast** | Crisp, precise layout. A command bar for fast search. Clean list rows. Keyboard shortcuts. Fine borders and soft depth. | The dark, black, gloomy theme. Red accents. |

### Heavy inspiration: the Beirut Urban Lab family (owner, 16 Nov 2026)

The owner wants these relied on heavily: the **Beirut Built Environment Database**, **Precarious Homes**, and the **Beirut Urban Lab** home page (the lab behind the post-blast damage maps). They are Lebanese, built by researchers and engineers, and they take buildings seriously. Reviewed in a browser on 16 Nov 2026. What they teach us:

| Seen on | What we take | What we leave |
|---|---|---|
| **Beirut Urban Lab home** | The **bilingual stacked wordmark**: Latin on the left, Arabic on the right, same weight, tightly set. Small **uppercase, letter-spaced labels** in a condensed sans for navigation and section names. **Dashed hairlines** as dividers. A **diagonal hatch** as a quiet fill. Dense, confident editorial layout, with the date on the card. | The coral-red accent (no red). Long scrolling grid pages. |
| **Beirut Built Environment Database** | Every building is a **coloured footprint**, and place names sit quietly on the map. A bold white title over the map, with one calm line of explanation. The map is the hero. | The dark map (no dark themes). Six unrelated footprint colours: we have four. |
| **Precarious Homes** | **Serif display type** for titles and one-line statements: it feels human, serious and literary. Plain, honest, human wording about housing. Full-bleed photography. | Dark top bar. We have no photography in the demo. |

How they change this design:
1. **Wordmark.** Stacked and bilingual like the lab's logo: "zahle / building / registry" on the left in Inter Tight 600 lower-case, **زحلة** on the right in IBM Plex Sans Arabic, large. Use it on the login, sign-up and waiting screens, and small (one line) in the top bar.
2. **Display serif.** Add one serif for display moments only: **Source Serif 4**, weight 500. Use it for the sign-up and waiting screen titles, the empty-state line, and the preview tray's building heading. Everything else stays Inter. This is where the "City of Poetry" voice lives.
3. **Micro-labels.** Section and field-group labels use 13px uppercase, letter-spacing 0.08em, weight 600, in `text-muted`: "HISTORY", "BUILDING", "OBSERVATIONS". This is our Raycast-meets-lab detail.
4. **Dashed hairline** (`1px dashed border`) divides sections inside a tray. Solid `border` stays for panels and rows.
5. **Hatch means unknown.** A fine diagonal hatch in `border` colour is the fill for **"Not yet inspected"** buildings and for any "Not yet verified" value. It is a functional use: it tells colour-blind users "no data", and it echoes the lab's hatch. It appears **nowhere else**. No other textures or patterns.
6. **Map as the hero.** Buildings are footprints coloured by status (section 3), with quiet place names. The tray has one calm line of explanation, never a wall of text.

## 2. Zahle: the theme (hard rule)

The design must feel like Zahle, not like a generic map app. Zahle is the "City of Wine and Poetry", on the Berdawni river, at the foot of Mount Sannine, in the Bekaa valley, with stone houses, arched windows and red-tile roofs. These details come from general knowledge. **The owner corrects anything wrong or missing.**

How Zahle shows up. Each item is small, and each one has a job:

| Zahle thing | Where it appears in the design |
|---|---|
| **Limestone** | The warm cream ground (`ground`) and the soft surfaces. The calm base of everything. |
| **Red roof tile (terracotta)** | The strongest status colour (section 3). Warm, not alarming. |
| **Vineyards** | The "good" green. |
| **The Berdawni river** | The accent blue: buttons, links, selected states, focus. |
| **Bekaa sun** | `sun`, for the one celebration moment after a saved report. |
| **The three-arch window (Lebanese triple arch)** | The shape language. The tray's grab handle is a small arch. Empty states and the brand mark use a single-line arch icon. The three-level status uses three arches of rising fill. One shape, used with restraint. |
| **Arabic name** | The wordmark shows "Zahle Building Registry" with **زحلة** beside it in IBM Plex Sans Arabic, in the top-left. |
| **Poetry** | Short, human lines in empty states and the "Waiting for OEA approval" screen. Two or three lines in the whole app, never decoration. |

Rules for the Zahle theme: no stock "Lebanese" clichés (no cedar tree, no flag colours, no ornament patterns, no illustrations of people or buildings). No textures or patterns on surfaces, except the one functional hatch for "not yet inspected" (section 1). If a Zahle idea does not carry meaning, leave it out.

## 3. Colours

Light and warm. Dark text is a deep slate, never pure black.

| Token | Hex | Zahle name | Use |
|---|---|---|---|
| `ground` | `#F7F6F2` | Limestone | Page background behind trays |
| `surface` | `#FFFFFF` | | Trays, cards, inputs |
| `surface-soft` | `#F1EFEA` | | Hover rows, secondary buttons |
| `border` | `#E6E3DC` | | Fine 1px borders (Raycast precision) |
| `text` | `#1F2A37` | | Main text |
| `text-muted` | `#5B6472` | | Secondary text. Must pass 4.5:1 on white |
| `accent` | `#2F7CF6` | Berdawni | Main buttons, links, selected states |
| `accent-soft` | `#E6F0FE` | | Selected backgrounds, focus glow |
| `sun` | `#FFC94D` | Bekaa sun | Celebration moment only |

Share of the screen: about 60% ground and map, 30% trays and surfaces, 10% accent and status colours.

### Building status colours (owner decision, 16 Nov 2026: the worst rating is **red**)

`plan.md` section 4b defines three ratings: **green** (good), **yellow** (needs some work), **red** (imminent risk). The owner first chose no red (option A), then reversed it on 16 Nov 2026: **the worst rating is red on screen**, so engineers read it the way they already know the post-earthquake tags. This reverses the earlier "no red" rule, which now applies to everything else: no red for errors, buttons or decoration. Wording stays by meaning ("Good condition", "Needs some work", "Imminent risk"), from `docs/engineering.md` D4:

| Rating (data) | Colour | Hex | Zahle name |
|---|---|---|---|
| `green` | Green | `#1FA971` | Vine |
| `yellow` | Amber | `#F5A524` | Apricot |
| `red` | Red | `#D6402B` | Roof tile |
| none | Grey with fine hatch | `#A3A8B3` | Limestone grey ("Not yet inspected"). The hatch is described in section 1. |
| (Claude's flag, not a rating) | Orange | `#F07B2E` | Claude orange. Pulsing ring around a flagged building on the engineer map. |

The red hex is a starting point. The coder checks it against the amber and the orange (they must be easy to tell apart, in lightness as well as hue, and for colour-blind users) and adjusts it if not. Errors in forms keep the dark orange text they have now, never red, so red always means "imminent risk" and nothing else.

Status colours differ in lightness as well as hue. They always come with their word (rule 1 of `plan.md` section 4), and with the arch icon: one, two or three filled arches. Text on a status colour is dark slate unless white passes 4.5:1. Wording for each rating comes from `docs/engineering.md` D4, never from this file.

**Claude's flag is a second, separate signal.** A flagged building gets the orange pulsing ring on top of its rating colour. It never replaces the rating, and it always opens a tray with Claude's reason and evidence. The pulse stops under reduced motion (a steady ring instead).

**Resident map:** the resident's own building is drawn in full status colour. Every other building is barely visible: a faint outline only, no fill, not even grey. A resident never sees another building's status or any Claude flag.

## 4. Type

| Role | Font | Notes |
|---|---|---|
| Headings | Inter Tight, 600 | |
| Display moments | Source Serif 4, 500 | Titles on sign-up and waiting screens, empty-state lines, the building heading in the preview tray. Nowhere else. |
| Micro-labels | Inter, 600, 13px, uppercase, letter-spacing 0.08em | Section names inside trays |
| Body and UI | Inter, 400 and 500 | |
| Numbers | Inter with tabular numbers | Dates, years, counts |
| Arabic | IBM Plex Sans Arabic | Names, observations, the wordmark |

Scale: 13 / 15 / 17 / 20 / 24 / 32 px. At most 3 sizes on one screen. Weights 400, 500, 600 only. `dir="auto"` on text inputs and on any user text. The UI stays in English.

## 5. Shape and depth

- Radius: trays 24px, cards 16px, buttons and inputs 12px, chips 999px.
- Depth: 1px `border` first, then a soft shadow. Shadow alpha stays **below 0.08** (for example `0 8px 32px rgba(31, 42, 55, 0.07)`), never a hard drop-shadow.
- A list or table sits in a bordered panel with hairline row dividers. It is never bare text on the ground.
- 8px spacing rhythm (4px for tight details). Touch targets at least 44px.
- The tray grab handle is a small arch, 40px wide.

## 6. Motion

Use the Motion library (`motion`) for springs. This is the owner's call, and it overrides the generic "no spring" default in the VectorLab motion skill.

| Token | Setting | Use |
|---|---|---|
| `spring-tray` | stiffness 400, damping 34 | Trays opening, closing, changing height |
| `spring-snappy` | stiffness 600, damping 38 | Buttons, toggles, chips |
| `spring-gentle` | stiffness 220, damping 28 | Map fly-to, larger moves |
| `fade-fast` | 150ms, ease-out | Content changing inside a tray |
| `press` | scale to 0.97 on press, spring back | Every button |

Patterns:
- **Trays morph, they do not swap.** The tray changes height smoothly (preview to maximized and back). The old content fades out and the new fades in. Use Motion layout animations, so the work is done with transforms and stays smooth on phones.
- **Things come from where they were touched.** The tray rises from the bottom. The map flies to a tapped building with `spring-gentle`. The map must not move on its own unless the tray would cover the building.
- Lists stagger in by 30ms per item, at most 8.
- **One** celebration: after a report is saved, a checkmark pops with a `sun` highlight. Once per save, nothing more.
- Every animation shows where something came from or went. No decoration-only motion. No looping motion on static screens.
- **Reduced motion:** when the system asks for it, use instant changes or simple fades. No springs, no stagger, no fly-to animation.

## 7. Screens and components

### Layout
- Full-screen light map. The tray floats at the bottom on phones, and bottom-left on desktop (max width 440px).
- Top bar: wordmark with **زحلة** on the left. On the right: the signed-in person's name and a menu with "Log out". There is no role switch: the role (engineer or resident) comes from the account, and each role sees its own map and trays (owner decision, 16 Nov 2026).
- Map tiles are muted and light. The map stays quiet; the trays carry the personality.
- Buildings: grey by default. After a report, the building takes its rating colour (section 3), with a thin white outline so shapes stay readable.

### The building tray (the heart of the app)
1. **Preview.** Tap a building and a small tray springs up: the status chip with its word and arch icon, the date of the latest report, the first line of the final observation, or "Not yet inspected". Two buttons: "View history" and "Create report".
2. **Maximized.** A maximize control expands the tray (spring-tray) into a full view with two tabs, **History** and **Create report**. The selected tab indicator slides with `spring-snappy`. Minimize returns to the preview.
3. **History.** Clean rows, Raycast-style, newest first: date, engineer name and discipline, status chip, first line of the final observation. Opening a row shows the report read-only, in the same layout as the form.
4. **Create report.** (Owner, 17 Nov 2026; replaces the earlier wizard-free form.) Maximize fills the whole map. One calm page, like an iPhone: a top bar with back and "Save report"; the rating as three big chips near the top, choosable at any time; date, residents and construction date as compact rows; then roof, columns, foundations and final as plain text areas with a small "Not inspected" toggle. Short labels only, no help text or examples, and one line by the rating: "Used for triage after an earthquake." Only the rating is required; Save is enabled as soon as a rating is chosen. No progress line.
5. **Saved.** The celebration moment, the tray returns to the preview, and the building changes colour on the map.

### Sign-up, waiting and login
- Calm, centred card on `ground`, with the wordmark. Visible labels on every field. No icons inside inputs.
- No "demo" notice anywhere in the app. The owner does not want "This is a demo" text unless they ask for it.
- **Waiting for OEA approval:** the arch icon, the exact text from `docs/engineering.md` D9.3, and a "Refresh" button. After Refresh, the tray carries the engineer straight into the map with the fading welcome line.

### Command bar (from Raycast)
Ctrl+K or Cmd+K, or a search button, opens a command bar to find a building by street, neighbourhood or landmark (OpenStreetMap has few addresses in Zahle, see `plan.md` section 9). Results are clean rows: name, muted detail line, keyboard navigation, highlighted row. Choosing one flies the map there. In scope now (`plan.md` item 22). For engineers it also takes a plain-language question (item 21), and shows results as a list tray plus highlights on the map, with a one-line reason per building.

### "Is this your building?" tray (plan item 11)
On open, if the person allows location, a tray rises with the closest building highlighted, two alternatives as clean rows, and "None of these — pick on the map". The map flies to the closest with `spring-gentle`. Location denied: go straight to "Pick your building on the map". More than about 20 km from Zahle: offer a visitor "Try the demo as a resident standing on [a real Zahle street]", with a visible "Demo location" label. That label and the "Demo code" on the phone-verification screen are the only demo wording allowed in the app, because the owner asked for them.

### Resident screens (plan items 12 to 15)
- **Verify your phone:** a calm card, visible labels, the 6-digit code in separate boxes with big touch targets. The public site shows "Demo code: ######" on screen instead of texting.
- **Resident tray:** the own building's status chip, then "Request an inspection" and "Add to the building log". After a request, the only message is "Received — an engineer will review."
- **Building log:** clean rows, newest first, with photos as small thumbnails and "when did you notice it" as a muted detail line.

### Engineer screens for Claude (plan items 16 to 19)
- **Flag tray:** Claude's report with the reason, the evidence, and the rules used, then two clear buttons, "Flag was right" and "Not needed", and an optional note. A small line shows "Flags confirmed: X%".
- **Labels:** each resident submission shows Claude's label as a chip with its reason. Overriding is one tap. "Unwise" items sit in a held list with the reason, never removed.
- **Rulebook page:** a bordered list with rule text, kind, status, score, and Approve and Reject on candidates that need an engineer.

### States every screen needs
- **Loading:** nothing under 100ms, a small inline spinner up to 1s, skeleton rows beyond that.
- **Empty:** one friendly line and one action. Example, for a building with no history: "No reports yet. Create the first one."
- **Errors:** never blame the user, and always offer a way to recover. Example: "We could not save this report. Your answers are still here. Save report again".

## 8. Words
- Calm, accurate, kind. Rating wording comes from `docs/engineering.md`.
- Buttons start with a verb: "Save report", "Create report", "Log in", "Refresh". Never "OK" or "Submit".

## 9. Skills to use
- **While building:** frontend-design, make-interfaces-feel-better, web-animation-design, emil-design-engineering, and VectorLab's motion, transitions, typography, spacing, colour-palette, anti-slop, viewports, forms, keyboard, labels.
- **Before calling a screen done:** ui-design-review (review), and VectorLab's ux-audit.
- **Weekly:** full-audit.
- Where a skill's generic default disagrees with this file (for example, spring motion), this file wins.

## 10. Definition of "beautiful" for this project
A screen is done when:
1. It has no black, nothing gloomy, no red except the "Imminent risk" rating (section 3), and it feels like Zahle (section 2) without clichés.
2. Opening, closing and changing a tray feels springy and smooth, like Family.
3. Lists and spacing are crisp and precise, like Raycast.
4. It passes ui-review and ux-audit with no major issues.
5. It works on a phone at 375px width, with no sideways scrolling.
6. Arabic text displays and types correctly, right to left.
7. Colour is never the only signal.
8. With reduced motion on, nothing springs.

## 11. Anti-slop rules (from the owner, plus the VectorLab skill)
No purple-blue gradient washes. No glassmorphism or backdrop blur. No emoji as icons. No cards with a thick coloured left border. No cartoon people in empty states. No decorative pills around static text. No icons inside inputs except search and clear.

## 12. Changes from the owner's draft, and open decisions

**Update, 16 Nov 2026 (owner widened the scope, see `plan.md` items 11 to 22):** the Resident view and "Request an inspection" are **back in**, with the role coming from the account and not a switch. The Order is merged into engineers. The **public map** showing "Inspected / Not yet inspected" is **still out**: nothing is public, and a resident sees only their own building. Section 7 now describes these screens.

Still out, or changed from the owner's first draft:
- The **role switch** pill. Roles come from the account.
- Searching by **owner**. We do not store owners.
- The **AI document scan tray**. Now unblocked, because the Anthropic Console is needed anyway. Design intent: fields fill one by one with a "From document" tag. Built at plan item 5.
- The **multi-step form** (Basics, Structure, Seismic, Condition, Photos, Review). Replaced by the demo's one scrolling form (section 7). The step-tray idea returns when the fuller report is built.
- The shadow alpha, from 0.10 to under 0.08, to follow the colour-palette skill.

**Decided: the rating colours.** First option A (no red), then reversed on 16 Nov 2026: **the worst rating is red** (section 3). Wording stays by meaning, from the engineering doc. The draft's "Reinforcement recommended" is **not** used for the worst rating, because it is softer than "unsafe / imminent risk" and could mislead. Orange is now Claude's flag colour.

**Added:** the Beirut Urban Lab references (section 1), the serif display type and micro-labels (section 4), and the hatch for "not yet inspected".

## 13. UI pass, 17 Nov 2026 (owner interview; this section wins over older sections where they differ)

New references from the owner: Open Map Lebanon's Beirut Recovery Map, Beirut Urban Lab, Stamen Design and the Stamen map styles (cartography); Morcos Key, TPTQ Arabic and Kristyan Sarkis (Lebanese and Arabic type). Goal: not only pretty, but **easy to navigate, with attention drawn to the important details**.

| Topic | Decision |
|---|---|
| Direction | **Evolve.** Keep limestone ground, springy trays, green/amber/red ratings, hatch for unknown. Add stronger cartography and more editorial, bilingual type. |
| Device | Laptop first. Phone (375px) must still work well. |
| Map base | **Terrain feel, like Stamen Terrain, from a free source with no account** (for example a tinted hillshade under a pale base, or OpenTopoMap toned down). Sannine and the valley should be felt, but the map stays quiet so the footprints carry the colour. No Stadia account. |
| Attention on the engineer map | **Red (imminent risk) buildings stand out**: stronger outline, still visible when zoomed out. Everything else calmer. |
| Engineer side panel | **Removed by the owner, 17 Nov 2026; on the Later list in `plan.md`. Do not build.** Was: Laptop: a slim left panel with (1) a **status summary**: counts per rating plus "Not yet inspected", tap a count to filter the map; (2) **recent activity**: the latest 5 to 8 reports by **all engineers** (building, rating chip with word, engineer, date), click to fly there; (3) an **always-on legend** (colours, hatch, Claude's orange ring) at the bottom. The building tray opens over the panel. Phone: the panel becomes a bottom sheet. |
| Landing page (new, public) | Calm and serious, like Beirut Urban Lab. Serif headline (draft: "Every building in Zahle, remembered."), one line on the problem, a map-visual hero (terrain and footprints, no real ratings or building data), product visuals, then "Sign in as engineer" and "Sign in as resident". No photographs. No demo wording. |
| Arabic type | **Free fonts close in spirit to Lebanese type design.** A calligraphic-rooted Google font (for example Noto Naskh Arabic or Readex Pro; the coder proposes in the mockup) for the wordmark and display. IBM Plex Sans Arabic stays for body text. |
| Accent | A **deeper, calmer river blue** replaces `#2F7CF6`; it must read well on terrain and pass contrast. Exact hex chosen in the mockup. |
| Motion | Springy but restrained (section 6). One hero entrance on the landing page. Nothing loops (except Claude's flag pulse, which stops under reduced motion). |
| Process | **Owner, 17 Nov 2026 (later): no mockups.** Study the references (section 14), then the coder changes the real product in stages; the owner reviews each stage. Coder only; no devil's-advocate browser test for this pass. |

**Skills for this pass** (installed in `.claude/skills/`; this file wins on conflicts): Emil Kowalski's `emil-design-eng`, `apple-design`, `animate`, `choreograph`, `gestures`, `mobile-native`, `break-ui`; Benji Taylor's `stageshow` (product visuals on the landing page); Leon Lin's `design-taste-frontend` (landing page only; ignore its photography and shader rules, we use no photos); plus section 9.

## 14. Reference study, 17 Nov 2026 (lessons for the UI pass)

Researched on 17 Nov 2026 with web fetches, searches, the public ArcGIS configuration of the Recovery Map, Stamen's open-source Terrain style files, Google Fonts metadata, and test tile requests at Zahle (33.846, 35.902). JS-only or blocked pages are marked **not verified**. Section 13 and the rules in sections 1 to 11 still apply: no photos, no glassmorphism, red only for "Imminent risk", orange only for Claude, no demo wording, no side panel.

### 14.1 Beirut Recovery Map (Open Map Lebanon, Rice Spatial Studies Lab, Beirut Urban Lab)
The Media Line article and openmaplebanon.org could not be read (403 and an expired site): **not verified**. The live map (beirutrecovery.org) is an ArcGIS Web Experience; facts below come from its public configuration.

| What we take | What we leave | Where it applies |
|---|---|---|
| A start screen before the map: "Begin Exploring", plus an "About the Map" dialog. | The disclaimer pop-up. | Landing page |
| The OEA-style survey layer uses the same grammar as ours: "Green (Inspected)", "Yellow (Restricted Use)", "Red (Unsafe)". Colour plus word, always. This confirms section 3. | Pure saturated fills (`rgb(255,3,3)`, `rgb(21,247,7)`) on a dark base map. | Engineer map, tray |
| "Unknown" is a separate legend class, drawn as a faint grey (about 25% opacity). Our hatch does this job better; keep it. | Grey outlines at 25% opacity and 0.75px: buildings blur together. | Engineer map |
| A legend widget, and "Building Filters" with "Damage:", "Heritage:", "Built in or Before:", "Built in or After:". | Many separate maps (one per data source) and a view switcher. We have one map and one record. | Engineer map (see 14.8, item 10) |
| A popup in a fixed order: building name, number, type, year built, final status ("Final Post"), structure type, survey type. | Mapillary street imagery and before/after videos (no photos). | Tray preview, report |

### 14.2 Beirut Urban Lab and Beirut Urban Observatory
Home page read as text. The Observatory (an ArcGIS Hub) and the Built Environment Database are JS-only: **not verified** this time (section 1 holds the 16 Nov browser review).

| What we take | What we leave | Where it applies |
|---|---|---|
| Platforms named by place and subject ("Beirut Built Environment Database", "Precarious Homes"). Name things plainly. | The long feed of cards. | Landing page |
| Cards always carry a date and a small category label above the title. | Social links in the header. | Report rows, history |
| Browse filters as short labelled groups ("By Year", "By type", "By Geography"). Same style as our micro-labels. | A filter panel (no side panel). | Command bar, tray |
| An institutional footer: who made it, where, how to reach them. | Logos of partners. | Landing page footer |

### 14.3 Stamen Design and Stamen Terrain
Stamen's home and work pages are thin on principles. The details below come from the "Terrain behind the scenes" and "Shadows on maps" posts and from the `stamen/terrain-classic` style files on GitHub.

| What we take | What we leave | Where it applies |
|---|---|---|
| **Layer order:** pale land (`#dee0be`), urban areas flat light grey (`#EDEDED`), hillshade on top in **multiply**, then water (`#99b3cc`), then roads, then **labels last, as a separate layer**. Data sits under the labels, never on them. | Stamen's green-yellow land tint; our land is limestone. | Engineer map, landing hero |
| **Labels:** condensed sans (PT Sans Narrow), warm dark brown (`#2e2115`), never black, with a soft white halo (1 to 2px, 70% white). Few sizes (12 to 24px). | Black administrative lines. | Map labels |
| **Shadows:** keep relief soft so steep valleys do not go black; limit relief to the area of interest; pre-render shadows for a fixed area. Stamen warns that heavy shadows are "for dawdling, not for navigation". Ours is a navigation map, so the hillshade stays quiet. | Ray-traced, dramatic shadows. | Engineer map |
| "We design from data": the footprints and ratings decide the palette, not the reverse. | Watercolour and other decorative styles. | Everywhere |

### 14.4 Morcos Key
The site lists projects only; its visual style is **not verified**. Facts come from the studio pages, press articles and Google Fonts metadata.

| What we take | What we leave | Where it applies |
|---|---|---|
| Our body font, IBM Plex Sans Arabic, is co-designed by Khajag Apelian and Wael Morcos. We already use Lebanese type; use it well. | | All Arabic text |
| Lyon Arabic (Apelian and Morcos): hierarchy in Arabic comes from a different script style or weight, not from a slanted copy of the Latin italic. **Never slant or oblique Arabic.** | Synthetic italics and fake bold on Arabic. | Wordmark, report, resident |
| Kufam (Arabic by Wael Morcos, free on Google Fonts): early Kufi forms made for signage and wayfinding. | | Possible wordmark (14.6) |

### 14.5 TPTQ Arabic and Kristyan Sarkis
Both sites are image-led. Their visual style is **not verified**. The lessons come from Sarkis's "New Lands in Arabic Type" article (Greta Arabic).

| What we take | What we leave | Where it applies |
|---|---|---|
| A modern Naskh, built from the pen, not from a square grid. Square Kufi is "strictly created for pattern-making". | Ornamental, pattern-style Arabic (section 2: no ornament). | Arabic display font |
| Arabic grows in every direction as it gets heavier: cap Arabic at weight 600. Match the two scripts by optical size and darkness, not by point size. Set the Arabic about 10 to 20% larger than the Latin next to it, then check by eye. | Matching Latin x-height mechanically. | Wordmark, bilingual labels |
| Arabic spacing changes the joins as well as the gaps: no letter-spacing on Arabic, ever (the micro-label tracking is for Latin only). | | Micro-labels, chips |

### 14.6 Base map recommendation
Tile tests at Zahle on 17 Nov 2026:

| Source | Tile URL | Terms and attribution | Zoom at Zahle | Verdict |
|---|---|---|---|---|
| OpenStreetMap standard (in use) | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | Free with "© OpenStreetMap contributors"; no bulk download; valid Referer. | Real tiles to z19 | Keep as the base, toned down |
| AWS Terrain Tiles (Mapzen, Terrarium elevation) | `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` | Open data, no key. Credit "SRTM terrain data courtesy of the U.S. Geological Survey" (Tilezen attribution list). | Elevation to z15, 404 at z16 | **Use, pre-rendered once into a hillshade image** |
| Esri World Hillshade | `https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}` | Esri Master License; keyless public use **not verified**, and reports say a licence is needed. Attribution "Powered by Esri" plus sources. | Real to z16; z17+ "Map data not yet available" | Fallback only |
| Esri World Terrain Base, Shaded Relief | `.../World_Terrain_Base/...`, `.../World_Shaded_Relief/...` | As above | Placeholder from z15 | Reject |
| OpenTopoMap | `https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png` | CC BY-SA; "Map data: © OpenStreetMap contributors, SRTM, map style: © OpenTopoMap (CC-BY-SA)" | To z17 | Reject: loud colours, its own black buildings fight our footprints |
| CARTO Positron (light_nolabels) | `https://{s}.basemaps.cartocdn.com/light_nolabels/...` | **Now returns an "API KEY REQUIRED" tile** | None without key | Reject |
| OpenFreeMap Positron (vector) | `https://tiles.openfreemap.org/styles/positron` | No key, no limits stated; credit OpenFreeMap, OpenMapTiles, OpenStreetMap | Vector to z14, overzooms | Stage 2 option: needs MapLibre and the RTL plugin |
| Stadia Stamen Terrain | | Needs a Stadia account for a public domain; owner said no | | Reject |

**Recommendation (stage 1):** OSM base, toned down, plus a pre-rendered Zahle hillshade on top in multiply.
1. A small script, run once, fetches the Terrarium tiles for the Zahle bounds at z14 or z15 and renders a hillshade (light from the north-west, 315°, altitude 45°, gentle vertical exaggeration). It saves `public/map/hillshade-zahle.webp`. There is no runtime dependency, no key, and the licence is clean.
2. Leaflet: an `imageOverlay` in its own pane between the tiles and the footprints, with `mix-blend-mode: multiply; opacity: 0.4` (tune from 0.3 to 0.5). Under the hillshade, set `.leaflet-tile-pane { filter: grayscale(1) sepia(0.12) brightness(1.06) contrast(0.85); opacity: 0.75 }` so the tiles become limestone grey. Footprints stay outside every filter, so they carry the only strong colour.
3. Fade the hillshade out at the edge of the Zahle bounds (a soft mask), as Stamen does at a watershed edge.
4. Attribution: "© OpenStreetMap contributors · Terrain: SRTM (USGS) via Mapzen".
5. Stage 2 (owner decides): OpenFreeMap Positron restyled in limestone, with labels in a separate pane **above** the footprints, as Stamen does.

### 14.7 Arabic display font recommendation

| Font (Google Fonts) | Designers | Character | Fit |
|---|---|---|---|
| **Markazi Text** | Borna Izadpanah, Fiona Ross, Florian Runge | Contemporary Naskh with contrast, editorial; weights 400 to 700 | **Recommended.** Calligraphic, like Greta Arabic and Lyon Arabic; pairs with Source Serif 4. |
| Kufam | Wael Morcos (Arabic), Artur Schmal | Early Kufi, condensed, for signage | Alternative: direct Morcos Key link, sign-like wordmark |
| Readex Pro | Thomas Jockin, Nadine Chahine and others | Low-contrast Kufi-style sans for readability | Too close to IBM Plex; no display voice |
| Noto Naskh Arabic | Google | Neutral Naskh | Safe but generic |
| Amiri | Khaled Hosny | Classical book Naskh | Too traditional and ornate at UI sizes |
| Reem Kufi, Alexandria, El Messiri | Hosny/Orozco; Gaber | Geometric or rounded Kufi | Read as tech or poster, not Zahle |
| Lalezar, Marhey | Izadpanah; Syamsi/Arifin | Heavy or playful display | Too loud or informal |

Use Markazi Text 500 for **زحلة** in the wordmark and for Arabic in display moments only (landing headline, empty-state lines). Load only the Arabic subset. Keep IBM Plex Sans Arabic for all body text, names and observations.

### 14.8 River blue candidates
The current `#2F7CF6` gives only **3.94:1** with white text, so it fails 4.5:1 today.

| Candidate | White text on it | On `ground` | On `surface-soft` | Note |
|---|---|---|---|---|
| **A `#2563A6`** (Berdawni deep) | 6.15:1 | 5.69:1 | 5.35:1 | Closest to the current hue (211°); still friendly |
| **B `#1E5A8C`** (Berdawni dusk) | 7.25:1 | 6.70:1 | 6.31:1 | **Recommended.** Calmer, slightly greener (207°), reads as river water on warm terrain; also works as small link text |

New `accent-soft`: `#E8EFF7` (main text on it 12.5:1; A on it 5.31:1; B on it 6.26:1).

### 14.9 Top 10 changes for the coder, in priority order
1. **New accent.** Replace `#2F7CF6` with the blue the owner picks (B recommended) in tokens, the selected outline and the focus ring; `accent-soft` becomes `#E8EFF7`.
2. **Red stands out.** Red footprints: full opacity, a 2px outline in `#8F2A1C` (7.7:1 on `ground`), drawn in their own pane above all other footprints. Below z16, add a centroid dot (8px, red with a white ring) so red buildings stay visible zoomed out. Green and amber fills drop to about 0.7 opacity, with a 1px darker outline of their own hue instead of white.
3. **Selected building is unmistakable.** A 3px accent outline with a 2px white outer halo, raised to the top. While a tray is open, other footprints dim slightly (about −25% opacity). Red stays at full strength.
4. **Terrain base map** as in 14.6, stage 1: toned OSM, pre-rendered hillshade in multiply, edge fade, new attribution.
5. **Unknowns read as "no data" at every zoom.** Keep the hatch at z16 and above. Below z16, test whether the hatch turns to noise; if it does, bring the owner a choice (for example a flat pale grey with a dashed outline). Do not change it without the owner.
6. **Labels above the data.** Street, neighbourhood and river names must never be covered by footprints: warm dark-brown text with a white halo, as Stamen does. In stage 1, keep footprints semi-opaque where OSM labels sit. In stage 2, use a separate label pane. Bilingual place labels (English over Arabic) are a stage 2 option.
7. **Tray preview hierarchy.** Status chip with word and arches first and largest, then building name or number, then year built and the latest report date (tabular numbers), then one line of observation. Same fixed order everywhere, as on the Recovery Map popups.
8. **Arabic type.** Markazi Text 500 for زحلة and the Arabic display lines; no letter-spacing, slant or synthetic bold on Arabic; Arabic about 10 to 20% larger than the Latin beside it; weight capped at 600.
9. **Landing page.** A start screen before the map, like "Begin Exploring": serif headline, bilingual wordmark, one line on the problem, a hero of the hillshade with grey footprints only (no ratings, no building data), a short "About the registry" block, and an institutional footer. No disclaimer, no demo wording.
10. **Owner decisions to bring, not build.** (a) A compact, collapsible map key in a corner (colours, hatch, Claude's ring). The side panel's legend was removed with the panel. (b) A command-bar command "Show imminent risk" that lists red buildings and flies to the one chosen, like the Recovery Map's "Damage:" filter. Recommend both, as they serve navigation without a panel.

### 14.10 Owner decisions on section 14 (17 Nov 2026)
- **Accent:** `#1E5A8C` (Berdawni dusk). `accent-soft` `#E8EFF7`. Replaces `#2F7CF6` in section 3.
- **Base map:** OSM toned to limestone grey plus the pre-rendered Zahle hillshade (14.6, stage 1). Esri is not used.
- **Arabic display font:** Markazi Text 500 (14.7). IBM Plex Sans Arabic stays for body.
- **Map key:** yes, a small collapsible key in a map corner: green, amber, red with their words, the hatch for "Not yet inspected". Claude's orange ring is added to the key only when flags exist. Collapses to one button.
- Still open: the "Show imminent risk" command (14.9, 10b).
