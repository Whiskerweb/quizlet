-- Fix 1: Improve the trigger to handle username conflicts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Get username from metadata or generate one
  base_username := COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8));
  final_username := base_username;
  
  -- If username already exists, append a number
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || '_' || counter;
  END LOOP;
  
  -- Insert profile (will be updated later by the RPC function if needed)
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    final_username
  )
  ON CONFLICT (id) DO NOTHING; -- Don't error if profile already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 2: Improve the create_or_update_profile function to handle username conflicts
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
  -- Start with the requested username
  final_username := user_username;
  
  -- If username already exists (and it's not for this user), append a number
  WHILE EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE username = final_username 
    AND id != user_id
  ) LOOP
    counter := counter + 1;
    final_username := user_username || '_' || counter;
  END LOOP;
  
  -- Insert or update profile
  INSERT INTO public.profiles (id, email, username, first_name, last_name)
  VALUES (user_id, user_email, final_username, user_first_name, user_last_name)
  ON CONFLICT (id) DO UPDATE
  SET 
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

