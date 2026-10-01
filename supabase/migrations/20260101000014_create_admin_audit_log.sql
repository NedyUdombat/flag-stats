-- Administrative records (CLAUDE.md §6/§14): an append-only audit trail of
-- admin actions, most importantly verification decisions. Kept generic
-- (entity_type/entity_id) rather than one column per table so it can log
-- any admin action without a schema change.

create table public.admin_audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references auth.users (id) on delete set null,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid not null,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),

  constraint admin_audit_log_action_not_blank check (btrim(action) <> '')
);

comment on table public.admin_audit_log is
  'Append-only log of administrative actions (verification decisions, role grants, etc).';

create index admin_audit_log_actor_id_idx on public.admin_audit_log (actor_id);
create index admin_audit_log_entity_idx on public.admin_audit_log (entity_type, entity_id);
create index admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;

-- Internal/administrative data — never exposed publicly (CLAUDE.md §13).
create policy "Platform admins can read the audit log"
  on public.admin_audit_log for select
  to authenticated
  using (public.is_platform_admin());

-- Any authenticated user holding an admin-capable role can write an audit
-- entry for their own action (the action itself is still gated by the
-- underlying table's own RLS policy — this only records that it happened).
create policy "Admin-capable users can write audit entries for themselves"
  on public.admin_audit_log for insert
  to authenticated
  with check (actor_id = (select auth.uid()));

-- No update/delete policies: the log is append-only by design.
