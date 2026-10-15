-- Allow anyone (authenticated and anonymous) to view completed fixtures
CREATE POLICY "Public read completed fixtures" 
ON public.fixtures 
FOR SELECT 
USING (status = 'completed' OR status = 'in_progress');

-- Allow anyone to view approved fixture results
CREATE POLICY "Public read approved results" 
ON public.results 
FOR SELECT 
USING (verification_status = 'approved');

-- Allow anyone to view active/completed tournaments
CREATE POLICY "Public read active tournaments" 
ON public.tournaments 
FOR SELECT 
USING (deleted_at IS NULL);