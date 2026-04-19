-- ============================================================
-- 017_FINAL_RLS_FIX.sql
-- Fixes RLS for profile fallbacks created by the frontend
-- ============================================================

-- Grant permission for authenticated users to insert their OWN profile
-- This is required because the frontend 'CallbackComponent' attempts to upsert
-- a profile if the database trigger fails or is delayed.

DO $$ BEGIN
  CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- Also ensure they can update their own profile (which covers the 'upsert' case)
DO $$ BEGIN
  CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- Reload schema
NOTIFY pgrst, 'reload schema';
