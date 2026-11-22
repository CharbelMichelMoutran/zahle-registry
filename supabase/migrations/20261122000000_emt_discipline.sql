-- Engineer and EMT maps (owner, 22 Nov 2026).
--
-- 1. Residents are removed from the project: their tables and functions go.
-- 2. "emt" becomes a discipline, for the EMT map's stand-in account only (the
--    sign-up form still offers civil, structural and architect). A new enum
--    value cannot be used in the transaction that adds it, so the stand-in
--    accounts are added in the next migration.

drop function if exists public.resident_sign_in(text, text);
drop function if exists public.choose_resident_building(uuid, uuid);
drop function if exists public.resident_building(uuid);
drop function if exists public.resident_building_outlines();
drop table if exists public.resident_buildings;
drop table if exists public.resident_sessions;
drop table if exists public.residents;

alter type public.engineer_discipline add value if not exists 'emt';
