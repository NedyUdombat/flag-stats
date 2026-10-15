begin;
select plan(16);

create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000a1', 'a1@t.test', now()),
  ('00000000-0000-0000-0000-0000000000a2', 'a2@t.test', now()),
  ('00000000-0000-0000-0000-0000000000a3', 'a3@t.test', now()),
  ('00000000-0000-0000-0000-0000000000a4', 'a4@t.test', now());
insert into public.profiles (id) values
  ('00000000-0000-0000-0000-0000000000a1'), ('00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-0000000000a3'), ('00000000-0000-0000-0000-0000000000a4') on conflict do nothing;
insert into public.leagues (id, name, slug, claimed_at)
  values ('00000000-0000-0000-0000-0000000000e1', 'Test League', 'test-league', now());
insert into public.teams (id, name, slug, claimed_at) values
  ('00000000-0000-0000-0000-0000000000b1', 'Team One',   'team-one',   now()),
  ('00000000-0000-0000-0000-0000000000b2', 'Team Two',   'team-two',   now()),
  ('00000000-0000-0000-0000-0000000000b3', 'Team Three', 'team-three', now());
insert into public.user_roles (user_id, role, league_id, team_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'league_admin', '00000000-0000-0000-0000-0000000000e1', null),
  ('00000000-0000-0000-0000-0000000000a2', 'team_admin', null, '00000000-0000-0000-0000-0000000000b1'),
  ('00000000-0000-0000-0000-0000000000a3', 'team_admin', null, '00000000-0000-0000-0000-0000000000b2');
insert into public.tournaments (id, league_id, name, slug, format, gender_category, season, start_date, end_date, status)
  values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 'Cup', 'cup-054', '5v5', 'mixed', '2026', '2026-12-01', '2026-12-02', 'in_progress');
insert into public.tournament_registrations (tournament_id, team_id, status) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000b1', 'approved'),
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000b2', 'approved');
insert into public.fixtures (id, tournament_id, home_team_id, away_team_id, scheduled_at)
  values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000f1',
          '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2', '2026-12-01 10:00+00');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select lives_ok($$select public.create_fixture('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000b2','2026-12-02 10:00+00')$$, 'league admin creates a fixture');
select throws_ok($$select public.create_fixture('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000b3','2026-12-02 12:00+00')$$, 'P0001', 'team_not_registered', 'both teams must be approved');
select throws_ok($$select public.create_fixture('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000b1','2026-12-02 12:00+00')$$, 'P0001', 'same_team', 'a team cannot play itself');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a4');
select throws_ok($$select public.create_fixture('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000b2','2026-12-02 14:00+00')$$, 'P0001', 'not_found', 'a stranger cannot create fixtures');
select throws_ok($$select public.submit_result('00000000-0000-0000-0000-0000000000c1', 1, 0)$$, 'P0001', 'not_found', 'a stranger cannot submit a result');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2');
select throws_ok($$select public.create_fixture('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000b2','2026-12-02 14:00+00')$$, 'P0001', 'not_found', 'team admins cannot create fixtures');
select lives_ok($$select public.submit_result('00000000-0000-0000-0000-0000000000c1', 21, 14)$$, 'team admin submits a result');
select throws_ok($$insert into public.results (fixture_id, home_score, away_score) values ('00000000-0000-0000-0000-0000000000c1', 1, 1)$$, '42501', null, 'direct writes to results are denied');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a3');
select throws_ok($$select public.submit_result('00000000-0000-0000-0000-0000000000c1', 14, 21)$$, 'P0001', 'result_locked_to_submitter', 'the other team cannot overwrite a pending result');
select lives_ok($$select public.raise_dispute('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000b2','The final score was 14 to 21, not 21 to 14.')$$, 'the other team raises a dispute');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select throws_ok($$select public.verify_result('00000000-0000-0000-0000-0000000000c1', true)$$, 'P0001', 'has_open_dispute', 'an open dispute blocks verification');
select lives_ok($$select public.resolve_dispute((select id from public.fixture_disputes where fixture_id = '00000000-0000-0000-0000-0000000000c1'), false, 'Checked the scoresheet.')$$, 'league dismisses the dispute');
select lives_ok($$select public.verify_result('00000000-0000-0000-0000-0000000000c1', true)$$, 'league verifies the result');
reset role;
select is((select status::text from public.fixtures where id = '00000000-0000-0000-0000-0000000000c1'), 'completed', 'verification completes the fixture');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2');
select throws_ok($$select public.submit_result('00000000-0000-0000-0000-0000000000c1', 5, 5)$$, 'P0001', 'result_verified', 'a verified result cannot be resubmitted');

select * from finish();
rollback;