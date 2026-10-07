-- =============================================================================
-- Migration 27: federation (organization) profile fields
--
-- Adds the governing-body fields from the admin redesign. `organizations` is
-- publicly readable: public-safe data only — no personal contact details
-- (secretariat email/phone/address would need a private table with scoped
-- RLS). Existing RLS on `organizations` covers the new columns.
-- Idempotent: safe to re-run.
-- =============================================================================

alter table public.organizations
  add column if not exists acronym                text,
  add column if not exists founded_year           smallint,
  add column if not exists affiliation_scope      text,
  add column if not exists region                 text,
  add column if not exists headquarters_city      text,
  add column if not exists parent_organization_id uuid
    references public.organizations (id) on delete set null,
  add column if not exists president_name         text,
  add column if not exists rulebook               text;

do $$ begin
  alter table public.organizations add constraint organizations_acronym_check
    check (acronym is null or acronym ~ '^[A-Z0-9-]{2,12}$');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.organizations add constraint organizations_founded_year_check
    check (founded_year is null or founded_year between 1900 and 2100);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.organizations add constraint organizations_affiliation_scope_check
    check (affiliation_scope is null or affiliation_scope in
      ('national', 'regional', 'continental', 'international'));
exception when duplicate_object then null; end $$;

-- A body can't be its own parent. (Longer cycles aren't blocked here; the
-- form only offers other bodies, and hierarchies are shallow in practice.)
do $$ begin
  alter table public.organizations add constraint organizations_parent_not_self_check
    check (parent_organization_id is null or parent_organization_id <> id);
exception when duplicate_object then null; end $$;

create index if not exists organizations_parent_idx on public.organizations (parent_organization_id);