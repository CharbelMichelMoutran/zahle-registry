-- Server-only helpers for reading and importing building outlines.
-- Both are callable only with the secret (service_role) key.

-- All building outlines as one GeoJSON FeatureCollection, for the map.
create or replace function public.buildings_geojson()
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

-- Import outlines from GeoJSON features: [{ "osm_id": "way/1", "geometry": {...} }, ...]
-- Re-runnable: a building already imported (same osm_id) is left untouched,
-- so our ids and everything linked to them stay stable.
create or replace function public.import_osm_buildings(features jsonb)
returns integer
language sql
volatile
set search_path = ''
as $$
  with inserted as (
    insert into public.buildings (osm_id, outline)
    select
      f->>'osm_id',
      -- Repair self-intersections and keep only the polygon parts.
      extensions.st_collectionextract(
        extensions.st_makevalid(
          extensions.st_setsrid(extensions.st_geomfromgeojson(f->>'geometry'), 4326)
        ),
        3
      )
    from jsonb_array_elements(features) as f
    on conflict (osm_id) do nothing
    returning 1
  )
  select count(*)::integer from inserted;
$$;

revoke all on function public.buildings_geojson()            from public, anon, authenticated;
revoke all on function public.import_osm_buildings(jsonb)    from public, anon, authenticated;
grant execute on function public.buildings_geojson()         to service_role;
grant execute on function public.import_osm_buildings(jsonb) to service_role;
