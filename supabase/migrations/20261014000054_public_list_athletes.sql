create or replace function public.public_list_athletes(
  p_q text default null,
  p_position text default null,
  p_verified_only boolean default false,
  p_sort text default 'most_recently_verified',
  p_limit int default 12,
  p_offset int default 0
)
returns table (
  id uuid,
  full_name text,
  slug text,
  photo_url text,
  primary_position text,
  jersey_number int,
  team_name text,
  verified boolean,
  caps bigint,
  touchdowns bigint,
  total_count bigint
) language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with filtered_athletes as (
    select 
      a.id,
      a.full_name,
      a.slug::text,
      a.photo_url,
      a.primary_position,
      a.verified,
      a.verified_at,
      a.created_at,
      tm.jersey_number::int,
      t.name as team_name,
      coalesce(s.caps, 0) as caps,
      coalesce(s.touchdowns, 0) as touchdowns
    from public.athletes a
    left join public.team_members tm on tm.athlete_id = a.id and tm.status = 'active'
    left join public.teams t on t.id = tm.team_id
    left join (
      select 
        athlete_id, 
        count(distinct fixture_id) as caps, 
        sum(touchdowns) as touchdowns
      from public.athlete_game_stats
      group by athlete_id
    ) s on s.athlete_id = a.id
    where a.deleted_at is null
      and (a.visibility = 'public' or a.visibility is null)
      and (p_q is null or a.full_name ilike '%' || p_q || '%')
      and (p_position is null or p_position = 'All positions' or a.primary_position = p_position)
      and (not p_verified_only or a.verified = true)
  )
  select 
    f.id,
    f.full_name,
    f.slug,
    f.photo_url,
    f.primary_position,
    f.jersey_number,
    f.team_name,
    f.verified,
    f.caps,
    f.touchdowns,
    count(*) over() as total_count
  from filtered_athletes f
  order by 
    case when p_sort = 'most_recently_verified' then f.verified_at end desc nulls last,
    case when p_sort = 'name_asc' then f.full_name end asc,
    case when p_sort = 'most_caps' then f.caps end desc,
    case when p_sort = 'most_touchdowns' then f.touchdowns end desc,
    f.created_at desc
  limit p_limit offset p_offset;
end;
$$;

-- Grant execution permissions to public/authenticated users
grant execute on function public.public_list_athletes(text, text, boolean, text, int, int) to anon, authenticated;