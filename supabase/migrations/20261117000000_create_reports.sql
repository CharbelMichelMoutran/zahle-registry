-- Demo building reports (docs/engineering.md, Part A) and construction-date history.
--
-- The record is never overwritten (plan section 4, rule 5): reports and
-- construction-date changes can be added, never edited or deleted. This is
-- enforced here in the database, not only in the app.

create type public.condition_colour as enum ('green', 'yellow', 'red');

-- One observation area: either a written observation, or "Not inspected" with a reason.
create or replace function public.is_valid_observation(observation text, not_inspected_reason text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when observation is not null and not_inspected_reason is null
      then char_length(btrim(observation)) between 10 and 2000
    when observation is null and not_inspected_reason is not null
      then char_length(btrim(not_inspected_reason)) between 10 and 300
    else false
  end;
$$;

-- A construction date: a year (1800 or later, with optional month and an
-- "approximate" flag), or "Not yet verified" with nothing else.
create or replace function public.is_valid_construction_date(
  year integer, month integer, approximate boolean, not_verified boolean
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when not_verified then year is null and month is null and not approximate
    else year between 1800 and 9999 and (month is null or month between 1 and 12)
  end;
$$;

create table public.reports (
  id                               uuid primary key default gen_random_uuid(),
  building_id                      uuid not null references public.buildings (id),
  -- Sent by the browser once per form, so a double click cannot save the report twice.
  client_request_id                uuid not null unique,

  engineer_name                    text not null check (char_length(btrim(engineer_name)) between 2 and 100),
  engineer_contact                 text not null check (char_length(btrim(engineer_contact)) between 7 and 254),
  report_date                      date not null check (report_date >= date '1990-01-01'),

  residents_count                  integer check (residents_count between 0 and 1000),
  residents_not_verified           boolean not null default false,

  construction_year                integer,
  construction_month               integer,
  construction_approximate         boolean not null default false,
  construction_not_verified        boolean not null default false,

  roof_observation                 text,
  roof_not_inspected_reason        text,
  columns_observation              text,
  columns_not_inspected_reason     text,
  foundations_observation          text,
  foundations_not_inspected_reason text,
  final_observation                text,
  final_not_inspected_reason       text,

  colour                           public.condition_colour not null,
  created_at                       timestamptz not null default now(),

  constraint residents_count_or_not_verified
    check ((residents_count is null) = residents_not_verified),
  constraint construction_date_valid
    check (public.is_valid_construction_date(
      construction_year, construction_month, construction_approximate, construction_not_verified)),
  constraint construction_not_after_report
    check (construction_year is null or construction_year <= extract(year from report_date)),
  constraint roof_complete        check (public.is_valid_observation(roof_observation, roof_not_inspected_reason)),
  constraint columns_complete     check (public.is_valid_observation(columns_observation, columns_not_inspected_reason)),
  constraint foundations_complete check (public.is_valid_observation(foundations_observation, foundations_not_inspected_reason)),
  constraint final_complete       check (public.is_valid_observation(final_observation, final_not_inspected_reason))
);

comment on table public.reports is 'Demo building reports. Insert-only: never updated or deleted.';
comment on column public.reports.report_date is 'Day of the inspection, as entered by the engineer.';
comment on column public.reports.created_at is 'When the report was saved.';
comment on column public.reports.residents_count is 'People living in the building on the report date. Reported on the day, not checked.';

-- Newest first: by report date, then by save time.
create index reports_building_latest_idx on public.reports (building_id, report_date desc, created_at desc);

create table public.construction_date_changes (
  id                         uuid primary key default gen_random_uuid(),
  building_id                uuid not null references public.buildings (id),
  report_id                  uuid not null unique references public.reports (id),
  previous_year              integer,
  previous_month             integer,
  previous_approximate       boolean not null,
  previous_not_verified      boolean not null,
  new_year                   integer,
  new_month                  integer,
  new_approximate            boolean not null,
  new_not_verified           boolean not null,
  reason                     text not null check (char_length(btrim(reason)) between 10 and 300),
  changed_by                 text not null,
  changed_at                 timestamptz not null default now(),

  constraint previous_valid check (public.is_valid_construction_date(
    previous_year, previous_month, previous_approximate, previous_not_verified)),
  constraint new_valid check (public.is_valid_construction_date(
    new_year, new_month, new_approximate, new_not_verified))
);

comment on table public.construction_date_changes is
  'Every change to a building''s construction date: previous value, new value, reason, who and when. Insert-only.';

create index construction_date_changes_building_idx on public.construction_date_changes (building_id, changed_at desc);

-- Successful report saves per visitor (hashed IP), for basic rate limiting.
-- Not part of the record; old rows can be pruned.
create table public.report_rate_limits (
  ip_hash    text not null,
  created_at timestamptz not null default now()
);
create index report_rate_limits_idx on public.report_rate_limits (ip_hash, created_at desc);

-- ---------------------------------------------------------------------------
-- Append-only enforcement
-- ---------------------------------------------------------------------------

create or replace function public.forbid_record_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'The record is never overwritten: % on % is not allowed.', tg_op, tg_table_name
    using errcode = 'insufficient_privilege';
end;
$$;

create trigger reports_append_only
  before update or delete on public.reports
  for each row execute function public.forbid_record_change();
create trigger reports_no_truncate
  before truncate on public.reports
  for each statement execute function public.forbid_record_change();

create trigger construction_date_changes_append_only
  before update or delete on public.construction_date_changes
  for each row execute function public.forbid_record_change();
create trigger construction_date_changes_no_truncate
  before truncate on public.construction_date_changes
  for each statement execute function public.forbid_record_change();

-- Nothing is public; the app server reads and writes with the secret key.
-- Even that key may only read and insert.
alter table public.reports                   enable row level security;
alter table public.construction_date_changes enable row level security;
alter table public.report_rate_limits        enable row level security;

revoke all on public.reports, public.construction_date_changes, public.report_rate_limits
  from public, anon, authenticated, service_role;
grant select, insert on public.reports, public.construction_date_changes to service_role;
grant select, insert, delete on public.report_rate_limits to service_role;
