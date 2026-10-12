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
  ('00000000-0000-0000-0000-0000000000f1', 'su@t.test', now());
insert into public.profiles (id) values
  ('00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-0000000000f1') on conflict do nothing;
update public.profiles set platform_role = 'super_admin' where id = '00000000-0000-0000-0000-0000000000f1';
insert into public.organizations (id, name, slug) values ('00000000-0000-0000-0000-0000000000e9', 'Fed', 'fed');
insert into public.leagues (id, name, slug, claimed_at) values
  ('00000000-0000-0000-0000-0000000000e1', 'Test League',  'test-league',  now()),
  ('00000000-0000-0000-0000-0000000000e2', 'Shell League', 'shell-league', null);
insert into public.user_roles (user_id, role, league_id)
  values ('00000000-0000-0000-0000-0000000000a1', 'league_admin', '00000000-0000-0000-0000-0000000000e1');
insert into public.invitations (id, type, email, token_hash, league_id, expires_at)
  values ('00000000-0000-0000-0000-0000000000d3', 'league_claim', 'a2@t.test', 'h-lc',
          '00000000-0000-0000-0000-0000000000e2', now() + interval '1 day');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select throws_ok($$update public.leagues set organization_id = '00000000-0000-0000-0000-0000000000e9' where id = '00000000-0000-0000-0000-0000000000e1'$$,
  'P0001', 'protected_column', 'league admin cannot attach a federation directly');
select throws_ok($$select public.set_league_verified('00000000-0000-0000-0000-0000000000e1', true)$$,
  '42501', 'forbidden', 'league admin cannot verify');
select throws_ok($$select public.create_league('X League','x-league',null,'00000000-0000-0000-0000-0000000000e9',null)$$,
  'P0001', 'Only a federation admin can attach a league to a federation.', 'cannot attach an arbitrary federation');
select throws_ok($$select public.remove_league_admin('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000a1')$$,
  'P0001', 'last_admin', 'last league admin cannot be removed');
select lives_ok($$select public.create_league_admin_invitation('00000000-0000-0000-0000-0000000000e1','x@t.test','h1', now() + interval '1 day')$$,
  'first admin invite');
select lives_ok($$select public.create_league_admin_invitation('00000000-0000-0000-0000-0000000000e1','y@t.test','h2', now() + interval '1 day')$$,
  'second pending admin invite to another email');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2');
select lives_ok($$select public.accept_invitation('00000000-0000-0000-0000-0000000000d3')$$, 'invitee claims the shell league');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000f1');
select lives_ok($$select public.set_league_verified('00000000-0000-0000-0000-0000000000e1', true)$$, 'super admin verifies');

reset role;
select is((select claimed_at is not null from public.leagues where id = '00000000-0000-0000-0000-0000000000e2'), true,
  'shell league is claimed after accept');

select * from finish();
rollback;