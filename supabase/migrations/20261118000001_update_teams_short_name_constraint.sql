-- 20261118000001_update_teams_short_name_constraint.sql
ALTER TABLE public.teams
DROP CONSTRAINT teams_short_name_check;

ALTER TABLE public.teams
ADD CONSTRAINT teams_short_name_check
CHECK (
  short_name IS NULL
  OR short_name ~ '^[A-Za-z0-9-]{2,6}$'
);