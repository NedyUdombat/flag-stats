begin;
select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a1@t.test'),
  ('00000000-0000-0000-0000-0000000000a2', 'a2@t.test'),
  ('00000000-0000-0000-0000-0000000000a3', 'a3@t.test');
insert into public.profiles (id) values
  ('00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-0000000000a3') on conflict do nothing;
insert into public.teams (id, name, slug, claimed_at) values
  ('00000000-0000-0000-0000-0000000000b1', 'Test FC',  'test-fc',  now()),
  ('00000000-0000-0000-0000-0000000000b2', 'Shell FC', 'shell-fc', null);
insert into public.user_roles (user_id, role, team_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'team_admin', '00000000-0000-0000-0000-0000000000b1'),
  ('00000000-0000-0000-0000-0000000000a2', 'team_admin', '00000000-0000-0000-0000-0000000000b1');

-- as a1 (team admin)
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000a1', 'role', 'authenticated')::text, true);
set local role authenticated;

select lives_ok($$select public.remove_team_admin('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a2')$$,
  'admin can remove another admin when 2+ exist');
select throws_ok($$select public.remove_team_admin('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a1')$$,
  'P0001', 'last_admin', 'last admin cannot be removed');
select throws_ok($$update public.teams set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000b1'$$,
  'P0001', 'protected_column', 'team admin cannot set deleted_at directly');
select throws_ok($$update public.teams set slug = 'new-slug' where id = '00000000-0000-0000-0000-0000000000b1'$$,
  'P0001', 'protected_column', 'team admin cannot change slug');
select throws_ok($$select public.create_team_shell('X','x-fc')$$,
  '42501', 'forbidden', 'non-super-admin cannot create a shell');

-- as a3 (no role)
reset role;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000a3', 'role', 'authenticated')::text, true);
set local role authenticated;
select throws_ok($$select public.soft_delete_team('00000000-0000-0000-0000-0000000000b1')$$,
  '42501', 'forbidden', 'non-admin cannot soft delete');

-- anon
reset role;
set local role anon;
select is((select count(*)::int from public.teams where id = '00000000-0000-0000-0000-0000000000b1'), 1,
  'anon sees claimed team');
select is((select count(*)::int from public.teams where id = '00000000-0000-0000-0000-0000000000b2'), 0,
  'anon cannot see unclaimed shell');

select * from finish();
rollback;