-- ONE-TIME CLEANUP. Owner's exception to rule 5 (23 Nov 2026, plan.md item 27):
-- the reports saved before the professional engineer report are deleted, with
-- their construction-date changes and Claude's debriefs (rewritten on the next
-- page load). EMT assessments are kept.
--
-- Not a migration: run it once, by hand, only on the owner's "go", and only
-- after `npm run backup:reports` has saved a copy. The append-only guards are
-- switched off and on again inside one transaction, so they are never off
-- for anything else.

begin;

alter table public.reports disable trigger reports_append_only;
alter table public.construction_date_changes disable trigger construction_date_changes_append_only;
alter table public.building_debriefs disable trigger building_debriefs_append_only;

delete from public.construction_date_changes;
delete from public.building_debriefs;
delete from public.reports;

alter table public.reports enable trigger reports_append_only;
alter table public.construction_date_changes enable trigger construction_date_changes_append_only;
alter table public.building_debriefs enable trigger building_debriefs_append_only;

commit;
