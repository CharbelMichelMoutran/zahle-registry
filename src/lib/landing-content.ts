/**
 * Every word on the portfolio landing page (plan.md item 28), in reading order.
 * First person, plain and short. The owner approves each section.
 * Every number has a source in SOURCES; nothing here is invented.
 */

export const SOURCES = [
  { id: 1, label: "Amnesty International, 9 Feb 2026", url: "https://www.amnesty.org/en/latest/news/2026/02/lebanon-deadly-building-collapse-in-tripoli-must-spur-genuine-government-action/" },
  { id: 2, label: "L'Orient Today: Health Ministry toll, Feb 2026", url: "https://today.lorientlejour.com/article/1494602/bab-al-tabbaneh-incident-kills-13-confirms-health-ministry.html" },
  { id: 3, label: "Public Works Studio: building collapses in Lebanon", url: "https://publicworksstudio.com/en/buildings-collapse-in-lebanon/" },
  { id: 4, label: "LBCI: Tripoli's unsafe-buildings survey shows blind spots", url: "https://www.lbcgroup.tv/news/news-bulletin-reports/904634/tripolis-unsafe-buildings-risk-survey-shows-major-blind-spots/en" },
  { id: 5, label: "1759 Near East earthquakes", url: "https://en.wikipedia.org/wiki/1759_Near_East_earthquakes" },
  { id: 6, label: "Applied Technology Council: ATC-20", url: "https://atcouncil.org/atc-20" },
  { id: 7, label: "USGS: Loma Prieta earthquake, societal response", url: "https://www.usgs.gov/publications/loma-prieta-california-earthquake-october-17-1989-societal-response" },
] as const;

export const HERO = {
  kicker: "Zahle · Bekaa · Lebanon",
  lines: ["Every building", "in Zahle,"],
  accent: "inspected.",
  lead:
    "In Lebanon, buildings fall on the families living inside them, and almost no one has the records to see it coming. I built a shared record of every building in my hometown, and a safety check that Red Cross volunteers can run after an earthquake, with Claude beside them.",
  scroll: "Scroll",
} as const;

/** Captions on the camera flight into the city. `at` is the scroll point (0 to 1) where each one takes over. */
export const FLIGHT = [
  { at: 0, label: "33.85° N, 35.90° E", text: "Zahle, 945 m up, on the Berdawni river." },
  { at: 0.4, label: "From OpenStreetMap", text: "4,595 buildings, every one on the map." },
  { at: 0.72, label: "One building", text: "Each one keeps its whole history. Nothing is overwritten." },
] as const;

export const SITUATION = {
  index: "01",
  label: "Situation",
  side: "The problem",
  statement:
    "On 8 February 2026, a six-storey building in Bab al-Tabbaneh, Tripoli, came down on the people living in it. Thirteen died. One of them was three years old.",
  statementSource: 2,
  facts: [
    { value: "4", unit: "", text: "building collapses in Lebanon in the first five weeks of 2026.", source: 1 },
    { value: "16,000", unit: "+", text: "buildings across Lebanon estimated to be at risk of collapse.", source: 3 },
    { value: "7.4", unit: "M", text: "the 1759 earthquake that ruined the Bekaa, Zahle's valley. The faults are still there.", source: 5 },
  ],
  body: [
    "Some of the buildings that fell in Tripoli were not on any risk list. There was no money to inspect them in detail.",
    "The records that would warn us sit on paper in municipal offices, or were never made. Every engineer who inspects a building starts from zero.",
  ],
  bodySource: 4,
  photo: "Photo: a damaged building in Tripoli (free licence)",
} as const;

export const TASK = {
  index: "02",
  label: "Task",
  side: "Why Zahle",
  title: "I built this because I was tired of watching my people die under buildings.",
  body: [
    "Zahle is where I was born and raised, in Rassieh. I know its streets, its stone houses and the people who would have to use this.",
    "I've worked with the Zahle municipality and the Red Cross Zahle Center, so this can actually reach the people who'd use it.",
  ],
  photo: "Photo: Zahle from the hill, red roofs and the Berdawni valley",
  heard: {
    label: "What engineers told us",
    intro: "We talked to engineers in Lebanon before writing a line of code. They said the same three things.",
    points: [
      { title: "The records are missing.", text: "Most inspections are on paper, in an office, or nowhere." },
      { title: "Every inspection starts from scratch.", text: "The same building is checked again and again, by people who can't see the last visit." },
      { title: "A shared record would help.", text: "One place, kept by engineers, that the next engineer can read." },
    ],
  },
} as const;

export const ATC20 = {
  index: "03",
  label: "Action",
  side: "ATC-20, simply",
  title: "After an earthquake, the first question is simple: can people go back inside?",
  body: [
    "ATC-20 is how engineers in the United States have answered it since 1989. An inspector walks around the building, checks the few things that kill people (a leaning frame, broken columns, a falling facade, a shifted foundation) and puts one of three signs on the door.",
    "It was written for volunteers, and first tested after the Loma Prieta earthquake in California.",
  ],
  bodySources: [6, 7],
  placards: [
    { tone: "vine", word: "Inspected", text: "No apparent danger. People can use the building." },
    { tone: "apricot", word: "Restricted use", text: "Some danger. Enter only where and when allowed." },
    { tone: "rooftile", word: "Unsafe", text: "Do not enter. It may fall." },
  ],
  why: {
    title: "Why it saves lives",
    text: "It sorts a whole city fast. People stay out of the buildings that could fall in the aftershock, families go home to the ones that won't, and engineers go first to the worst.",
  },
} as const;

export const ADAPTED = {
  index: "04",
  label: "Action",
  side: "Made for Lebanon",
  title: "ATC-20 was written for American buildings. We rewrote it for ours.",
  steps: [
    { title: "Scene safety first", text: "Gas, fire, live wires, falling rock. If any is there, the check stops and the app orders evacuation." },
    { title: "Lebanese buildings", text: "The seven ways buildings here are actually built, from traditional stone to a concrete frame on an open ground floor, and Lebanese addresses down to the cadastral plot." },
    { title: "22 checks, each explained", text: "Every check is rated None, Moderate, Severe or Not seen, with one line saying what each level looks like. No guessing." },
    { title: "Photos at every step", text: "Outside, then inside if it's safe to go in. Claude reads every photo." },
    { title: "An actions page", text: "Shut off gas and power, call Civil Defense or an engineer, from the same phone." },
  ],
  oea: {
    label: "The missing piece",
    text: "The Order of Engineers once looked at having Red Cross volunteers do these first checks. The technology wasn't ready: a volunteer isn't a structural engineer. We built what was missing.",
  },
} as const;

export const SOLUTION = {
  index: "05",
  label: "Action",
  side: "Two maps, one record",
  title: "One record, opened from two sides.",
  maps: [
    {
      name: "Engineer map",
      who: "For civil and structural engineers",
      text: "Every building in Zahle, coloured by its last report. Open one, read its whole history, add a professional report. Nothing is ever overwritten.",
      clip: "Clip: engineer opens a building, reads its history, writes a report",
    },
    {
      name: "Volunteer map",
      who: "For Red Cross volunteers, EMTs and rescuers",
      text: "Run an ATC-20 safety check on a phone, step by step. The posting outlines the building on both maps until an engineer reviews it.",
      clip: "Clip: volunteer assessment on a phone, step by step",
    },
  ],
} as const;

export const CLAUDE = {
  index: "06",
  label: "Action",
  side: "Claude in the field",
  title: "Claude does the part a volunteer can't.",
  lead: "A volunteer can walk around a building and take photos. Reading structural damage in those photos takes an engineer's eye. That is where Claude comes in, and a person still accepts or changes every answer.",
  features: [
    { title: "Reads every photo", text: "Claude rates the damage it sees against the 22 checks, and gives one sentence the volunteer can check against the photo." },
    { title: "Guides the walk", text: "After each photo, Claude says what to photograph next, so nothing important is missed." },
    { title: "Writes the debrief", text: "Two to four lines at the top of each building's history, so the next person knows where to look." },
  ],
  sketch: {
    title: "It draws what it sees.",
    text: "For each photo, Claude draws a line sketch of the facade, the way an engineer would in a field report, and marks every damage with its check number. It draws only what is visible: no invented floors, no hidden sides.",
    photo: "Photo: a partly collapsed building in Lebanon (free licence)",
    output: "Claude's sketch of this photo: real product output, generated once the API key is set",
  },
  triage: {
    tag: "In progress",
    title: "It says how sure it is.",
    text: "Claude gives a confidence for each reading. Postings it is unsure about go to engineers first, and every correction an engineer makes is kept, so Claude gets more accurate over time.",
    placeholder: "Screen: the triage list, sorted by Claude's confidence",
  },
} as const;

export const RESULT = {
  index: "07",
  label: "Result",
  side: "What exists today",
  title: "It works today, on a phone, in Zahle.",
  numbers: [
    { value: 4595, text: "Buildings on the map" },
    { value: 22, text: "ATC-20 checks, adapted" },
    { value: 0, text: "Records ever overwritten" },
  ],
  numbersNote: "Add-only is enforced by the database itself, not just the app.",
  clip: "Clip: the map, zooming from the valley to one building's record",
  owner: {
    label: "Who could run it",
    text: "The Lebanese Red Cross is trusted in every town in Lebanon and already runs on volunteers. It could own this, train its volunteers on it, and take it from Zahle to the rest of the country.",
  },
} as const;

export const BUILT = {
  index: "08",
  label: "How it's built",
  side: "For the engineers reading",
  title: "Small stack, strict rules.",
  stack: [
    { name: "Next.js on Vercel", text: "The site, both maps and the server routes that talk to Claude." },
    { name: "Postgres + PostGIS", text: "4,595 building outlines copied from OpenStreetMap. Triggers refuse every edit and delete." },
    { name: "Claude", text: "Reads photos and returns typed answers checked against a schema, so a bad reply can't break a form." },
    { name: "Leaflet", text: "The map: building outlines on toned OpenStreetMap tiles and a hillshade of the valley." },
  ],
} as const;

export const AUTHOR = {
  label: "Made by",
  name: "Charbel Moutran",
  role: "CS student at Stanford. Born and raised in Rassieh, Zahle.",
  line: "I'm passionate about using computer science for impact in the world.",
  links: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/charbelmoutran" },
    { label: "GitHub", href: "https://github.com/CharbelMichelMoutran" },
  ],
  email: "cmoutran[at]stanford[dot]edu",
  photoAlt: "Charbel Moutran with his mother at his graduation",
} as const;

export const CLOSE = {
  title: ["A lasting record,", "made by engineers."],
  engineer: "Open the engineer map",
  volunteer: "Open the volunteer map",
  credit: "Map data © OpenStreetMap contributors · Terrain: SRTM (USGS) via Mapzen",
  sources: "Sources",
} as const;
