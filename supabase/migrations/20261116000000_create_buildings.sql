-- Buildings of Zahle, copied once from OpenStreetMap.
--
-- Our own `id` is the permanent key. OpenStreetMap ids change when people edit
-- the map, so `osm_id` is kept only as a reference to where the outline came from.

create extension if not exists postgis with schema extensions;

create table public.buildings (
  id          uuid primary key default gen_random_uuid(),
  outline     extensions.geometry(MultiPolygon, 4326) not null,
  location    extensions.geometry(Point, 4326)
              generated always as (extensions.st_pointonsurface(outline)) stored,
  osm_id      text unique,
  created_at  timestamptz not null default now()
);

comment on table  public.buildings          is 'Building outlines of Zahle, copied once from OpenStreetMap.';
comment on column public.buildings.outline  is 'Footprint polygon (WGS 84).';
comment on column public.buildings.location is 'Representative point inside the outline, used to place the building.';
comment on column public.buildings.osm_id   is 'Source OpenStreetMap element, e.g. way/123. Reference only, never used as a key.';

create index buildings_outline_idx  on public.buildings using gist (outline);
create index buildings_location_idx on public.buildings using gist (location);

-- Nothing is public. The browser never talks to the database directly;
-- the app server reads through the secret key, which bypasses RLS.
alter table public.buildings enable row level security;
revoke all on public.buildings from anon, authenticated;
