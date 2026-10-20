-- 1. Enable RLS on tournament_registrations
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

-- 2. Allow league creators or platform admins to insert/invite team registrations
CREATE POLICY "Admins can insert tournament registrations"
ON tournament_registrations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tournaments t
    JOIN leagues l ON l.id = t.league_id
    WHERE t.id = tournament_registrations.tournament_id
      AND l.created_by = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.platform_role::text IN ('admin', 'super_admin', 'super')
  )
);

-- 3. Allow team members/managers to update their own team's registrations (e.g. accepting invitations)
CREATE POLICY "Team members can update team registrations"
ON tournament_registrations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = tournament_registrations.team_id
      AND tm.athlete_id = auth.uid()
  )
);