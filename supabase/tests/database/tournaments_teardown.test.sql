begin;
select plan(9);

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
insert into public.organizations (id, name, slug) values ('00000000-0000-0000-0000-0000000000c9', 'Fed', 'fed');
insert into public.leagues (id, name, slug, organization_id, claimed_at)
  values ('00000000-0000-0000-0000-0000000000e1', 'Test League', 'test-league', '00000000-0000-0000-0000-0000000000c9', now());
insert into public.teams (id, name, slug, claimed_at) values
  ('00000000-0000-0000-0000-0000000000b1', 'Team One', 'team-one', now()),
  ('00000000-0000-0000-0000-0000000000b2', 'Team Two', 'team-two', now());
insert into public.user_roles (user_id, role, league_id, team_id, organization_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'league_admin',     '00000000-0000-0000-0000-0000000000e1', null, null),
  ('00000000-0000-0000-0000-0000000000a2', 'team_admin',       null, '00000000-0000-0000-0000-0000000000b1', null),
  ('00000000-0000-0000-0000-0000000000a3', 'federation_admin', null, null, '00000000-0000-0000-0000-0000000000c9');
insert into public.tournaments (id, league_id, name, slug, format, gender_category, season, start_date, end_date, status)
  values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 'Cup', 'cup-051', '5v5', 'mixed', '2026', '2026-12-01', '2026-12-02', 'in_progress');
insert into public.tournament_registrations (id, tournament_id, team_id, status) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000b1', 'approved'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000b2', 'approved');
insert into public.fixtures (id, tournament_id, home_team_id, away_team_id, scheduled_at) values
  ('00000000-0000-0000-0000-0000000000x1', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2', '2026-12-01 10:00+00'),
  ('00000000-0000-0000-0000-0000000000x2', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b1', '2026-12-01 12:00+00'),
  ('00000000-0000-0000-0000-0000000000x3', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2', '2026-12-02 10:00+00');
insert into public.results (fixture_id, home_score, away_score, submitted_by)
  values ('00000000-0000-0000-0000-0000000000x2', 1, 0, '00000000-0000-0000-0000-0000000000a2');