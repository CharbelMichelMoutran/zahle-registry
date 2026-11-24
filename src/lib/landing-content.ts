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
  photo: {
    src: "/landing/tripoli.webp",
    width: 1000,
    height: 1250,
    alt: "Bab al-Tabbaneh, Tripoli: a concrete building gutted in the civil war, with laundry hanging from the floors people still live on",
    credit: "Bab al-Tabbaneh, Tripoli. Photo: FunkMonk, CC BY 3.0, via Wikimedia Commons",
  },
} as const;

export const TASK = {
  index: "02",
  label: "Task",
  side: "Why Zahle",
  title: "I watched too many people be buried under rubble, and decided to rally my brightest classmates to stop this.",
  titleAccent: "This is only the beginning.",
  body: [
    "Zahle is where I was born and raised, in Rassieh. I know its streets, its stone houses and the people who would have to use this.",
    "I've worked with the Zahle municipality and the Red Cross Zahle Center, so this can actually reach the people who'd use it.",
  ],
  photo: {
    src: "/landing/zahle.webp",
    width: 627,
    height: 650,
    alt: "Zahle from the hill: red-tiled roofs filling the Berdawni valley, with snow on Mount Sannine behind",
  },
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
      screen: {
        src: "/landing/engineer-map.webp",
        width: 1600,
        height: 1200,
        alt: "The engineer map: a building posted unsafe by a volunteer, outlined on the map, with Claude's debrief of its record",
      },
    },
    {
      name: "Volunteer map",
      who: "For Red Cross volunteers, EMTs and rescuers",
      text: "Run an ATC-20 safety check on a phone, step by step. The posting outlines the building on both maps until an engineer reviews it.",
      screen: {
        src: "/landing/assessment.webp",
        width: 780,
        height: 1688,
        alt: "The volunteer's safety assessment on a phone: step 1 of 9, with the location Claude filled in from the map",
      },
    },
  ],
  nearMe: {
    label: "On a mission",
    title: "Near me.",
    text: "A volunteer team picks how long is too long: a week, a month, six months, a year. The map lists 20 buildings nobody has visited in that time, or ever, and outlines them. Nearest first, but danger pulls a building forward: one last posted unsafe counts as four times closer. A team in the street knows which door is next.",
    shot: {
      src: "/landing/near-me.webp",
      width: 780,
      height: 1688,
      alt: "The volunteer map on a phone: the nearest buildings not visited in six months, outlined in blue, and one building open",
      credit: "The volunteer map on a phone, live.",
    },
  },
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
    photo: {
      src: "/landing/damaged-building.webp",
      width: 1600,
      height: 1067,
      alt: "A damaged concrete building in Lebanon: broken walls, an exposed floor slab and rubble at its foot",
      credit: "Photo: UNDP Lebanon",
    },
    output: "Claude's sketch of this photo, as the app draws it from Claude's answer. Not retouched.",
  },
  triage: {
    title: "It reads every past report, then hands over the list.",
    text: [
      "Before anyone opens a building, Claude has read its whole record, every engineer report and every volunteer posting, and written what to do next. That line sits beside each building in the priority list.",
      "Engineers can also just ask, in plain words. Claude turns the question into filters, and the app shows exactly how it read it. Claude never sets the order: the formula below does.",
    ],
    shot: {
      src: "/landing/ask.webp",
      width: 800,
      height: 1152,
      alt: "The engineer map's Ask panel: a typed question, how Claude read it, and a ranked list with Claude's next step for the first building",
      credit: "The engineer map, live. Claude's line is its summary of the building's record.",
    },
  },
  /** The steps themselves come from src/lib/priority.ts, the formula the app runs (plan.md item 29). */
  ranking: {
    title: "How buildings are ranked.",
    lead: "One written formula orders every list in the app, from the priority list to an engineer's question. Nothing is hidden. These are its steps, in order.",
    bias: {
      title: "Where it could be unfair",
      lead: "Any ranking of people's homes can carry bias. These are the ones we know about, so nobody has to guess.",
      points: [
        { title: "It only ranks what's on record.", text: "A building nobody has inspected isn't ranked at all, so a neighbourhood that gets fewer visits shows up less. Asking for “not yet inspected” brings them back." },
        { title: "Uncounted people count for less.", text: "When nobody counted the people inside, the building ranks below one where even a few were counted. A full building nobody counted can sit below a half-empty one." },
        { title: "Claude's confidence is its own guess.", text: "It isn't a measured accuracy. It only orders buildings inside one group, and only where the volunteer agreed with Claude." },
        { title: "Near me's weights are our choice.", text: "Unsafe counts as four times closer, restricted use twice, never inspected one and a half times. Other numbers would send teams to other doors." },
        { title: "Decisions made alone go up, not down.", text: "A posting made without Claude, or against it, is checked before one Claude agreed with. A single opinion gets a second one first." },
      ],
    },
  },
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
} as const;
