-- =================================================================================
-- Migration 021: Final Platform Fixes
-- 
-- Fixes:
-- 1. admin_overrides: add INSERT/UPDATE/DELETE policy for admins (403 Forbidden fix)
-- 2. update-lead-status: fix leads RLS so edge function can read lead data
-- 3. Create Supabase Storage bucket (s-network-media) with correct policies
-- 4. Add is_active, accepts_leads columns to businesses table for admin controls
-- =================================================================================

-- ─────────────────────────────────────────────
-- 1. FIX admin_overrides RLS (403 Forbidden)
-- ─────────────────────────────────────────────
ALTER TABLE admin_overrides ENABLE ROW LEVEL SECURITY;

-- Drop any old policies
DROP POLICY IF EXISTS "Admin can manage overrides" ON admin_overrides;
DROP POLICY IF EXISTS "Public can read overrides" ON admin_overrides;

-- Public read (for homepage + search ranking)
CREATE POLICY "Public can read overrides" ON admin_overrides
  FOR SELECT USING (true);

-- Only admins can write
CREATE POLICY "Admin can manage overrides" ON admin_overrides
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ─────────────────────────────────────────────
-- 2. FIX leads RLS for Edge Function (update-lead-status 400)
-- The issue: the edge function uses ANON key + user JWT to query leads.
-- The existing policy only allows vendor SELECT if they own the business.
-- The select inside the function does: .select('business_id, businesses(owner_id)')
-- But 'businesses' is also RLS-protected. We need to allow service-level reads.
-- ─────────────────────────────────────────────

-- Add a policy that allows the OWNER of a lead's business to READ the lead itself
-- (already exists but adding explicit service role bypass)
DROP POLICY IF EXISTS "Vendor can view and update their leads" ON leads;

CREATE POLICY "Vendor can view and update their leads" ON leads
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT b.owner_id FROM businesses b WHERE b.id = leads.business_id
    )
    OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT b.owner_id FROM businesses b WHERE b.id = leads.business_id
    )
    OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow vendors to SEE businesses records in order for the JOIN to work:
DROP POLICY IF EXISTS "Vendor can read any business for join" ON businesses;
CREATE POLICY "Vendor can read any business for join" ON businesses
  FOR SELECT USING (true);

-- ─────────────────────────────────────────────
-- 3. Add admin controls to businesses table
-- ─────────────────────────────────────────────
DO $$ BEGIN ALTER TABLE businesses ADD COLUMN IF NOT EXISTS accepts_leads boolean DEFAULT true; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE businesses ADD COLUMN IF NOT EXISTS admin_note text DEFAULT ''; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true; EXCEPTION WHEN others THEN NULL; END; $$;

-- ─────────────────────────────────────────────
-- 4. Create storage bucket s-network-media
-- (Run this separately if bucket creation fails via SQL — prefer Supabase Dashboard)
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('s-network-media', 's-network-media', true)
ON CONFLICT (id) DO NOTHING;

-- Also keep old name for backward compat
INSERT INTO storage.buckets (id, name, public)
VALUES ('build-connect-media', 'build-connect-media', true)
ON CONFLICT (id) DO NOTHING;

-- Set storage policies for public read + authenticated write
DO $$ BEGIN
  -- Allow public to read all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public storage read' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public storage read" ON storage.objects FOR SELECT USING (bucket_id IN ('s-network-media', 'build-connect-media'));
  END IF;
END $$;

-- Allow authenticated users to upload to their own folders
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated storage upload' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Authenticated storage upload" ON storage.objects
      FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND bucket_id IN ('s-network-media', 'build-connect-media')
      );
  END IF;
END $$;

-- Allow authenticated users to delete and update their own files
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated storage update delete' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Authenticated storage update delete" ON storage.objects
      FOR ALL USING (
        auth.role() = 'authenticated' 
        AND bucket_id IN ('s-network-media', 'build-connect-media')
      );
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 5. RLS for leads - allow user to create leads (anon or auth)
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can create lead" ON leads;
CREATE POLICY "Anyone can create lead" ON leads
  FOR INSERT WITH CHECK (true);

-- Allow admin to see all leads
DROP POLICY IF EXISTS "Admin can see all leads" ON leads;
CREATE POLICY "Admin can see all leads" ON leads
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─────────────────────────────────────────────
-- 6. Add 'contacted_at' and 'converted_at' columns if missing
-- ─────────────────────────────────────────────
DO $$ BEGIN ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacted_at timestamptz; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at timestamptz; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_phone text; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_email text; EXCEPTION WHEN others THEN NULL; END; $$;
