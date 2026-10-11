begin;
select plan(4);

create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000a1', 'a1@t.test', now()),
  ('00000000-0000-0000-0000-0000000000a2', 'a2@t.test', now());
insert into public.profiles (id) values
  ('00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000a2') on conflict do nothing;
insert into public.teams (id, name, slug, claimed_at)
  values ('00000000-0000-0000-0000-0000000000b1', 'Test FC', 'test-fc', now());
insert into public.user_roles (user_id, role, team_id)
  values ('00000000-0000-0000-0000-0000000000a1', 'team_admin', '00000000-0000-0000-0000-0000000000b1');
insert into public.athletes (id, full_name, slug, profile_user_id, claimed_at, visibility, created_by) values
  ('00000000-0000-0000-0000-0000000000c2', 'Claimed One', 'claimed-one',
   '00000000-0000-0000-0000-0000000000a2', now(), 'public', '00000000-0000-0000-0000-0000000000a2');
insert into public.invitations (type, email, token_hash, team_id, athlete_id, expires_at)
  values ('team_join', 'a2@t.test', 'h-join', '00000000-0000-0000-0000-0000000000b1',
          '00000000-0000-0000-0000-0000000000c2', now() + interval '1 day');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select is(public.athlete_in_admin_scope('00000000-0000-0000-0000-0000000000c2'), false,
  'team admin cannot see a claimed athlete before they join');

reset role;
insert into public.team_members (team_id, athlete_id)
  values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c2');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select is(public.athlete_in_admin_scope('00000000-0000-0000-0000-0000000000c2'), true,
  'team admin sees the athlete once they are an active member');

reset role;
update public.athletes set visibility = 'private' where id = '00000000-0000-0000-0000-0000000000c2';
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select is(public.athlete_in_admin_scope('00000000-0000-0000-0000-0000000000c2'), false,
  'private claimed athlete is hidden from the team admin again');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2');
select is(public.preview_invitation('h-join')->>'label', 'Test FC',
  'team_join preview shows the team name, not the athlete name');

select * from finish();
rollback;