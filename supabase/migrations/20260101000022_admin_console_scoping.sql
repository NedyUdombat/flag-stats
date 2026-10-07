-- Supports admin-console VISIBILITY scoping ("a coach only sees the
-- athletes/team they created, a league admin's console stops at their own
-- league, a federation admin's at their own federation").
--
-- IMPORTANT DISTINCTION: this is a UX/admin-console feature, not a change
-- to the security boundary. Athletes/teams/leagues/organizations remain
-- public data — RLS is UNCHANGED, and the public site (search, homepage,
-- /athletes, /teams, /leagues, /organizations) still reads all of it, same
-- as always (see docs/permissions.md's "public data is not secret"
-- reasoning). What changes is only what an admin-console LIST VIEW shows
-- a given coach/league admin/federation admin, filtered in application
-- code (lib/auth/admin-scope.ts) — never a new RLS restriction, since
-- doing this via RLS would also have to hide these rows from the public
-- pages, which is explicitly not what's wanted here.
--
-- The only actual schema change: athletes.created_by, so "the athlete a
-- coach created" is a real, queryable fact rather than inferred from
-- roster membership alone (teams/leagues/organizations don't need an
-- equivalent column — visibility for those is derived from the admin's
-- existing role-grant scope, which is already precise).
alter table public.athletes
  add column created_by uuid references auth.users (id) on delete set null;

comment on column public.athletes.created_by is
  'Who created this athlete record — used only for admin-console visibility scoping (lib/auth/admin-scope.ts), not a security/RLS boundary. Nullable: existing rows and any future admin-created-on-someone-else''s-behalf rows may have no attributable creator.';

create index athletes_created_by_idx on public.athletes (created_by);