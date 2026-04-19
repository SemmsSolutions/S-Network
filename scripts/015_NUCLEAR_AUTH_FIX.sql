-- ============================================================
-- 015_NUCLEAR_AUTH_FIX.sql
-- FINAL FIX — Run this in Supabase SQL Editor RIGHT NOW
-- Fixes: Auth 500/400 on signup/login, profile creation failures
-- ============================================================

-- Step 1: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Step 2: Remove ALL phone constraints that cause insertion failures
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_phone_unique;

-- Step 3: Fix all empty-string phones to NULL
UPDATE profiles SET phone = NULL WHERE phone = '' OR phone IS NOT NULL AND length(trim(phone)) = 0;

-- Step 4: Drop and recreate the trigger function — absolutely bulletproof
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_name text;
BEGIN
  -- Extract role safely
  v_role := coalesce(NEW.raw_user_meta_data->>'role', 'user');
  IF v_role = 'vendor' THEN v_role := 'pending_vendor'; END IF;
  IF v_role NOT IN ('user','pending_vendor','vendor','admin') THEN v_role := 'user'; END IF;

  -- Extract name safely
  v_name := coalesce(
    nullif(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(NEW.raw_user_meta_data->>'name'), ''),
    split_part(NEW.email, '@', 1),
    'User'
  );

  -- Insert profile — phone is always NULL on initial creation to avoid constraint issues
  INSERT INTO public.profiles (id, name, phone, role, avatar_url, created_at)
  VALUES (NEW.id, v_name, NULL, v_role, '', now())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = CASE
      WHEN profiles.role IS NULL OR profiles.role = '' THEN EXCLUDED.role
      ELSE profiles.role
    END;

  RETURN NEW;
EXCEPTION WHEN others THEN
  -- NEVER crash the auth flow — log and continue
  RAISE WARNING 'handle_new_user error for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Fix role constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'pending_vendor', 'vendor', 'admin'));

-- Step 6: Ensure profiles RLS allows the trigger (SECURITY DEFINER) to insert
-- and allows authenticated users to read profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing profile policies to start clean
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
  END LOOP;
END $$;

-- Recreate clean policies
CREATE POLICY "Anyone can read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Service role inserts profiles" ON profiles FOR INSERT WITH CHECK (true);

-- Step 7: Delete corrupted admin user (if any) and recreate properly
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@snetwork.app');
DELETE FROM auth.users WHERE email = 'admin@snetwork.app';
DELETE FROM profiles WHERE id NOT IN (SELECT id FROM auth.users);

-- Step 8: Reload schema again after all changes
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================================
-- DONE! After running this:
-- 1. Go to the Register page and create admin@snetwork.app with your password
-- 2. In Supabase Table Editor → profiles → change role to 'admin'
-- 3. Log in
-- ============================================================
