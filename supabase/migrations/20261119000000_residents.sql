-- Residents (plan.md items 12 and 15, rule 2).
--
-- Residents sign in with Supabase Auth (phone), unlike engineers, who use our own
-- login. Their data is read with their own session (publishable key + their JWT),
-- so row-level security decides what they see:
--   - their own `residents` row and their own `resident_buildings` rows;
--   - the outline of every building, geometry only, for the faint resident map;
--   - the latest rating of their own building only, never anyone else's.
-- Engineer tables (reports, engineers, sessions, rate limits, construction date
-- changes) keep RLS on with no policy for residents, and stay revoked from
-- `authenticated`, so a resident session cannot read them at all.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.residents (
  id          uuid primary key references auth.users (id),
  name        text not null check (char_length(btrim(name)) between 1 and 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.residents is
  'One row per signed-in resident, keyed by their Supabase Auth user id. The name is what they typed at sign-in.';

-- The resident's building. Added only, never edited or deleted (plan rule 5).
create table public.resident_buildings (
  id           uuid primary key default gen_random_uuid(),
  resident_id  uuid not null references public.residents (id),
  building_id  uuid not null references public.buildings (id),
  created_at   timestamptz not null default now()
);

comment on table public.resident_buildings is
  'Which building a resident lives in. Added only. The first row per resident is their building.';

create index resident_buildings_resident_idx on public.resident_buildings (resident_id, created_at, id);

create trigger resident_buildings_append_only
  before update or delete on public.resident_buildings
  for each row execute function public.forbid_record_change();
create trigger resident_buildings_no_truncate
  before truncate on public.resident_buildings
  for each statement execute function public.forbid_record_change();

-- ---------------------------------------------------------------------------
-- Row-level security: each resident sees and writes only their own rows
-- ---------------------------------------------------------------------------

alter table public.residents          enable row level security;
alter table public.resident_buildings enable row level security;

revoke all on public.residents, public.resident_buildings from public, anon, authenticated;
grant select, insert (id, name) on public.residents to authenticated;
grant update (name, updated_at) on public.residents to authenticated;
grant select, insert (resident_id, building_id) on public.resident_buildings to authenticated;
grant select on public.residents, public.resident_buildings to service_role;

create policy "Residents read their own row"
  on public.residents for select to authenticated
  using (id = (select auth.uid()));
create policy "Residents create their own row"
  on public.residents for insert to authenticated
  with check (id = (select auth.uid()));
create policy "Residents change their own name"
  on public.residents for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Residents read their own building"
  on public.resident_buildings for select to authenticated
  using (resident_id = (select auth.uid()));
create policy "Residents add their own building"
  on public.resident_buildings for insert to authenticated
  with check (resident_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Functions, called with the resident's own session
-- ---------------------------------------------------------------------------

-- Save the name typed at sign-in. Runs as the resident, so the policies above apply.
create or replace function public.save_resident_name(p_name text)
returns void
language plpgsql
volatile
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'NOT_SIGNED_IN' using errcode = 'insufficient_privilege';
  end if;
  insert into public.residents (id, name)
  values (auth.uid(), btrim(p_name))
  on conflict (id) do update set name = excluded.name, updated_at = now();
end;
$$;

-- Keep the resident's building if they have one; otherwise save this one.
-- Runs as the resident. The lock stops two tabs from saving two buildings.
create or replace function public.choose_resident_building(p_building_id uuid)
returns uuid
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_resident uuid := auth.uid();
  v_building uuid;
begin
  if v_resident is null then
    raise exception 'NOT_SIGNED_IN' using errcode = 'insufficient_privilege';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('resident_building:' || v_resident::text, 0));

  select rb.building_id into v_building
  from public.resident_buildings rb
  where rb.resident_id = v_resident
  order by rb.created_at, rb.id
  limit 1;
  if v_building is not null then
    return v_building;
  end if;

  insert into public.resident_buildings (resident_id, building_id)
  values (v_resident, p_building_id);
  return p_building_id;
end;
$$;

-- The resident's own building with its latest rating (null if not yet inspected),
-- or null if they have no building yet. Reads `reports` on the resident's behalf,
-- so it runs as the owner, but only ever for the building saved to auth.uid().
-- Returns the rating only: no remarks, engineer or other building data.
create or replace function public.my_resident_building()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'id', mine.building_id,
    'colour', (
      select r.colour
      from public.reports r
      where r.building_id = mine.building_id
      order by r.report_date desc, r.created_at desc
      limit 1
    )
  )
  from (
    select rb.building_id
    from public.resident_buildings rb
    where rb.resident_id = (select auth.uid())
    order by rb.created_at, rb.id
    limit 1
  ) mine;
$$;

-- Every building outline as GeoJSON, geometry and id only (no rating), for the
-- faint resident map. Only for a signed-in resident who has a residents row.
create or replace function public.resident_building_outlines()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'type', 'FeatureCollection',
    'features', coalesce(json_agg(
      json_build_object(
        'type', 'Feature',
        'id', b.id,
        'geometry', extensions.st_asgeojson(b.outline, 6)::json,
        'properties', json_build_object('id', b.id)
      )
      order by b.created_at, b.id
    ), '[]'::json)
  )
  from public.buildings b
  where exists (select 1 from public.residents r where r.id = (select auth.uid()));
$$;

revoke all on function public.save_resident_name(text)             from public, anon, authenticated;
revoke all on function public.choose_resident_building(uuid)       from public, anon, authenticated;
revoke all on function public.my_resident_building()               from public, anon, authenticated;
revoke all on function public.resident_building_outlines()         from public, anon, authenticated;
grant execute on function public.save_resident_name(text)          to authenticated;
grant execute on function public.choose_resident_building(uuid)    to authenticated;
grant execute on function public.my_resident_building()            to authenticated;
grant execute on function public.resident_building_outlines()      to authenticated;
