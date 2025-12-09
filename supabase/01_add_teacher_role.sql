-- ============================================
-- Migration 01: Add Teacher Role System
-- Description: Add role field to differentiate teachers from students
-- Date: 2025-12-08
-- ============================================

-- Check prerequisites
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE EXCEPTION 'Table profiles does not exist. Please run schema.sql first.';
  END IF;
END $$;

-- Step 1: Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- Step 2: Add constraint after column is created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'teacher'));
  END IF;
END $$;

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Step 4: Update existing users to 'student' by default
UPDATE public.profiles 
SET role = 'student' 
WHERE role IS NULL;

-- Step 5: Add NOT NULL constraint after setting defaults
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'student';

ALTER TABLE public.profiles 
ALTER COLUMN role SET NOT NULL;

-- Step 6: Update handle_new_user trigger to include role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
  user_role TEXT;
BEGIN
  -- Get username and role from metadata
  base_username := COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8));
  final_username := base_username;
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  -- Validate role
  IF user_role NOT IN ('student', 'teacher') THEN
    user_role := 'student';
  END IF;
  
  -- Handle username conflicts
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || '_' || counter;
  END LOOP;
  
  -- Insert profile with role
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (NEW.id, NEW.email, final_username, user_role)
  ON CONFLICT (id) DO UPDATE 
  SET 
    role = EXCLUDED.role,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Update create_or_update_profile function to handle role
CREATE OR REPLACE FUNCTION public.create_or_update_profile(
  user_id UUID,
  user_email TEXT,
  user_username TEXT,
  user_role TEXT DEFAULT 'student',
  user_first_name TEXT DEFAULT NULL,
  user_last_name TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  final_username TEXT;
  final_role TEXT;
  counter INTEGER := 0;
BEGIN
  -- Start with the requested username
  final_username := user_username;
  
  -- Validate and set role
  IF user_role IN ('student', 'teacher') THEN
    final_role := user_role;
  ELSE
    final_role := 'student';
  END IF;
  
  -- Handle username conflicts (excluding current user)
  WHILE EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE username = final_username 
    AND id != user_id
  ) LOOP
    counter := counter + 1;
    final_username := user_username || '_' || counter;
  END LOOP;
  
  -- Insert or update profile
  INSERT INTO public.profiles (id, email, username, role, first_name, last_name)
  VALUES (user_id, user_email, final_username, final_role, user_first_name, user_last_name)
  ON CONFLICT (id) DO UPDATE
  SET 
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Helper functions

-- Function to check if user is a teacher
CREATE OR REPLACE FUNCTION public.is_teacher(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE id = user_uuid AND role = 'teacher'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Function to check if user is a student
CREATE OR REPLACE FUNCTION public.is_student(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE id = user_uuid AND role = 'student'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Comments for documentation
COMMENT ON COLUMN public.profiles.role IS 'User role: student or teacher. Teachers can create classes and share modules.';
COMMENT ON FUNCTION public.is_teacher IS 'Check if a user is a teacher';
COMMENT ON FUNCTION public.is_student IS 'Check if a user is a student';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 01_add_teacher_role completed successfully';
END $$;

