begin;
select plan(9);

insert into auth.users (id, email, email_confirmed_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'creator@test.dev', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'invitee@test.dev', now()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'other@test.dev', now());

insert into public.athletes (id, full_name, slug, created_by, visibility, date_of_birth) values
  ('11111111-1111-1111-1111-111111111111', 'Claim Me', 'claim-me',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'private', '2000-01-01');

insert into public.invitations (id, type, email, token_hash, athlete_id, invited_by, expires_at) values
  ('99999999-9999-9999-9999-999999999991', 'athlete_claim', 'invitee@test.dev', 'hash-ok',
   '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now() + interval '1 day');

-- 1. a stranger cannot see an unclaimed private athlete
set local request.jwt.claims to '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}';
set local role authenticated;
select is((select count(*) from public.athletes where id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, '1. stranger cannot see the unclaimed private profile');

-- 2. wrong email cannot accept
select throws_ok($$select public.accept_invitation_by_token('hash-ok')$$, 'P0001',
  'This invitation isn''t for the account you''re signed in with.', '2. wrong email is rejected');

-- 3. the preview reveals no name to the wrong account
select is((select public.preview_invitation('hash-ok') ->> 'label'), null, '3. no athlete name for the wrong account');
reset role;

-- 4. the creator sees it
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
set local role authenticated;
select is((select count(*) from public.athletes where id = '11111111-1111-1111-1111-111111111111'),
  1::bigint, '4. creator sees their unclaimed profile');
reset role;

-- 5. the right email accepts
set local request.jwt.claims to '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';
set local role authenticated;
select lives_ok($$select public.accept_invitation_by_token('hash-ok')$$, '5. matching email can accept');
reset role;

select is((select profile_user_id from public.athletes where id = '11111111-1111-1111-1111-111111111111'),
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '6. athlete is now claimed by the invitee');

-- 7. single use
set local role authenticated;
select throws_ok($$select public.accept_invitation_by_token('hash-ok')$$, 'P0001',
  'This invitation is no longer valid.', '7. second accept fails');
reset role;

-- 8. the creator can no longer see the claimed private profile
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
set local role authenticated;
select is((select count(*) from public.athletes where id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, '8. creator loses access to a claimed private profile');
reset role;

-- 9. expired invitations cannot be accepted
insert into public.athletes (id, full_name, slug, created_by) values
  ('22222222-2222-2222-2222-222222222222', 'Late One', 'late-one', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
insert into public.invitations (type, email, token_hash, athlete_id, invited_by, expires_at) values
  ('athlete_claim', 'other@test.dev', 'hash-old', '22222222-2222-2222-2222-222222222222',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now() - interval '1 day');
set local request.jwt.claims to '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}';
set local role authenticated;
select throws_ok($$select public.accept_invitation_by_token('hash-old')$$, 'P0001',
  'This invitation is no longer valid.', '9. expired invitation is rejected');
reset role;

select * from finish();
rollback;