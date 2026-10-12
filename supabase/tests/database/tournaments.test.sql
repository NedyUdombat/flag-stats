begin;
select plan(13);

create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000a1', 'a1@t.test', now()),
  ('00000000-0000-0000-0000-0000000000a2', 'a2@t.test', now()),
  ('00000000-0000-0000-0000-0000000000a3', 'a3@t.test', now());
insert into public.profiles (id) values
  ('00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-0000000000a3') on conflict do nothing;
insert into public.leagues (id, name, slug, claimed_at)
  values ('00000000-0000-0000-0000-0000000000e1', 'Test League', 'test-league', now());
insert into public.teams (id, name, slug, claimed_at) values
  ('00000000-0000-0000-0000-0000000000b1', 'Team One', 'team-one', now()),
  ('00000000-0000-0000-0000-0000000000b2', 'Team Two', 'team-two', now());
insert into public.user_roles (user_id, role, league_id, team_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'league_admin', '00000000-0000-0000-0000-0000000000e1', null),
  ('00000000-0000-0000-0000-0000000000a2', 'team_admin', null, '00000000-0000-0000-0000-0000000000b1');
insert into public.tournaments (id, league_id, name, slug, format, gender_category, season, start_date, end_date, status) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 'Draft Cup A', 'draft-cup-a', '5v5', 'mixed', '2026', '2026-12-01', '2026-12-01', 'draft'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000e1', 'Open Cup',    'open-cup',    '5v5', 'mixed', '2026', '2026-12-05', '2026-12-06', 'registration_open'),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000e1', 'Draft Cup B', 'draft-cup-b', '7v7', 'men',   '2026', '2026-12-10', '2026-12-10', 'draft');
insert into public.tournament_registrations (id, tournament_id, team_id)
  values ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000b2');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select lives_ok($$select public.create_tournament('00000000-0000-0000-0000-0000000000e1','Lagos Cup','lagos-cup-2026','5v5','mixed','open','2026','2026-11-01','2026-11-01')$$,
  'league admin creates a tournament');
select throws_ok($$update public.tournaments set status = 'in_progress' where id = '00000000-0000-0000-0000-0000000000f2'$$,
  'P0001', 'protected_column', 'status cannot be changed by direct update');
select throws_ok($$select public.set_tournament_status('00000000-0000-0000-0000-0000000000f1','in_progress')$$,
  'P0001', 'invalid_transition', 'draft cannot jump to in_progress');
select lives_ok($$select public.set_tournament_status('00000000-0000-0000-0000-0000000000f1','registration_open')$$,
  'draft opens for registration');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a3');
select throws_ok($$select public.create_tournament('00000000-0000-0000-0000-0000000000e1','Rogue Cup','rogue-cup-2026','5v5','mixed','open','2026','2026-11-01','2026-11-01')$$,
  '42501', 'forbidden', 'a stranger cannot create a tournament');
select throws_ok($$select public.request_tournament_registration('00000000-0000-0000-0000-0000000000f2','00000000-0000-0000-0000-0000000000b1')$$,
  '42501', 'forbidden', 'only team admins request registration');
select throws_ok($$select public.review_tournament_registration('00000000-0000-0000-0000-0000000000d1', true)$$,
  'P0001', 'not_found', 'a stranger cannot review registrations');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2');
select lives_ok($$select public.request_tournament_registration('00000000-0000-0000-0000-0000000000f2','00000000-0000-0000-0000-0000000000b1')$$,
  'team admin requests registration');
select throws_ok($$select public.request_tournament_registration('00000000-0000-0000-0000-0000000000f2','00000000-0000-0000-0000-0000000000b1')$$,
  'P0001', 'already_registered', 'duplicate request is refused');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select lives_ok($$select public.review_tournament_registration('00000000-0000-0000-0000-0000000000d1', true)$$,
  'league admin approves a registration');
select throws_ok($$select public.set_tournament_status('00000000-0000-0000-0000-0000000000f2','in_progress')$$,
  'P0001', 'not_enough_teams', 'a tournament needs 2 approved teams to start');

reset role;
set local role anon;
select is((select count(*)::int from public.tournaments where id = '00000000-0000-0000-0000-0000000000f3'), 0,
  'anon cannot see a draft tournament');
select is((select count(*)::int from public.tournaments where id = '00000000-0000-0000-0000-0000000000f2'), 1,
  'anon sees a published tournament');

select * from finish();
rollback;