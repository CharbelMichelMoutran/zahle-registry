/**
 * Save every report, construction-date change and Claude debrief to a private
 * file on this laptop, before the one-time cleanup (owner, 23 Nov 2026,
 * plan.md item 27). The file goes in backups/, which git ignores.
 *
 *   npm run backup:reports
 */
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local");
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function all(table: string) {
  const rows: unknown[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select("*").range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

const backup = {
  saved_at: new Date().toISOString(),
  reports: await all("reports"),
  construction_date_changes: await all("construction_date_changes"),
  building_debriefs: await all("building_debriefs"),
};
mkdirSync("backups", { recursive: true });
const file = `backups/reports-${backup.saved_at.replace(/[:.]/g, "-")}.json`;
writeFileSync(file, JSON.stringify(backup, null, 2));
console.log(
  `Saved ${backup.reports.length} reports, ${backup.construction_date_changes.length} changes, ${backup.building_debriefs.length} debriefs to ${file}`,
);
