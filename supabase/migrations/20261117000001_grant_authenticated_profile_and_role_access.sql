
-- Grant authenticated users permission to read profiles and user roles.
-- RLS policies remain responsible for controlling which rows are accessible.

GRANT SELECT ON TABLE public.profiles TO authenticated;

GRANT SELECT ON TABLE public.user_roles TO authenticated;
