-- Simulated engineer accounts (plan section 7, item 10; docs/engineering.md D9).
--
-- No email anywhere. Passwords are stored only as scrypt hashes, made on the app
-- server. Sessions are random tokens; only their SHA-256 hash is stored, so a
-- leaked table cannot be used to sign in. Approval is simulated: the engineer
-- presses Refresh on the waiting screen.

create type public.engineer_discipline as enum ('civil', 'structural', 'architect');

create table public.engineers (
  id             uuid primary key default gen_random_uuid(),
  username       text not null check (username ~ '^[A-Za-z0-9._-]{3,30}$'),
  password_hash  text not null check (password_hash like 'scrypt$%'),
  full_name      text not null check (char_length(btrim(full_name)) between 2 and 100),
  discipline     public.engineer_discipline not null,
  contact        text not null check (contact ~ '^[0-9 +-]{7,20}$'),
  oea_number     text not null check (oea_number ~ '^[A-Za-z0-9-]{5,12}$'),
  approved_at    timestamptz,
  created_at     timestamptz not null default now()
);

-- Usernames are not case-sensitive.
create unique index engineers_username_key on public.engineers (lower(username));

comment on table public.engineers is
  'Demo engineer accounts. Name, discipline, contact and OEA number are fixed after sign-up. Approval is simulated.';

create table public.sessions (
  token_hash   text primary key,
  engineer_id  uuid not null references public.engineers (id) on delete cascade,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null
);
create index sessions_engineer_idx on public.sessions (engineer_id);

-- Successful sign-ups per visitor (hashed IP), for rate limiting.
create table public.signup_rate_limits (
  ip_hash    text not null,
  created_at timestamptz not null default now()
);
create index signup_rate_limits_idx on public.signup_rate_limits (ip_hash, created_at desc);

-- Reports now carry a copy of who wrote them, taken from the account on the server.
-- Earlier reports keep the name and contact that were typed in; these stay empty.
alter table public.reports
  add column engineer_id         uuid references public.engineers (id),
  add column engineer_discipline public.engineer_discipline,
  add column engineer_oea_number text;

-- Account details cannot be changed: the server key may insert accounts and
-- set the approval time, nothing else. Sessions can be created and deleted (logout).
alter table public.engineers          enable row level security;
alter table public.sessions           enable row level security;
alter table public.signup_rate_limits enable row level security;

revoke all on public.engineers, public.sessions, public.signup_rate_limits
  from public, anon, authenticated, service_role;
grant select, insert on public.engineers to service_role;
grant update (approved_at) on public.engineers to service_role;
grant select, insert, delete on public.sessions, public.signup_rate_limits to service_role;

-- Approval happens once and is never undone.
create or replace function public.forbid_unapproval()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.approved_at is not null then
    raise exception 'An approved account cannot be changed.' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger engineers_approve_once
  before update on public.engineers
  for each row execute function public.forbid_unapproval();

-- Create an account in one step: rate limit, unique username, insert.
-- Errors (message text): RATE_LIMITED, USERNAME_TAKEN.
create or replace function public.create_engineer(p jsonb, p_ip_hash text)
returns uuid
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if (select count(*) from public.signup_rate_limits
      where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 5
     or (select count(*) from public.engineers where created_at > now() - interval '1 day') >= 500 then
    raise exception 'RATE_LIMITED';
  end if;

  begin
    insert into public.engineers (username, password_hash, full_name, discipline, contact, oea_number)
    values (
      p->>'username', p->>'password_hash', p->>'full_name',
      (p->>'discipline')::public.engineer_discipline, p->>'contact', p->>'oea_number'
    )
    returning id into v_id;
  exception when unique_violation then
    raise exception 'USERNAME_TAKEN';
  end;

  insert into public.signup_rate_limits (ip_hash) values (p_ip_hash);
  delete from public.signup_rate_limits where created_at < now() - interval '1 day';
  delete from public.sessions where expires_at < now();
  return v_id;
end;
$$;

-- Save one report. Same as before, except the engineer is identified by the
-- server from the session and their details are copied from the account;
-- anything the browser sent about the engineer is ignored.
drop function public.create_report(jsonb, text);

create or replace function public.create_report(p jsonb, p_engineer_id uuid, p_ip_hash text)
returns jsonb
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_building_id uuid := (p->>'building_id')::uuid;
  v_engineer    public.engineers;
  v_existing    public.reports;
  v_latest      public.reports;
  v_new         public.reports;
  v_changed     boolean;
  v_reason      text := nullif(btrim(p->>'construction_change_reason'), '');
begin
  select * into v_engineer from public.engineers where id = p_engineer_id and approved_at is not null;
  if not found then
    raise exception 'NOT_APPROVED';
  end if;

  perform 1 from public.buildings where id = v_building_id for update;
  if not found then
    raise exception 'BUILDING_NOT_FOUND';
  end if;

  -- A repeated submit of the same form returns the report already saved.
  select * into v_existing from public.reports
  where client_request_id = (p->>'client_request_id')::uuid and building_id = v_building_id;
  if found then
    return jsonb_build_object('report', to_jsonb(v_existing), 'duplicate', true);
  end if;

  -- Basic rate limits: per visitor, per engineer, and for the whole demo.
  if (select count(*) from public.report_rate_limits
      where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 10
     or (select count(*) from public.report_rate_limits
      where ip_hash = 'engineer:' || p_engineer_id and created_at > now() - interval '1 hour') >= 10
     or (select count(*) from public.reports where created_at > now() - interval '1 day') >= 300 then
    raise exception 'RATE_LIMITED';
  end if;

  if (p->>'report_date')::date > (now() at time zone 'Pacific/Kiritimati')::date then
    raise exception 'FUTURE_DATE';
  end if;

  select * into v_latest from public.reports
  where building_id = v_building_id
  order by report_date desc, created_at desc
  limit 1;

  if (v_latest.id is distinct from (p->>'based_on_report_id')::uuid) then
    raise exception 'STALE_PREFILL';
  end if;

  v_changed := v_latest.id is not null and (
       v_latest.construction_year         is distinct from (p->>'construction_year')::integer
    or v_latest.construction_month        is distinct from (p->>'construction_month')::integer
    or v_latest.construction_approximate  is distinct from (p->>'construction_approximate')::boolean
    or v_latest.construction_not_verified is distinct from (p->>'construction_not_verified')::boolean
  );
  if v_changed and v_reason is null then
    raise exception 'CHANGE_REASON_REQUIRED';
  end if;

  insert into public.reports (
    building_id, client_request_id,
    engineer_id, engineer_name, engineer_contact, engineer_discipline, engineer_oea_number,
    report_date, residents_count, residents_not_verified,
    construction_year, construction_month, construction_approximate, construction_not_verified,
    roof_observation, roof_not_inspected_reason,
    columns_observation, columns_not_inspected_reason,
    foundations_observation, foundations_not_inspected_reason,
    final_observation, final_not_inspected_reason,
    colour
  ) values (
    v_building_id, (p->>'client_request_id')::uuid,
    v_engineer.id, v_engineer.full_name, v_engineer.contact, v_engineer.discipline, v_engineer.oea_number,
    (p->>'report_date')::date, (p->>'residents_count')::integer, (p->>'residents_not_verified')::boolean,
    (p->>'construction_year')::integer, (p->>'construction_month')::integer,
    (p->>'construction_approximate')::boolean, (p->>'construction_not_verified')::boolean,
    p->>'roof_observation', p->>'roof_not_inspected_reason',
    p->>'columns_observation', p->>'columns_not_inspected_reason',
    p->>'foundations_observation', p->>'foundations_not_inspected_reason',
    p->>'final_observation', p->>'final_not_inspected_reason',
    (p->>'colour')::public.condition_colour
  )
  returning * into v_new;

  if v_changed then
    insert into public.construction_date_changes (
      building_id, report_id,
      previous_year, previous_month, previous_approximate, previous_not_verified,
      new_year, new_month, new_approximate, new_not_verified,
      reason, changed_by
    ) values (
      v_building_id, v_new.id,
      v_latest.construction_year, v_latest.construction_month,
      v_latest.construction_approximate, v_latest.construction_not_verified,
      v_new.construction_year, v_new.construction_month,
      v_new.construction_approximate, v_new.construction_not_verified,
      v_reason, v_new.engineer_name
    );
  end if;

  insert into public.report_rate_limits (ip_hash) values (p_ip_hash), ('engineer:' || p_engineer_id);
  delete from public.report_rate_limits where created_at < now() - interval '1 day';

  return jsonb_build_object('report', to_jsonb(v_new), 'duplicate', false);
end;
$$;

revoke all on function public.create_engineer(jsonb, text)          from public, anon, authenticated;
revoke all on function public.create_report(jsonb, uuid, text)      from public, anon, authenticated;
grant execute on function public.create_engineer(jsonb, text)       to service_role;
grant execute on function public.create_report(jsonb, uuid, text)   to service_role;
