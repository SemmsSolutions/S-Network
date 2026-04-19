-- Migration 011: Admin Controls + Auth Trigger Fix + Role Gating
-- Run this in Supabase SQL Editor

-- ============================================================
-- A1. Fix the Postgres trigger — maps vendor→pending_vendor
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text;
  user_name text;
  user_phone text;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');

  -- Vendors must be approved by admin before accessing the platform
  IF user_role = 'vendor' THEN
    user_role := 'pending_vendor';
  END IF;

  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'User'
  );

  user_phone := COALESCE(
    NEW.phone,
    NEW.raw_user_meta_data->>'phone',
    ''
  );

  INSERT INTO public.profiles (id, name, phone, role, avatar_url, created_at)
  VALUES (
    NEW.id,
    user_name,
    user_phone,
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    role = CASE
      WHEN profiles.role IS NULL OR profiles.role = '' THEN EXCLUDED.role
      ELSE profiles.role
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- A2. Allow pending_vendor role
-- ============================================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'pending_vendor', 'vendor', 'admin'));

-- ============================================================
-- B1. Admin Overrides Table (ranking system)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  override_type text NOT NULL CHECK (
    override_type IN (
      'homepage_featured',
      'homepage_popular',
      'homepage_recommended',
      'search_pinned',
      'category_pinned'
    )
  ),
  position_order int NOT NULL DEFAULT 1,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  city text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, override_type, category_id)
);

CREATE INDEX IF NOT EXISTS idx_overrides_type ON admin_overrides(override_type);
CREATE INDEX IF NOT EXISTS idx_overrides_active ON admin_overrides(is_active);
CREATE INDEX IF NOT EXISTS idx_overrides_position ON admin_overrides(override_type, position_order);

ALTER TABLE admin_overrides ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Public reads active overrides"
  ON admin_overrides FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

DO $$ BEGIN
CREATE POLICY "Admin manages overrides"
  ON admin_overrides FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

-- ============================================================
-- B1b. Email notification log table
-- ============================================================
CREATE TABLE IF NOT EXISTS email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES profiles(id),
  recipient_email text NOT NULL,
  email_type text NOT NULL CHECK (
    email_type IN (
      'vendor_registration_received',
      'vendor_approved',
      'vendor_rejected',
      'new_lead_received',
      'verification_approved',
      'verification_rejected'
    )
  ),
  subject text,
  sent_at timestamptz DEFAULT now(),
  metadata jsonb
);

ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Admin reads all emails" ON email_notifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

-- ============================================================
-- Fix: Ensure profiles INSERT policy exists for new users
-- ============================================================
DO $$ BEGIN
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;
