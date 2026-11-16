-- Fix: check for a repeated submit after locking the building, so two
-- simultaneous submits of the same form cannot race to a unique-key error.

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
  -- Lock the building so two saves for it cannot race on the construction date.
  perform 1 from public.buildings where id = v_building_id for update;
  if not found then
    raise exception 'BUILDING_NOT_FOUND';
  end if;

  -- A repeated submit of the same form returns the report already saved.
  -- Checked after the lock, so two simultaneous submits cannot both insert.
  select * into v_existing from public.reports
  where client_request_id = (p->>'client_request_id')::uuid and building_id = v_building_id;
  if found then
    return jsonb_build_object('report', to_jsonb(v_existing), 'duplicate', true);
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
