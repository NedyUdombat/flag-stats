-- 1. Drop existing function
drop function if exists public.public_list_athletes(text, text, boolean, text, int, int);

-- 2. Create function matching exact database columns
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
  bio text,
  date_of_birth date,
  gender text,
  nationality text,
  home_city text,
  dominant_hand text,
  height_cm numeric,
  weight_kg numeric,
  primary_position text,
  secondary_positions text[],
  preferred_jersey_number int,
  started_playing_year int,
  social_links jsonb,
  contact_visibility text,
  visibility text,
  created_at timestamptz,
  updated_at timestamptz,
  jersey_number int,
  team_name text,
  verified boolean,
  caps int,
  touchdowns int,
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
      a.bio,
      a.date_of_birth,
      a.gender,
      a.nationality,
      a.home_city,
      a.dominant_hand,
      a.height_cm::numeric,
      a.weight_kg,
      a.primary_position,
      a.secondary_positions,
      a.preferred_jersey_number::int,
      a.started_playing_year::int,
      a.social_links,
      a.contact_visibility,
      a.visibility,
      a.created_at,
      a.updated_at,
      a.verified,
      coalesce(a.preferred_jersey_number, 0)::int as jersey_number,
      t.name as team_name,
      0::int as caps,
      0::int as touchdowns
    from public.athletes a
    left join public.team_members tm on tm.athlete_id = a.id and tm.status = 'active'
    left join public.teams t on t.id = tm.team_id
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
    f.bio,
    f.date_of_birth,
    f.gender,
    f.nationality,
    f.home_city,
    f.dominant_hand,
    f.height_cm,
    f.weight_kg,
    f.primary_position,
    f.secondary_positions,
    f.preferred_jersey_number,
    f.started_playing_year,
    f.social_links,
    f.contact_visibility,
    f.visibility,
    f.created_at,
    f.updated_at,
    f.jersey_number,
    f.team_name,
    f.verified,
    f.caps,
    f.touchdowns,
    count(*) over() as total_count
  from filtered_athletes f
  order by 
    case when p_sort = 'most_recently_verified' then f.created_at end desc nulls last,
    case when p_sort = 'name_asc' then f.full_name end asc,
    case when p_sort = 'most_caps' then f.caps end desc,
    case when p_sort = 'most_touchdowns' then f.touchdowns end desc,
    f.created_at desc
  limit p_limit offset p_offset;
end;
$$;

grant execute on function public.public_list_athletes(text, text, boolean, text, int, int) to anon, authenticated;