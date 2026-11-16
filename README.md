# Zahle Building Registry

A lasting record of every building in Zahle, Lebanon, made by and for civil engineers, so the next inspection never starts from scratch.

**Live demo:** https://zahle-registry.vercel.app

> Work in progress. A portfolio demo; a full README with screenshots comes later.

## Stack

- **Next.js + React** (TypeScript, App Router), styled with Tailwind CSS
- **Leaflet** with OpenStreetMap tiles; building outlines copied once from OpenStreetMap into our own database
- **Supabase** (Postgres + PostGIS) for data and photos
- **Vercel** for hosting
- **Claude API** for reading old paper documents (planned)

## Run locally

```bash
npm install
# .env.local (never committed):
#   SUPABASE_URL=https://<project-ref>.supabase.co
#   SUPABASE_SECRET_KEY=<secret key, server only>
npm run dev
```

Database schema lives in `supabase/migrations`. To copy building outlines for central Zahle from OpenStreetMap (safe to re-run):

```bash
npm run import:buildings
```

Map data &copy; [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
