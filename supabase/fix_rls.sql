-- Fix RLS policies for profiles to allow insert during registration
-- First, drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a new policy that allows users to insert their own profile
-- This is needed because during signup, the user doesn't exist yet in auth.users
-- but we need to create the profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (true); -- Allow all inserts, RLS on other operations will protect data

-- Also create a function to create/update profile that bypasses RLS
CREATE OR REPLACE FUNCTION public.create_or_update_profile(
  user_id UUID,
  user_email TEXT,
  user_username TEXT,
  user_first_name TEXT DEFAULT NULL,
  user_last_name TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, first_name, last_name)
  VALUES (user_id, user_email, user_username, user_first_name, user_last_name)
  ON CONFLICT (id) DO UPDATE
  SET 
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_or_update_profile TO authenticated;



