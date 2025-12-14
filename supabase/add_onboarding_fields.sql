-- ============================================
-- Migration: Add Onboarding Fields
-- Description: Add study_level and school columns to profiles table for onboarding data
-- Date: 2025-01-XX
-- ============================================

-- Check prerequisites
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE EXCEPTION 'Table profiles does not exist. Please run schema.sql first.';
  END IF;
END $$;

-- Step 1: Add study_level column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS study_level TEXT;

-- Step 2: Add school column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS school TEXT;

-- Step 3: Add comments for documentation
COMMENT ON COLUMN public.profiles.study_level IS 'Optional study level (e.g., Terminale, Licence, Master) collected during onboarding';
COMMENT ON COLUMN public.profiles.school IS 'Optional school/university name collected during onboarding';

-- Step 4: Verify columns were added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'study_level'
  ) THEN
    RAISE EXCEPTION 'Column study_level was not added successfully';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'school'
  ) THEN
    RAISE EXCEPTION 'Column school was not added successfully';
  END IF;
END $$;

-- Verification query (uncomment to run):
/*
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('study_level', 'school')
ORDER BY column_name;
*/
