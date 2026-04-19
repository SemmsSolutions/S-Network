-- ============================================================
-- 018_CONFIRM_LAST_USER.sql
-- Fixes "Invalid login credentials" caused by unconfirmed emails
-- ============================================================

UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email_confirmed_at IS NULL;
