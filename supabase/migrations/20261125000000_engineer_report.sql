-- Professional engineer report (owner, 23 Nov 2026, plan.md item 27).
--
-- An engineer report keeps its existing columns (date, residents, construction
-- date, colour, and the remarks in final_observation, so the map, the tray and
-- the debrief keep working) and adds:
--   details        the structured report: identification, building description,
--                  inspection method, the 7 parts, damage, recommended actions.
--                  The app checks its shape; the database checks its size.
--   photos         every photo path in the report, in the private photo bucket.
--   report_number  ZR-<year>-<0001>, one sequence per year (Beirut time),
--                  given only to reports that have details.
-- EMT simple reports leave all three empty. Still insert-only (plan rule 5).

alter table public.reports
  add column details jsonb
    check (details is null or (jsonb_typeof(details) = 'object' and pg_column_size(details) < 120000)),
  add column photos text[] not null default '{}'
    check (cardinality(photos) <= 40),
  add column report_number text unique
    check (report_number is null or report_number ~ '^ZR-[0-9]{4}-[0-9]{4,}$');

comment on column public.reports.details is 'The structured engineer report (plan.md item 27). Null on EMT simple reports and early reports.';
comment on column public.reports.photos is 'Paths of every photo in the report, in the assessment-photos bucket.';
comment on column public.reports.report_number is 'ZR-<year>-<0001>, one sequence per year. Only engineer reports with details.';

-- Save one report. Same as 20261118000100_report_freedom, plus details, photos,
-- the report number and the building's location (GPS) stored in the details.
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
  v_building    public.buildings;
  v_existing    public.reports;
  v_latest      public.reports;
  v_new         public.reports;
  v_changed     boolean;
  v_reason      text := nullif(btrim(p->>'construction_change_reason'), '');
  v_details     jsonb := case when jsonb_typeof(p->'details') = 'object' then p->'details' end;
  v_photos      text[] := coalesce(
                  (select array_agg(x) from jsonb_array_elements_text(
                     case when jsonb_typeof(p->'photos') = 'array' then p->'photos' else '[]'::jsonb end) x),
                  '{}');
  v_point       extensions.geometry;
  v_year        text;
  v_number      text;
begin
  select * into v_engineer from public.engineers where id = p_engineer_id and approved_at is not null;
  if not found then
    raise exception 'NOT_APPROVED';
  end if;

  select * into v_building from public.buildings where id = v_building_id for update;
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

  if v_details is not null then
    -- The location comes from the building, never from the request.
    v_point := coalesce(v_building.location, extensions.st_pointonsurface(v_building.outline));
    v_details := v_details - 'gps' || jsonb_build_object('gps', jsonb_build_object(
      'lat', round(extensions.st_y(v_point)::numeric, 6),
      'lng', round(extensions.st_x(v_point)::numeric, 6)));

    -- One sequence per year; the lock keeps two saves from taking the same number.
    perform pg_advisory_xact_lock(hashtext('public.reports.report_number'));
    v_year := to_char(now() at time zone 'Asia/Beirut', 'YYYY');
    select 'ZR-' || v_year || '-' || lpad((coalesce(max(substring(report_number from 9)::integer), 0) + 1)::text, 4, '0')
      into v_number
    from public.reports
    where report_number like 'ZR-' || v_year || '-%';
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
    colour, details, photos, report_number
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
    (p->>'colour')::public.condition_colour, v_details, v_photos, v_number
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
