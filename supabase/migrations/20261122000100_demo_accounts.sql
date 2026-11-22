-- Stand-in accounts (owner, 22 Nov 2026). While login is frozen, every report
-- saved from a map is signed by that map's account (src/lib/maps.ts). The
-- password hash is random bytes with no known password, so nobody can sign in
-- as either one.

insert into public.engineers (username, password_hash, full_name, discipline, contact, oea_number, approved_at)
values
  ('demo-engineer',
   'scrypt$16384$8$1$p39chuuf4jAc2ZxPVDa9FA==$j9QjHve1FCXXvg5ZlA2L1QK5Y2jNR/GvyLvnlUZ+PqGBw3gxQIiSBQNna/0u/SYvE8jFO7WMM5LUhmYr30JAMw==',
   'Demo Engineer', 'civil', '+961 0000000', 'DEMO-ENG', now()),
  ('demo-emt',
   'scrypt$16384$8$1$p39chuuf4jAc2ZxPVDa9FA==$j9QjHve1FCXXvg5ZlA2L1QK5Y2jNR/GvyLvnlUZ+PqGBw3gxQIiSBQNna/0u/SYvE8jFO7WMM5LUhmYr30JAMw==',
   'Demo EMT', 'emt', '+961 0000000', 'DEMO-EMT', now())
on conflict do nothing;
