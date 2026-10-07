begin;
select plan(10);

-- Fixtures: runs as postgres, so RLS and the guard trigger are bypassed
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'owner@test.dev'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'stranger@test.dev'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'creator@test.dev'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'private@test.dev');

insert into public.athletes (id, full_name, slug, profile_user_id, created_by, visibility) values
  ('11111111-1111-1111-1111-111111111111', 'Owned Athlete', 'owned-athlete',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'public'),
  ('22222222-2222-2222-2222-222222222222', 'Unclaimed Athlete', 'unclaimed-athlete',
   null, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'public'),
  ('33333333-3333-3333-3333-333333333333', 'Private Athlete', 'private-athlete',
   'dddddddd-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'private');

insert into public.athlete_private (athlete_id, contact_phone)
values ('11111111-1111-1111-1111-111111111111', '+2348000000000');

-- 1. A stranger's update is silently ignored (RLS filters the row out)
reset role;
set local request.jwt.claims to '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';
set local role authenticated;
update public.athletes set bio = 'hacked' where id = '11111111-1111-1111-1111-111111111111';
reset role;
select is((select bio from public.athletes where id = '11111111-1111-1111-1111-111111111111'),
  null, '1. stranger cannot edit another athlete''s profile');

-- 2. The owner can edit their own profile
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
set local role authenticated;
update public.athletes set bio = 'Hello' where id = '11111111-1111-1111-1111-111111111111';
reset role;
select is((select bio from public.athletes where id = '11111111-1111-1111-1111-111111111111'),
  'Hello', '2. owner can edit own profile');

-- 3. The owner cannot self-verify
set local role authenticated;
select throws_ok(
  $$update public.athletes set verified = true where id = '11111111-1111-1111-1111-111111111111'$$,
  'P0001', 'verified is managed by the system', '3. owner cannot set verified');

-- 4. The owner cannot hand the profile to someone else
select throws_ok(
  $$update public.athletes set profile_user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    where id = '11111111-1111-1111-1111-111111111111'$$,
  'P0001', 'Profiles can only be claimed through an invitation', '4. cannot reassign ownership');

-- 5. The creator can edit while the profile is unclaimed
reset role;
set local request.jwt.claims to '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}';
set local role authenticated;
update public.athletes set bio = 'fixed typo' where id = '22222222-2222-2222-2222-222222222222';
reset role;
select is((select bio from public.athletes where id = '22222222-2222-2222-2222-222222222222'),
  'fixed typo', '5. creator can edit an unclaimed profile');

-- 6. After it is claimed, the creator loses access
update public.athletes set profile_user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  where id = '22222222-2222-2222-2222-222222222222';
set local role authenticated;
update public.athletes set bio = 'creator still editing' where id = '22222222-2222-2222-2222-222222222222';
reset role;
select is((select bio from public.athletes where id = '22222222-2222-2222-2222-222222222222'),
  'fixed typo', '6. creator cannot edit after the profile is claimed');

-- 7. Anonymous visitors cannot see private profiles
set local role anon;
select is((select count(*) from public.athletes where id = '33333333-3333-3333-3333-333333333333'),
  0::bigint, '7. private profile hidden from the public');
reset role;

-- 8. Under-18 public profiles need parental consent
select throws_ok(
  $$insert into public.athletes (full_name, slug, date_of_birth, visibility)
    values ('Kid', 'kid-athlete', current_date - interval '10 years', 'public')$$,
  'P0001', 'Parental consent is required before a profile for someone under 18 can be public',
  '8. minor needs consent to be public');

-- 9. A stranger cannot read the phone number
set local request.jwt.claims to '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';
set local role authenticated;
select is((select count(*) from public.athlete_private), 0::bigint, '9. stranger cannot read private details');
reset role;

-- 10. The owner can read it
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
set local role authenticated;
select is((select count(*) from public.athlete_private), 1::bigint, '10. owner can read own private details');
reset role;

select * from finish();
rollback;