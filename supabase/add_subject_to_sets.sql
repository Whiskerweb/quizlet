-- Migration: Add subject/category field to sets table
-- This allows users to categorize their public sets by subject (e.g., Histoire, Français, Marketing, etc.)

-- Add subject field to sets table
ALTER TABLE public.sets 
ADD COLUMN IF NOT EXISTS subject TEXT;

-- Create index for better query performance when filtering by subject
CREATE INDEX IF NOT EXISTS idx_sets_subject ON public.sets(subject);

-- Add index for public sets with subject (for filtering public sets by subject)
CREATE INDEX IF NOT EXISTS idx_sets_public_subject ON public.sets(is_public, subject) WHERE is_public = true;

-- Comments
COMMENT ON COLUMN public.sets.subject IS 'Subject/category of the set (e.g., Histoire, Français, Marketing, etc.). Used for categorizing public sets.';

