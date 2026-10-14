begin;
select plan(13);

create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000a2', 'a2@t.test', now()),
  ('00000000-0000-0000-0000-0000000000a3', 'a3@t.test', now());
insert into public.profiles (id) values
  ('00000000-0000-0000-0000-0000000000a2'), ('00000000-0000-0000-0000-0000000000a3') on conflict do nothing;
insert into public.leagues (id, name, slug, claimed_at)
  values ('00000000-0000-0000-0000-0000000000e1', 'Test League', 'test-league', now());
insert into public.teams (id, name, slug, claimed_at)
  values ('00000000-0000-0000-0000-0000000000b1', 'Team One', 'team-one', now());
insert into public.user_roles (user_id, role, team_id)
  values ('00000000-0000-0000-0000-0000000000a2', 'team_admin', '00000000-0000-0000-0000-0000000000b1');
insert into public.athletes (id, full_name, slug, gender, date_of_birth, visibility) values
  ('00000000-0000-0000-0000-0000000000c1', 'Ada One',     'ada-one',     'female', '2000-01-01', 'public'),
  ('00000000-0000-0000-0000-0000000000c2', 'Bola Okafor', 'bola-okafor', 'female', '2001-01-01', 'private'),
  ('00000000-0000-0000-0000-0000000000c3', 'Chi Eze',     'chi-eze',     'female', (current_date - interval '15 years')::date, 'private');
insert into public.tournaments (id, league_id, name, slug, format, gender_category, season, start_date, end_date, status, roster_limit)
  values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 'Cup', 'cup-053', '5v5', 'mixed', '2026', '2026-12-01', '2026-12-02', 'registration_open', 3);
insert into public.tournament_registrations (id, tournament_id, team_id, status)
  values ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000b1', 'approved');
insert into public.tournament_roster_entries (registration_id, tournament_id, team_id, athlete_id, jersey_number, position, status) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c1', 10, 'QB', 'accepted'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c2', 11, 'WR', 'accepted'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c3', 12, 'DB', 'accepted');

select throws_ok($$update public.tournaments set roster_limit = 2 where id = '00000000-0000-0000-0000-0000000000f1'$$,
  'P0001', 'roster_limit_below_roster', 'the roster limit cannot drop below an existing roster');
select lives_ok($$update public.tournaments set roster_limit = 3 where id = '00000000-0000-0000-0000-0000000000f1'$$,
  'saving the same limit is fine');

set local role anon;
select is((select count(*)::int from public.public_tournament_roster('00000000-0000-0000-0000-0000000000f1')), 3,
  'anon sees the accepted roster');
select is((select display_name from public.public_tournament_roster('00000000-0000-0000-0000-0000000000f1') where jersey_number = 10),
  'Ada One', 'a public profile shows the full name');
select is((select display_name from public.public_tournament_roster('00000000-0000-0000-0000-0000000000f1') where jersey_number = 11),
  'Bola O.', 'a private adult shows first name and last initial');
select is((select display_name from public.public_tournament_roster('00000000-0000-0000-0000-0000000000f1') where jersey_number = 12),
  'C. E.', 'a private minor shows initials only');
select is((select athlete_slug from public.public_tournament_roster('00000000-0000-0000-0000-0000000000f1') where jersey_number = 11),
  null, 'masked athletes have no profile link');

reset role;
update public.tournaments set status = 'draft' where id = '00000000-0000-0000-0000-0000000000f1';
set local role anon;
select is((select count(*)::int from public.public_tournament_roster('00000000-0000-0000-0000-0000000000f1')), 0,
  'a draft tournament has no public roster');

reset role;
update public.tournaments set status = 'in_progress' where id = '00000000-0000-0000-0000-0000000000f1';
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2');
select lives_ok($$select * from public.team_rosters('00000000-0000-0000-0000-0000000000b1')$$, 'team admin lists the team rosters');
select throws_ok($$select public.delete_team_roster('00000000-0000-0000-0000-0000000000d1')$$,
  'P0001', 'roster_active', 'a roster cannot be deleted after the tournament starts');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a3');
select throws_ok($$select * from public.team_rosters('00000000-0000-0000-0000-0000000000b1')$$,
  '42501', 'forbidden', 'a stranger cannot list the team rosters');

reset role;
update public.tournaments set status = 'registration_open' where id = '00000000-0000-0000-0000-0000000000f1';
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2');
select lives_ok($$select public.delete_team_roster('00000000-0000-0000-0000-0000000000d1')$$, 'a roster can be deleted before the start');
reset role;
select is((select count(*)::int from public.tournament_roster_entries
            where registration_id = '00000000-0000-0000-0000-0000000000d1' and status <> 'withdrawn'), 0,
  'deleting a roster withdraws its entries');

select * from finish();
rollback;