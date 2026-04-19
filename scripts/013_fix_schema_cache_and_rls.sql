-- ============================================================
-- Fix: Schema Cache + RLS Infinite Recursion Prevention
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Reload the PostgREST schema cache. 
-- (This fixes the "Database error querying schema" 500 status when the API doesn't recognize new tables or columns).
NOTIFY pgrst, 'reload schema';

-- 2. Optimize Admin RLS Policies
-- We replace EXISTS(SELECT FROM profiles) with a much faster, recursion-proof JWT check.
-- This ensures no infinite loops occur when querying the database as an admin.

DO $$ BEGIN
  -- Leads table
  DROP POLICY IF EXISTS "Read own leads" ON leads;
  CREATE POLICY "Read own leads" ON leads FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT owner_id FROM businesses WHERE id = leads.business_id) OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

  DROP POLICY IF EXISTS "Update own leads" ON leads;
  CREATE POLICY "Update own leads" ON leads FOR UPDATE 
  USING (
    auth.uid() IN (SELECT owner_id FROM businesses WHERE id = leads.business_id) OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

  -- Vendor Verifications
  DROP POLICY IF EXISTS "Read own verifications" ON vendor_verifications;
  CREATE POLICY "Read own verifications" ON vendor_verifications FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = vendor_verifications.business_id AND owner_id = auth.uid()) OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

  -- Admin Overrides
  DROP POLICY IF EXISTS "Admin manages overrides" ON admin_overrides;
  CREATE POLICY "Admin manages overrides" ON admin_overrides FOR ALL 
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

  -- Email Notifications
  DROP POLICY IF EXISTS "Admin reads emails" ON email_notifications;
  CREATE POLICY "Admin reads emails" ON email_notifications FOR SELECT 
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error optimizing policies: %', SQLERRM;
END; $$;
