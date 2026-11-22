# Zahle on Record (Zahle Building Registry)

A building registry for civil engineers in Zahle, Lebanon: a map of every building with an add-only history of inspections. A portfolio demo.

## Start of every session

1. Read `docs/STATUS.md` first: where things stand, open tasks, known bugs.
2. Read `plan.md`: the source of truth for scope, rules and decisions. If a request conflicts with it, stop and ask the owner.
3. Read `DESIGN.md` before any UI work.

## Rules for replies

- Always use the caveman skill for replies, unless the owner says "normal mode".
- Keep this file under 200 lines.

## Stack

- Next.js 16 + React 19 (TypeScript, App Router), Tailwind CSS 4. This Next.js version differs from older ones: see `AGENTS.md`.
- Leaflet with OpenStreetMap tiles. Building outlines are copied from OSM into our database.
- Supabase (Postgres + PostGIS) for data. Schema is in `supabase/migrations/`.
- Vercel for hosting. Claude API for the planned AI features.

## Run and check

```bash
npm install
npm run dev               # local site at http://localhost:3000
npm run build             # production build, also type-checks
npm run lint              # ESLint
npm run import:buildings  # copy OSM building outlines (safe to re-run)
```

There are no automated tests. Check changes in a real browser with the Playwright MCP.

Local secrets go in `.env.local` (git-ignored): `SUPABASE_URL`, `SUPABASE_SECRET_KEY`.

## How to work

The owner writes no code. They direct, decide and review.

- Do the work directly. No sub-agents unless the owner asks.
- Explain in plain words, without jargon.
- Keep `plan.md` current. When the owner decides something, update the plan and say what changed. Anything outside section 7 "In" goes on the Later list.
- Keep `docs/STATUS.md` current at the end of each work session.
- Commit locally in small steps. Push, apply migrations and deploy only when the owner says so.
- Decisions belong to the owner. Bring choices with a recommendation.
- Report honestly. If something is broken, unfinished or skipped, say so.

## Rules for everyone

- Keys and secrets never go into code or git. They live in Vercel, Supabase and `.env.local`.
- Small, clear commit messages. The repo is on the owner's GitHub (CharbelMichelMoutran) and stays private until the owner says.
- Never overwrite the record. Inspections and documents are added, never edited or deleted.
- The UI is in English. Arabic must display and type correctly, right to left.

## Tools

- `gh`, `supabase`, `vercel` command-line tools, already logged in.
- Playwright MCP, for checking the app in a real browser.
