create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits int not null default 0
);
alter table public.rate_limits enable row level security;  -- no policies = server only

create or replace function public.check_rate_limit(
  p_key text, p_limit int, p_window_seconds int
) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_hits int;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds)
                        then now() else r.window_start end,
    hits = case when r.window_start < now() - make_interval(secs => p_window_seconds)
                then 1 else r.hits + 1 end
  returning hits into v_hits;
  return v_hits <= p_limit;
end $$;

revoke all on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, int, int) to service_role;