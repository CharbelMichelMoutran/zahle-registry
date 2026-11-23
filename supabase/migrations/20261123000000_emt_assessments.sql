-- EMT safety assessments (owner, 22 Nov 2026; plan.md item 25).
--
-- An ATC-20 style assessment saved from the EMT map: one row per visit, added
-- only, never edited or deleted (plan rule 5). The full form, with Claude's
-- suggestion beside the EMT's answer for every item, is kept in `data`; the
-- columns hold what the map and lists need. Photos live in the private
-- `assessment-photos` storage bucket; `photos` lists their paths.
--
-- Claude's debrief of a building's whole record is kept in `building_debriefs`,
-- also added only: a newer debrief is a new row.

create type public.atc_posting as enum ('inspected', 'restricted', 'unsafe');

create table public.assessments (
  id                 uuid primary key default gen_random_uuid(),
  building_id        uuid not null references public.buildings (id),
  engineer_id        uuid not null references public.engineers (id),
  inspector_name     text not null check (char_length(inspector_name) between 1 and 100),
  posting            public.atc_posting not null,
  claude_posting     public.atc_posting,
  overrode_claude    boolean not null default false,
  -- Set when the assessment stopped at a danger ("Order evacuation immediately, do not enter").
  stopped_reason     text check (stopped_reason is null or char_length(stopped_reason) <= 300),
  data               jsonb not null check (octet_length(data::text) <= 200000),
  photos             text[] not null default '{}' check (cardinality(photos) <= 60),
  client_request_id  uuid not null unique,
  created_at         timestamptz not null default now()
);

create index assessments_building_idx on public.assessments (building_id, created_at desc);
create index assessments_engineer_idx on public.assessments (engineer_id, created_at desc);

comment on table public.assessments is
  'EMT safety assessments (ATC-20 style). Added only. data holds the whole form with Claude''s suggestions.';

create table public.building_debriefs (
  id           uuid primary key default gen_random_uuid(),
  building_id  uuid not null references public.buildings (id),
  text         text not null check (char_length(text) between 1 and 1500),
  -- How many reports and assessments the debrief read, so a newer record makes it stale.
  record_count integer not null check (record_count >= 1),
  model        text not null,
  created_at   timestamptz not null default now()
);

create index building_debriefs_building_idx on public.building_debriefs (building_id, created_at desc);

-- Each Claude call from a visitor (hashed IP), for a cost limit on the open link.
create table public.claude_calls (
  ip_hash    text not null,
  kind       text not null,
  created_at timestamptz not null default now()
);
create index claude_calls_idx on public.claude_calls (ip_hash, created_at desc);

create trigger assessments_append_only
  before update or delete on public.assessments
  for each row execute function public.forbid_record_change();
create trigger assessments_no_truncate
  before truncate on public.assessments
  for each statement execute function public.forbid_record_change();
create trigger building_debriefs_append_only
  before update or delete on public.building_debriefs
  for each row execute function public.forbid_record_change();
create trigger building_debriefs_no_truncate
  before truncate on public.building_debriefs
  for each statement execute function public.forbid_record_change();

alter table public.assessments       enable row level security;
alter table public.building_debriefs enable row level security;
alter table public.claude_calls      enable row level security;

revoke all on public.assessments, public.building_debriefs, public.claude_calls
  from public, anon, authenticated, service_role;
grant select, insert on public.assessments, public.building_debriefs, public.claude_calls to service_role;

-- Map colours: the newest record of either kind. An EMT posting maps to the
-- same three colours: inspected green, restricted yellow, unsafe red.
create or replace function public.building_colours()
returns json
language sql
stable
set search_path = ''
as $$
  select coalesce(json_agg(json_build_object('id', l.building_id, 'colour', l.colour)), '[]'::json)
  from (
    select distinct on (x.building_id) x.building_id, x.colour
    from (
      select r.building_id, r.colour::text as colour, r.report_date as day, r.created_at
      from public.reports r
      union all
      select a.building_id,
             case a.posting when 'inspected' then 'green' when 'restricted' then 'yellow' else 'red' end,
             (a.created_at at time zone 'Asia/Beirut')::date,
             a.created_at
      from public.assessments a
    ) x
    order by x.building_id, x.day desc, x.created_at desc
  ) l;
$$;

-- Photos: private bucket, read and written only by our server (secret key).
-- Images only, up to 5 MB each. No delete from the app.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assessment-photos', 'assessment-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
