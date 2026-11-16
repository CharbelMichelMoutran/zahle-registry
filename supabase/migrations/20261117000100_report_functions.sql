-- Server-only functions for reports. Callable only with the secret (service_role) key.

-- Latest report colour per building, for the map. Latest = newest report date,
-- then newest save time. Buildings with no report are absent (shown grey).
create or replace function public.building_colours()
returns json
language sql
stable
set search_path = ''
as $$
  select coalesce(json_agg(json_build_object('id', l.building_id, 'colour', l.colour)), '[]'::json)
  from (
    select distinct on (r.building_id) r.building_id, r.colour
    from public.reports r
    order by r.building_id, r.report_date desc, r.created_at desc
  ) l;
$$;

-- Save one report in a single transaction.
--
-- p: the validated report (see src/lib/report.ts), including
--   building_id, client_request_id, based_on_report_id (the report the
--   construction date was prefilled from, or null) and construction_change_reason.
-- p_ip_hash: hashed visitor IP, for rate limiting.
--
-- Errors (message text): BUILDING_NOT_FOUND, RATE_LIMITED, STALE_PREFILL,
-- FUTURE_DATE, CHANGE_REASON_REQUIRED. Check constraints catch everything else.
create or replace function public.create_report(p jsonb, p_ip_hash text)
returns jsonb
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_building_id uuid := (p->>'building_id')::uuid;
  v_existing    public.reports;
  v_latest      public.reports;
  v_new         public.reports;
  v_changed     boolean;
  v_reason      text := nullif(btrim(p->>'construction_change_reason'), '');
begin
  -- A repeated submit of the same form returns the report already saved.
  select * into v_existing from public.reports where client_request_id = (p->>'client_request_id')::uuid;
  if found then
    return jsonb_build_object('report', to_jsonb(v_existing), 'duplicate', true);
  end if;

  -- Lock the building so two saves for it cannot race on the construction date.
  perform 1 from public.buildings where id = v_building_id for update;
  if not found then
    raise exception 'BUILDING_NOT_FOUND';
  end if;

  -- Basic rate limits: per visitor, and for the whole demo.
  if (select count(*) from public.report_rate_limits
      where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 10
     or (select count(*) from public.reports where created_at > now() - interval '1 day') >= 300 then
    raise exception 'RATE_LIMITED';
  end if;

  -- Latest day anywhere on Earth (UTC+14), so a valid local "today" is never rejected.
  if (p->>'report_date')::date > (now() at time zone 'Pacific/Kiritimati')::date then
    raise exception 'FUTURE_DATE';
  end if;

  select * into v_latest from public.reports
  where building_id = v_building_id
  order by report_date desc, created_at desc
  limit 1;

  -- The form must have been prefilled from the report that is still the latest.
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
    building_id, client_request_id, engineer_name, engineer_contact, report_date,
    residents_count, residents_not_verified,
    construction_year, construction_month, construction_approximate, construction_not_verified,
    roof_observation, roof_not_inspected_reason,
    columns_observation, columns_not_inspected_reason,
    foundations_observation, foundations_not_inspected_reason,
    final_observation, final_not_inspected_reason,
    colour
  ) values (
    v_building_id, (p->>'client_request_id')::uuid, p->>'engineer_name', p->>'engineer_contact', (p->>'report_date')::date,
    (p->>'residents_count')::integer, (p->>'residents_not_verified')::boolean,
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

  insert into public.report_rate_limits (ip_hash) values (p_ip_hash);
  delete from public.report_rate_limits where created_at < now() - interval '1 day';

  return jsonb_build_object('report', to_jsonb(v_new), 'duplicate', false);
end;
$$;

revoke all on function public.building_colours()             from public, anon, authenticated;
revoke all on function public.create_report(jsonb, text)     from public, anon, authenticated;
grant execute on function public.building_colours()          to service_role;
grant execute on function public.create_report(jsonb, text)  to service_role;
