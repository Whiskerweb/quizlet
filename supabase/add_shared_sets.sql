-- Migration: Add password protection and shared sets functionality
-- This migration adds:
-- 1. password field to sets table (hashed password for protected sets)
-- 2. shared_sets table to track sets shared with users

-- Add password field to sets table
ALTER TABLE public.sets 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create shared_sets table
CREATE TABLE IF NOT EXISTS public.shared_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id UUID NOT NULL REFERENCES public.sets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(set_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_sets_user_id ON public.shared_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_sets_set_id ON public.shared_sets(set_id);
CREATE INDEX IF NOT EXISTS idx_shared_sets_shared_by ON public.shared_sets(shared_by_user_id);

-- Add updated_at trigger for shared_sets
CREATE TRIGGER update_shared_sets_updated_at 
  BEFORE UPDATE ON public.shared_sets
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies for shared_sets
ALTER TABLE public.shared_sets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own shared sets
CREATE POLICY "Users can view their own shared sets"
  ON public.shared_sets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert shared sets for themselves
CREATE POLICY "Users can insert shared sets for themselves"
  ON public.shared_sets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own shared sets
CREATE POLICY "Users can delete their own shared sets"
  ON public.shared_sets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Set owners can view who has access to their sets
CREATE POLICY "Set owners can view shared sets for their sets"
  ON public.shared_sets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sets
      WHERE sets.id = shared_sets.set_id
      AND sets.user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON COLUMN public.sets.password_hash IS 'Hashed password for protected sets. NULL means no password protection.';
COMMENT ON TABLE public.shared_sets IS 'Tracks sets that have been shared with users after password verification.';








