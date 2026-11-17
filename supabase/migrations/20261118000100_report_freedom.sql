-- Report redesign (owner, 17 Nov 2026; plan.md section 7, item 4): the report
-- gives the engineer maximum freedom. Only the rating is required. The four
-- observations, the "Not inspected" reasons and the construction-date change
-- reason are optional, with no minimum length. Maximum lengths stay, to protect
-- the system.
--
-- Everything else is kept as it was: the append-only triggers, the report date
-- limits, residents 0 to 1000, the construction date rules, the stale-prefill
-- check, the rate limits, and the record of every construction-date change
-- (now with an optional reason).

-- One observation area is one of:
--   a written observation: observation 1 to 2000 characters after trim, no reason;
--   "Not inspected": observation null, reason 0 to 300 characters after trim
--     ('' means not inspected, no reason given);
--   no remarks: both null.
-- The *_complete constraints on public.reports call this function, so they are
-- relaxed by replacing it. Existing rows already meet the stricter rule.
create or replace function public.is_valid_observation(observation text, not_inspected_reason text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when not_inspected_reason is not null
      then observation is null and char_length(btrim(not_inspected_reason)) <= 300
    when observation is not null
      then char_length(btrim(observation)) between 1 and 2000
    else true
  end;
$$;

comment on function public.is_valid_observation(text, text) is
  'An observation area: written text (1 to 2000 characters), "Not inspected" with an optional reason (up to 300), or no remarks (both null).';

-- The reason for a construction-date change is optional. The previous value,
-- the new value, who and when are still always kept.
alter table public.construction_date_changes
  alter column reason drop not null,
  drop constraint construction_date_changes_reason_check,
  add constraint construction_date_changes_reason_check
    check (reason is null or char_length(btrim(reason)) between 1 and 300);

comment on column public.construction_date_changes.reason is
  'Why the engineer changed the construction date. Optional: null when no reason was given.';

-- Save one report. Same as before, except a changed construction date no
-- longer needs a reason (CHANGE_REASON_REQUIRED is gone). An empty reason is
-- stored as null.
--
-- Errors (message text): NOT_APPROVED, BUILDING_NOT_FOUND, RATE_LIMITED,
-- FUTURE_DATE, STALE_PREFILL. Check constraints catch everything else.
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

revoke all on function public.create_report(jsonb, uuid, text)    from public, anon, authenticated;
grant execute on function public.create_report(jsonb, uuid, text) to service_role;
