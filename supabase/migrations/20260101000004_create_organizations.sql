-- Federations/organizations. Top of the hierarchy: an organization runs
-- zero or more leagues (CLAUDE.md §6 lists Federations/organizations and
-- Leagues as separate concepts).

create table public.organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         citext not null unique,
  country      text,
  logo_url     text,
  description  text,
  verified     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint organizations_name_not_blank check (btrim(name) <> ''),
  constraint organizations_slug_not_blank check (btrim(slug::text) <> '')
);

comment on table public.organizations is
  'National/regional federations. Public entity — every org gets a free public page (per platform overview §4.5).';

create index organizations_country_idx on public.organizations (country);

create trigger set_organizations_updated_at
  before update on public.organizations
  for each row
  execute function public.set_updated_at();

-- Now that organizations exists, wire up the FK deferred from 0003.
alter table public.user_roles
  add constraint user_roles_organization_id_fkey
  foreign key (organization_id) references public.organizations (id) on delete cascade;

alter table public.organizations enable row level security;

-- Public data (CLAUDE.md §13): anyone, including anonymous visitors, can read.
create policy "Organizations are publicly readable"
  on public.organizations for select
  to anon, authenticated
  using (true);

-- Only platform admins can create organizations (onboarding a new federation
-- is a platform-level decision for the MVP).
create policy "Platform admins can insert organizations"
  on public.organizations for insert
  to authenticated
  with check (public.is_platform_admin());

-- Platform admins, or that org's own federation_admin, can update it.
create policy "Org admins can update their organization"
  on public.organizations for update
  to authenticated
  using (public.is_platform_admin() or public.has_role('federation_admin', id))
  with check (public.is_platform_admin() or public.has_role('federation_admin', id));

create policy "Platform admins can delete organizations"
  on public.organizations for delete
  to authenticated
  using (public.is_platform_admin());
