
-- 20261119000001_allow_anon_rate_limit.sql

-- Ensure the rate_limits table remains inaccessible to client roles.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.rate_limits
FROM PUBLIC, anon, authenticated;

-- Allow anonymous and service-role clients to execute
-- the rate-limiting function.
REVOKE ALL ON FUNCTION
  public.check_rate_limit(text, integer, integer)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.check_rate_limit(text, integer, integer)
TO anon, service_role;
