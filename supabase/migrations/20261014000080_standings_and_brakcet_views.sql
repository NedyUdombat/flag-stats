-- 056: standings and bracket are computed on read from fixtures + results.
-- Nothing is stored, so nothing can drift. Verified results only; voided and
-- cancelled fixtures excluded; points from the tournament's win/draw/loss.

drop view if exists public.tournament_standings;

-- One row per team per verified match (home and away perspective).
create view public.fixture_team_results
with (security_invoker = true) as
select f.id as fixture_id, f.tournament_id, f.stage_id,
       f.home_team_id as team_id, f.away_team_id as opponent_id,
       r.home_score as points_for, r.away_score as points_against,
       case when r.home_score > r.away_score then t.points_win
            when r.home_score = r.away_score then t.points_draw
            else t.points_loss end as table_points
from public.fixtures f
join public.results r on r.fixture_id = f.id and r.verification_status = 'approved'
join public.tournaments t on t.id = f.tournament_id
where f.voided_at is null and f.status <> 'cancelled'
union all
select f.id, f.tournament_id, f.stage_id,
       f.away_team_id, f.home_team_id,
       r.away_score, r.home_score,
       case when r.away_score > r.home_score then t.points_win
            when r.away_score = r.home_score then t.points_draw
            else t.points_loss end
from public.fixtures f
join public.results r on r.fixture_id = f.id and r.verification_status = 'approved'
join public.tournaments t on t.id = f.tournament_id
where f.voided_at is null and f.status <> 'cancelled';

-- Raw table per stage (+ group). Ranking with tie-breakers is done in
-- src/features/structure/standings.rank.ts.
create view public.tournament_standings
with (security_invoker = true) as
with stage_teams as (
  select s.tournament_id, s.id as stage_id, tr.team_id, null::text as group_label
  from public.tournament_stages s
  join public.tournament_registrations tr
    on tr.tournament_id = s.tournament_id and tr.status = 'approved'
  where s.stage_type = 'round_robin'
  union
  select f.tournament_id, f.stage_id, f.home_team_id, null::text
  from public.fixtures f
  join public.tournament_stages s on s.id = f.stage_id and s.stage_type = 'round_robin'
  where f.voided_at is null and f.status <> 'cancelled'
  union
  select f.tournament_id, f.stage_id, f.away_team_id, null::text
  from public.fixtures f
  join public.tournament_stages s on s.id = f.stage_id and s.stage_type = 'round_robin'
  where f.voided_at is null and f.status <> 'cancelled'
  union
  select s.tournament_id, s.id, st.team_id, st.group_label
  from public.tournament_stages s
  join public.tournament_stage_teams st on st.stage_id = s.id
  where s.stage_type = 'group'
)
select x.tournament_id, x.stage_id, x.group_label, x.team_id,
       tm.name as team_name, tm.slug as team_slug, tm.logo_url,
       count(r.fixture_id)::int as games_played,
       (count(*) filter (where r.points_for > r.points_against))::int as wins,
       (count(*) filter (where r.points_for = r.points_against))::int as draws,
       (count(*) filter (where r.points_for < r.points_against))::int as losses,
       coalesce(sum(r.points_for), 0)::int as points_for,
       coalesce(sum(r.points_against), 0)::int as points_against,
       (coalesce(sum(r.points_for), 0) - coalesce(sum(r.points_against), 0))::int as point_differential,
       coalesce(sum(r.table_points), 0)::int as standings_points
from stage_teams x
join public.teams tm on tm.id = x.team_id
left join public.fixture_team_results r
  on r.stage_id = x.stage_id and r.team_id = x.team_id
group by x.tournament_id, x.stage_id, x.group_label, x.team_id, tm.name, tm.slug, tm.logo_url;

-- Knockout matchups. Scores/winner only once verified.
create view public.tournament_bracket
with (security_invoker = true) as
select f.id as fixture_id, f.tournament_id, f.stage_id, f.round, f.match_no,
       f.scheduled_at, f.status::text as status,
       f.home_team_id, ht.name as home_team_name, ht.slug as home_team_slug, ht.logo_url as home_logo_url,
       f.away_team_id, aw.name as away_team_name, aw.slug as away_team_slug, aw.logo_url as away_logo_url,
       case when r.verification_status = 'approved' then r.home_score end as home_score,
       case when r.verification_status = 'approved' then r.away_score end as away_score,
       case when r.verification_status = 'approved' then
         case when r.home_score > r.away_score then f.home_team_id else f.away_team_id end
       end as winner_team_id
from public.fixtures f
join public.tournament_stages s on s.id = f.stage_id and s.stage_type = 'knockout'
join public.teams ht on ht.id = f.home_team_id
join public.teams aw on aw.id = f.away_team_id
left join public.results r on r.fixture_id = f.id
where f.voided_at is null and f.status <> 'cancelled';

grant select on public.fixture_team_results, public.tournament_standings,
  public.tournament_bracket to anon, authenticated;