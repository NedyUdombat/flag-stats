begin;
select plan(5);

create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000a1', 'a1@t.test', now()),
  ('00000000-0000-0000-0000-0000000000a4', 'a4@t.test', now());
insert into public.profiles (id) values
  ('00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000a4') on conflict do nothing;
insert into public.teams (id, name, slug, claimed_at)
  values ('00000000-0000-0000-0000-0000000000b1', 'Test FC', 'test-fc', now());
insert into public.leagues (id, name, slug)
  values ('00000000-0000-0000-0000-0000000000e1', 'Test League', 'test-league');
insert into public.user_roles (user_id, role, team_id, league_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'team_admin',   '00000000-0000-0000-0000-0000000000b1', null),
  ('00000000-0000-0000-0000-0000000000a4', 'league_admin', null, '00000000-0000-0000-0000-0000000000e1');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select lives_ok($$select public.create_team_admin_invitation('00000000-0000-0000-0000-0000000000b1','x@t.test','h1', now() + interval '1 day')$$,
  'first pending admin invite');
select lives_ok($$select public.create_team_admin_invitation('00000000-0000-0000-0000-0000000000b1','y@t.test','h2', now() + interval '1 day')$$,
  'a second pending admin invite to a different email is allowed');
select lives_ok($$select public.create_team_admin_invitation('00000000-0000-0000-0000-0000000000b1','x@t.test','h3', now() + interval '1 day')$$,
  're-inviting the same email replaces the old invite');
select throws_ok($$select public.invitation_recipient('00000000-0000-0000-0000-000000000000')$$,
  '42501', null, 'authenticated users cannot read invite recipients');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a4');
select throws_ok($$insert into public.teams (name, slug) values ('Rogue', 'rogue')$$,
  '42501', null, 'league admin cannot insert a team directly');

select * from finish();
rollback;