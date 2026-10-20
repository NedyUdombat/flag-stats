begin;
select plan(14);

-- fixtures of the test: runs as the superuser, RLS bypassed
insert into public.leagues (id, name, slug) values
  ('00000000-0000-0000-0000-0000000000a1', 'Test League', 'test-league-055');
insert into public.teams (id, name, slug) values
  ('00000000-0000-0000-0000-0000000000b1', 'Alpha', 'alpha-055'),
  ('00000000-0000-0000-0000-0000000000b2', 'Bravo', 'bravo-055'),
  ('00000000-0000-0000-0000-0000000000b3', 'Charlie', 'charlie-055');
insert into public.tournaments (id, league_id, name, slug, season, start_date, end_date,
                                format, gender_category, status, points_win, points_draw, points_loss)
values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1',
        'T055', 't055', '2026', '2026-11-01', '2026-11-02',
        (select key from public.ref_formats limit 1),
        (select key from public.ref_gender_categories limit 1), 'in_progress', 3, 1, 0);

-- 1-3 seeding trigger + defaults
select is((select count(*)::int from public.tournament_stages
           where tournament_id = '00000000-0000-0000-0000-0000000000c1'), 1,
          'new tournament gets one default stage');
select is((select stage_type from public.tournament_stages
           where tournament_id = '00000000-0000-0000-0000-0000000000c1'), 'round_robin',
          'default stage is round_robin');
select is((select structure_template from public.tournaments
           where id = '00000000-0000-0000-0000-0000000000c1'), 'league',
          'default structure is league');

-- 4-5 fixture defaults to first stage; foreign stage rejected
insert into public.fixtures (id, tournament_id, home_team_id, away_team_id, scheduled_at) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1',
   '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2', now()),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000c1',
   '00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b3', now()),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000c1',
   '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b3', now());
select isnt((select stage_id from public.fixtures
             where id = '00000000-0000-0000-0000-0000000000d1'), null,
            'fixture with no stage is assigned one');
select throws_ok(
  $$insert into public.fixtures (tournament_id, stage_id, home_team_id, away_team_id, scheduled_at)
    values ('00000000-0000-0000-0000-0000000000c1', gen_random_uuid(),
            '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2', now())$$,
  'invalid_stage', 'stage must belong to the fixture tournament');

-- 6-9 standings: A beat B 10-4 (approved), B drew C 6-6 (approved), A v C pending
insert into public.results (fixture_id, home_score, away_score, verification_status) values
  ('00000000-0000-0000-0000-0000000000d1', 10, 4, 'approved'),
  ('00000000-0000-0000-0000-0000000000d2', 6, 6, 'approved'),
  ('00000000-0000-0000-0000-0000000000d3', 20, 0, 'pending');

select is((select standings_points from public.tournament_standings where team_slug = 'alpha-055'), 3,
          'winner gets points_win; pending result ignored');
select is((select standings_points from public.tournament_standings where team_slug = 'bravo-055'), 1,
          'draw gives points_draw');
select is((select point_differential from public.tournament_standings where team_slug = 'alpha-055'), 6,
          'point differential counts verified results only');
select is((select games_played from public.tournament_standings where team_slug = 'charlie-055'), 1,
          'games played counts verified results only');

-- 10 voided fixture excluded
update public.fixtures set voided_at = now(), void_reason = 't'
where id = '00000000-0000-0000-0000-0000000000d1';
select is((select standings_points from public.tournament_standings where team_slug = 'alpha-055'), 0,
          'voided fixture is excluded from standings');

-- 11-12 structure function: not allowed without permission, locked once in progress
select throws_ok(
  $$select public.set_tournament_structure('00000000-0000-0000-0000-0000000000c1', 'knockout')$$,
  'forbidden', 'anonymous caller cannot change structure');
select is((select count(*)::int from public.tournament_stage_teams), 0, 'stage teams start empty');

-- 13-14 knockout cannot tie (switch the stage type, then try a tied score)
update public.tournament_stages set stage_type = 'knockout'
where tournament_id = '00000000-0000-0000-0000-0000000000c1';
select throws_ok(
  $$update public.results set home_score = 5, away_score = 5
    where fixture_id = '00000000-0000-0000-0000-0000000000d2'$$,
  'knockout_tie', 'knockout result cannot be tied');
update public.results set home_score = 7, away_score = 5
where fixture_id = '00000000-0000-0000-0000-0000000000d2';
select is((select winner_team_id from public.tournament_bracket
           where fixture_id = '00000000-0000-0000-0000-0000000000d2'),
          '00000000-0000-0000-0000-0000000000b2'::uuid,
          'bracket shows the winner of a verified result');

select * from finish();
rollback;