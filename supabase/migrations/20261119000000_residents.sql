-- Residents (plan.md items 12 and 15, rule 2).
--
-- Residents sign in with our own login, like engineers. The phone number and
-- code screens are a front-end show only (owner, 17 Nov 2026): every visitor
-- is the same single resident, found by the demo phone number, and the name
-- they type is saved to that row on each login. Each browser gets its own
-- resident session.
--
-- Only our server reads these tables, with the secret key. Row-level security
-- is on with no policies and nothing is granted to `anon` or `authenticated`,
-- so the browser cannot read them at all. The server scopes every query to the
-- session's resident: their own building with its latest rating only, and the
-- outline (geometry only) of every other building.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.residents (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 100),
  phone       text not null unique check (phone ~ '^\+[0-9]{8,15}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.residents is
  'One row per resident phone number. The demo has one: +15550100000. The name is what was typed at the last login.';

-- Resident sessions, like engineer `sessions`: only the SHA-256 hash of the cookie token is stored.
create table public.resident_sessions (
  token_hash   text primary key,
  resident_id  uuid not null references public.residents (id) on delete cascade,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null
);
create index resident_sessions_resident_idx on public.resident_sessions (resident_id);

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
-- Row-level security on, no policies: only the server (secret key) reads these
-- ---------------------------------------------------------------------------

alter table public.residents          enable row level security;
alter table public.resident_sessions  enable row level security;
alter table public.resident_buildings enable row level security;

revoke all on public.residents, public.resident_sessions, public.resident_buildings
  from public, anon, authenticated;
grant select, insert on public.residents to service_role;
grant update (name, updated_at) on public.residents to service_role;
grant select, insert, delete on public.resident_sessions to service_role;
grant select, insert on public.resident_buildings to service_role;

-- ---------------------------------------------------------------------------
-- Functions, called by the server only, always with the session's resident id
-- ---------------------------------------------------------------------------

-- Log in: find (or create) the resident for this phone number and save the
-- name typed at sign-in. Also clears expired resident sessions.
create or replace function public.resident_sign_in(p_phone text, p_name text)
returns uuid
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.residents (phone, name)
  values (p_phone, btrim(p_name))
  on conflict (phone) do update set name = excluded.name, updated_at = now()
  returning id into v_id;
  delete from public.resident_sessions where expires_at < now();
  return v_id;
end;
$$;

-- Keep the resident's building if they have one; otherwise save this one.
-- The lock stops two tabs from saving two buildings.
create or replace function public.choose_resident_building(p_resident_id uuid, p_building_id uuid)
returns uuid
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_building uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('resident_building:' || p_resident_id::text, 0));

  select rb.building_id into v_building
  from public.resident_buildings rb
  where rb.resident_id = p_resident_id
  order by rb.created_at, rb.id
  limit 1;
  if v_building is not null then
    return v_building;
  end if;

  insert into public.resident_buildings (resident_id, building_id)
  values (p_resident_id, p_building_id);
  return p_building_id;
end;
$$;

-- The resident's own building with its latest rating (null if not yet inspected),
-- or null if they have no building yet. Returns `{id, colour}` only: no remarks,
-- engineer or other building data.
create or replace function public.resident_building(p_resident_id uuid)
returns json
language sql
stable
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
    where rb.resident_id = p_resident_id
    order by rb.created_at, rb.id
    limit 1
  ) mine;
$$;

-- Every building outline as GeoJSON, geometry and id only (no rating), for the
-- faint resident map.
create or replace function public.resident_building_outlines()
returns json
language sql
stable
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
  from public.buildings b;
$$;

revoke all on function public.resident_sign_in(text, text)              from public, anon, authenticated;
revoke all on function public.choose_resident_building(uuid, uuid)      from public, anon, authenticated;
revoke all on function public.resident_building(uuid)                   from public, anon, authenticated;
revoke all on function public.resident_building_outlines()              from public, anon, authenticated;
grant execute on function public.resident_sign_in(text, text)           to service_role;
grant execute on function public.choose_resident_building(uuid, uuid)   to service_role;
grant execute on function public.resident_building(uuid)                to service_role;
grant execute on function public.resident_building_outlines()           to service_role;
