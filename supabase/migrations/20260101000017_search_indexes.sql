-- Search optimization (CLAUDE.md/prompt 22: "Optimize database queries
-- where necessary. Add appropriate indexes."). Plain btree indexes don't
-- help a leading-wildcard ILIKE ('%term%') — pg_trgm GIN indexes do, and
-- are the standard Postgres approach for this exact query shape.

create extension if not exists "pg_trgm";

create index athletes_full_name_trgm_idx on public.athletes using gin (full_name gin_trgm_ops);
create index teams_name_trgm_idx on public.teams using gin (name gin_trgm_ops);
create index leagues_name_trgm_idx on public.leagues using gin (name gin_trgm_ops);
create index organizations_name_trgm_idx on public.organizations using gin (name gin_trgm_ops);

comment on index athletes_full_name_trgm_idx is 'Speeds up ILIKE ''%term%'' search used by features/search/services/search.service.ts.';
