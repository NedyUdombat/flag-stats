-- Standings are NEVER stored — always computed from verified results
-- (CLAUDE.md §11). This view aggregates only approved results, per team,
-- per season. Wins/losses/points-for/points-against and a simple 2-1-0
-- points column are provided; exact points/tie-break rules are an open
-- product question (docs/implementation-plan.md §13) and can be adjusted
-- by editing this view alone — no data migration required either way.

create or replace view public.league_standings as
with games as (
  -- One row per team per completed, approved fixture, with that team's
  -- perspective on the score (for/against, win/loss).
  select
    f.season_id,
    r.fixture_id,
    f.home_team_id as team_id,
    r.home_score as points_for,
    r.away_score as points_against
  from public.results r
  join public.fixtures f on f.id = r.fixture_id
  where r.verification_status = 'approved'

  union all

  select
    f.season_id,
    r.fixture_id,
    f.away_team_id as team_id,
    r.away_score as points_for,
    r.home_score as points_against
  from public.results r
  join public.fixtures f on f.id = r.fixture_id
  where r.verification_status = 'approved'
)
select
  g.season_id,
  g.team_id,
  t.name as team_name,
  t.slug as team_slug,
  count(*) as games_played,
  count(*) filter (where g.points_for > g.points_against) as wins,
  count(*) filter (where g.points_for < g.points_against) as losses,
  count(*) filter (where g.points_for = g.points_against) as draws,
  sum(g.points_for) as points_for,
  sum(g.points_against) as points_against,
  sum(g.points_for) - sum(g.points_against) as point_differential,
  (count(*) filter (where g.points_for > g.points_against) * 2)
    + (count(*) filter (where g.points_for = g.points_against) * 1) as standings_points
from games g
join public.teams t on t.id = g.team_id
group by g.season_id, g.team_id, t.name, t.slug;

comment on view public.league_standings is
  'Standings computed live from approved results only. Never hardcoded (CLAUDE.md §11). Adjust points/tie-break logic here only.';

-- Views inherit the RLS of their underlying tables when queried through
-- PostgREST with security_invoker; make that explicit so this view can never
-- accidentally bypass results/fixtures/teams RLS as Postgres/Supabase
-- defaults evolve.
alter view public.league_standings set (security_invoker = true);
