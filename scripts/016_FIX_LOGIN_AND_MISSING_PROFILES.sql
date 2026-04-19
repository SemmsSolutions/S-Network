-- ============================================================
-- 016_FIX_LOGIN_AND_MISSING_PROFILES.sql
-- Run this in Supabase SQL Editor RIGHT NOW
-- Fixes: Login 400 (unconfirmed emails) + missing vendor profiles
-- ============================================================

-- 1. Auto-confirm ALL existing unconfirmed users
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email_confirmed_at IS NULL;

-- 2. Backfill missing profiles for any auth.users that don't have a profile row
INSERT INTO public.profiles (id, name, phone, role, avatar_url, created_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), 'User'),
  NULL,
  CASE 
    WHEN u.raw_user_meta_data->>'role' = 'vendor' THEN 'pending_vendor'
    WHEN u.raw_user_meta_data->>'role' = 'admin' THEN 'admin'
    ELSE 'user'
  END,
  '',
  now()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- 3. Reload schema
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- DONE! Now:
-- 1. All users can login immediately (no email confirmation needed)
-- 2. All registered vendors now have profile rows
-- 3. Find your admin user in profiles table and set role = 'admin'
--
-- IMPORTANT: Also go to Supabase Dashboard:
--   Authentication → Settings → Email Auth
--   Toggle OFF "Confirm email" so future signups work instantly
-- ============================================================
