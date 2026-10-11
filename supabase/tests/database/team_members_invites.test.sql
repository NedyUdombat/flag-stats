begin;
select plan(10);

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
insert into public.teams (id, name, slug, claimed_at) values
  ('00000000-0000-0000-0000-0000000000b1', 'Test FC',  'test-fc',  now()),
  ('00000000-0000-0000-0000-0000000000b2', 'Shell FC', 'shell-fc', null);
insert into public.user_roles (user_id, role, team_id)
  values ('00000000-0000-0000-0000-0000000000a1', 'team_admin', '00000000-0000-0000-0000-0000000000b1');
-- adjust if your athlete triggers need more columns
insert into public.athletes (id, full_name, slug, profile_user_id, claimed_at, visibility, created_by) values
  ('00000000-0000-0000-0000-0000000000c2', 'Claimed One', 'claimed-one',
   '00000000-0000-0000-0000-0000000000a2', now(), 'public', '00000000-0000-0000-0000-0000000000a2');
insert into public.athletes (id, full_name, slug, created_by) values
  ('00000000-0000-0000-0000-0000000000c3', 'Unclaimed Two', 'unclaimed-two', '00000000-0000-0000-0000-0000000000a1');
insert into public.invitations (id, type, email, token_hash, team_id, athlete_id, expires_at) values
  ('00000000-0000-0000-0000-0000000000d1', 'team_join', 'a2@t.test', 'h-join',
   '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c2', now() + interval '1 day');
insert into public.invitations (id, type, email, token_hash, team_id, expires_at) values
  ('00000000-0000-0000-0000-0000000000d2', 'team_claim', 'a3@t.test', 'h-claim',
   '00000000-0000-0000-0000-0000000000b2', now() + interval '1 day');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a3');
select throws_like($$select public.accept_invitation('00000000-0000-0000-0000-0000000000d1')$$,
  '%isn''t for the account%', 'wrong account cannot accept a join invite');
select lives_ok($$select public.accept_invitation('00000000-0000-0000-0000-0000000000d2')$$,
  'invitee claims the shell');
select throws_ok($$select public.create_team_admin_invitation('00000000-0000-0000-0000-0000000000b1','x@t.test','h',now() + interval '1 day')$$,
  '42501', 'forbidden', 'non-admin of team cannot invite admins');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select throws_ok($$select public.create_team_admin_invitation('00000000-0000-0000-0000-0000000000b1','a1@t.test','h',now() + interval '1 day')$$,
  'P0001', 'already_admin', 'cannot invite an existing admin');
select throws_ok($$select public.add_team_member('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000c2')$$,
  'P0001', 'use_invitation', 'claimed athletes need an invitation');
select lives_ok($$select public.add_team_member('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000c3')$$,
  'creator adds own unclaimed athlete');
select throws_ok($$insert into public.team_members (team_id, athlete_id) values ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000c2')$$,
  '42501', null, 'no direct inserts into team_members');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2');
select lives_ok($$select public.accept_invitation('00000000-0000-0000-0000-0000000000d1')$$,
  'athlete accepts team_join');

reset role;
select is((select claimed_at is not null from public.teams where id = '00000000-0000-0000-0000-0000000000b2'), true,
  'shell is claimed after accept');
select is((select status from public.team_members
            where team_id = '00000000-0000-0000-0000-0000000000b1' and athlete_id = '00000000-0000-0000-0000-0000000000c2'),
  'active', 'athlete is an active member');

select * from finish();
rollback;