create or replace function public.my_team_memberships()
returns table (team_id uuid, team_name text, team_slug text, logo_url text,
               athlete_id uuid, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
  select t.id, t.name, t.slug::text, t.logo_url, a.id, m.joined_at
    from public.team_members m
    join public.athletes a
      on a.id = m.athlete_id and a.profile_user_id = (select auth.uid()) and a.deleted_at is null
    join public.teams t
      on t.id = m.team_id and t.deleted_at is null and t.claimed_at is not null
   where m.status = 'active'
   order by m.joined_at desc;
$$;
revoke all on function public.my_team_memberships() from public, anon;
grant execute on function public.my_team_memberships() to authenticated;