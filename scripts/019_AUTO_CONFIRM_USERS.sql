-- =================================================================================
-- Migration 019: Auto-Confirm Users (Fixes "Incorrect Password" for new signups)
-- 
-- WHY THIS IS NEEDED:
-- Supabase requires users to confirm their email by default. If they try to log in
-- before confirming their email, Supabase securely returns "Invalid login credentials".
--
-- This script does two things:
-- 1. Instantly confirms EVERY existing user in your database.
-- 2. Adds a trigger to INSTANTLY confirm all future users the second they sign up.
-- =================================================================================

-- 1. Fix all currently unconfirmed users so they can log in right now!
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW());

-- 2. Create the Auto-Confirm function
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Automatically mark their email as confirmed so they can log in immediately
  NEW.email_confirmed_at := NOW();
  NEW.confirmed_at := NOW();
  RETURN NEW;
END;
$$;

-- 3. Attach it as a BEFORE INSERT trigger on the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;

CREATE TRIGGER on_auth_user_created_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_new_user();
