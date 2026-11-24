-- Claude's confidence (owner, 23 Nov 2026, plan.md item 29): Claude's own
-- estimate, 0 to 100, of how sure it is of the posting it proposed. Null when
-- Claude was not used. A person's posting has no score. The per-item scores
-- live in `data`. Adding a column changes no saved row (rule 5).
alter table public.assessments
  add column claude_confidence smallint check (claude_confidence between 0 and 100);

comment on column public.assessments.claude_confidence is
  'Claude''s confidence (0-100) in claude_posting, its own proposal. Null when Claude was not used.';
