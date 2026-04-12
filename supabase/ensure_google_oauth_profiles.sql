-- Ensure Google OAuth users have profiles automatically created
-- This script ensures that:
-- 1. The trigger handle_new_user() exists and is attached to auth.users
-- 2. The RPC function create_or_update_profile exists and works
-- 3. RLS policies allow users to read/update their own profile

-- ============================================
-- 1. Function to handle new user creation (trigger)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Get username from metadata or generate one from email
  -- For Google OAuth, we can use the email prefix or generate a username
  -- Priority: metadata username > email prefix > generated username
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    CASE 
      WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1)
      ELSE 'user_' || substr(NEW.id::text, 1, 8)
    END
  );
  final_username := base_username;
  
  -- If username already exists, append a number
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || '_' || counter;
  END LOOP;
  
  -- Insert profile
  INSERT INTO public.profiles (id, email, username, first_name, last_name, is_premium)
  VALUES (
    NEW.id,
    NEW.email,
    final_username,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    false
  )
  ON CONFLICT (id) DO NOTHING; -- Don't error if profile already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Ensure trigger is attached to auth.users
-- ============================================
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires after a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. RPC function to create/update profile (bypasses RLS)
-- ============================================
CREATE OR REPLACE FUNCTION public.create_or_update_profile(
  user_id UUID,
  user_email TEXT,
  user_username TEXT,
  user_first_name TEXT DEFAULT NULL,
  user_last_name TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Handle username conflicts
  final_username := user_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username AND id != user_id) LOOP
    counter := counter + 1;
    final_username := user_username || '_' || counter;
  END LOOP;
  
  -- Insert or update profile
  INSERT INTO public.profiles (id, email, username, first_name, last_name, is_premium)
  VALUES (user_id, user_email, final_username, user_first_name, user_last_name, false)
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_or_update_profile TO authenticated;

-- ============================================
-- 4. RLS Policies for profiles table
-- ============================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Allow inserts (needed for trigger and RPC function)
-- The RPC function uses SECURITY DEFINER so it bypasses RLS anyway,
-- but this policy allows direct inserts if needed
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 5. Verify setup
-- ============================================
-- Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('handle_new_user', 'create_or_update_profile');

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

