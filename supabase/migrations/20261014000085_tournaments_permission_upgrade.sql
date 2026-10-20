-- 1. Ensure RLS is enabled
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

-- 2. Drop any conflicting insert policies to start clean (with the correct space)
DROP POLICY IF EXISTS "Admins can insert tournament registrations" ON tournament_registrations;
DROP POLICY IF EXISTS "Enable insert for tournament admins" ON tournament_registrations;

-- 3. Create a robust insert policy checking league ownership or platform admin status
CREATE POLICY "Admins can insert tournament registrations"
ON tournament_registrations
FOR INSERT
TO authenticated
WITH CHECK (
  -- Check if user created the parent league
  EXISTS (
    SELECT 1 FROM tournaments t
    JOIN leagues l ON l.id = t.league_id
    WHERE t.id = tournament_registrations.tournament_id
      AND l.created_by = auth.uid()
  )
  OR
  -- Check if user is a platform administrator
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.platform_role::text IN ('admin', 'super_admin', 'super')
  )
  OR
  -- Check if user created the tournament directly
  EXISTS (
    SELECT 1 FROM tournaments t
    WHERE t.id = tournament_registrations.tournament_id
      AND t.created_by = auth.uid()
  )
);