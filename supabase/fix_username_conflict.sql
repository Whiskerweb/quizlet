-- Fix the create_or_update_profile function to handle username conflicts
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











