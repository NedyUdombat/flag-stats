-- Rename the enum value. Existing user_roles rows and existing RLS policies
-- keep working: enum values are stored by internal id, not by label.
alter type public.app_role rename value 'team_coach' to 'team_admin';

-- Function BODIES are stored as text, so any that hard-code the old label
-- would now fail at runtime (e.g. claim_role_scope,
-- enforce_athlete_verified_change). Re-create each one with the label
-- swapped.
do $$
declare
  r record;
begin
  for r in
    select p.oid
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prokind = 'f'
       and p.prosrc like '%team_coach%'
  loop
    execute replace(pg_get_functiondef(r.oid), 'team_coach', 'team_admin');
  end loop;
end
$$;