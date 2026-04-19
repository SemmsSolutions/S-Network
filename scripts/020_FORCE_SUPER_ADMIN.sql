-- =================================================================================
-- Migration 020: Force Super Admin Access
-- 
-- This script permanently hardwires your designated email (semmssolutions@gmail.com)
-- to ALWAYS be a Super Admin.
--
-- Why? When you use "Continue with Google", Supabase generates a brand new user 
-- with a default 'user' role regardless of what you do. This script intercepts 
-- that process at the database level and forces it to 'admin'.
-- =================================================================================

-- 1. If you ALREADY logged in with Google, this will upgrade that account right now:
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'semmssolutions@gmail.com');

UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@snetwork.app');

-- 2. Modify the "handle_new_user" trigger to guarantee it for all FUTURE logins:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text;
  user_name text;
  user_phone text;
BEGIN
  -- Default role assignment
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  
  IF user_role = 'vendor' THEN
    user_role := 'pending_vendor';
  END IF;

  -- 🛑 THE MASTER OVERRIDE 🛑
  -- If this specific email signs up, FORCE them to be an admin immediately.
  IF NEW.email = 'semmssolutions@gmail.com' OR NEW.email = 'admin@snetwork.app' THEN
    user_role := 'admin';
  END IF;

  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User');
  user_phone := COALESCE(NULLIF(NEW.phone, ''), NULLIF(NEW.raw_user_meta_data->>'phone', ''), NULL);

  INSERT INTO public.profiles (id, name, phone, role, avatar_url, created_at)
  VALUES (NEW.id, user_name, user_phone, user_role, COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''), now())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    role = CASE WHEN profiles.role IS NULL OR profiles.role = '' THEN EXCLUDED.role ELSE profiles.role END;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
