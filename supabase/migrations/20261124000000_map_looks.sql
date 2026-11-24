-- Map looks (owner, 23 Nov 2026, plan.md item 26): an engineer report colours
-- the whole building, an EMT posting only its outline, and green fades to dark
-- grey after 6 months. The app works out the look; this sends, per building,
-- the latest engineer report and the latest EMT posting, each with its day.
-- Read-only. building_colours() is left in place.
create or replace function public.building_map_records()
returns json
language sql
stable
set search_path = ''
as $$
  select coalesce(json_agg(json_build_object('id', b.id, 'report', r.entry, 'emt', a.entry)), '[]'::json)
  from public.buildings b
  left join lateral (
    select json_build_object('colour', r.colour::text, 'day', r.report_date, 'at', r.created_at) as entry
    from public.reports r
    where r.building_id = b.id
    order by r.report_date desc, r.created_at desc
    limit 1
  ) r on true
  left join lateral (
    select json_build_object(
             'colour', case a.posting when 'inspected' then 'green' when 'restricted' then 'yellow' else 'red' end,
             'day', (a.created_at at time zone 'Asia/Beirut')::date,
             'at', a.created_at) as entry
    from public.assessments a
    where a.building_id = b.id
    order by a.created_at desc
    limit 1
  ) a on true
  where r.entry is not null or a.entry is not null;
$$;

revoke all on function public.building_map_records() from public, anon, authenticated;
grant execute on function public.building_map_records() to service_role;
