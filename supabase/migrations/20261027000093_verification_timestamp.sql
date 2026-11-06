-- Add verification timestamp
ALTER TABLE public.athletes
ADD COLUMN verified_at TIMESTAMPTZ;

-- Backfill existing verified athletes
UPDATE public.athletes
SET verified_at = updated_at
WHERE verified = true
  AND verified_at IS NULL;