-- ============================================================
-- Migration 012: Seed Admin + Create Missing Tables + RLS + Indexes
-- RUN THIS IN SUPABASE SQL EDITOR FIRST, BEFORE ANY CODE CHANGES
-- ============================================================

-- ─────────────────────────────────────────────
-- 0. FIX: Drop broken UNIQUE constraint on phone
-- ─────────────────────────────────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;
UPDATE profiles SET phone = NULL WHERE phone = '';

-- Fix trigger: NULL for empty phone, vendor → pending_vendor
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text;
  user_name text;
  user_phone text;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  IF user_role = 'vendor' THEN
    user_role := 'pending_vendor';
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow pending_vendor role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'pending_vendor', 'vendor', 'admin'));

-- ─────────────────────────────────────────────
-- 1. CREATE ALL MISSING TABLES
-- ─────────────────────────────────────────────

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    body text NOT NULL,
    type text NOT NULL,
    is_read boolean DEFAULT false,
    ref_id uuid,
    created_at timestamptz DEFAULT now()
);

-- Saved businesses
CREATE TABLE IF NOT EXISTS public.saved_businesses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, business_id)
);

-- Business views
CREATE TABLE IF NOT EXISTS public.business_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    viewer_ip text NOT NULL DEFAULT '',
    viewed_at timestamptz DEFAULT now()
);

-- Review helpful
CREATE TABLE IF NOT EXISTS public.review_helpful (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(review_id, user_id)
);

-- Business FAQs
CREATE TABLE IF NOT EXISTS public.business_faqs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    question text NOT NULL,
    answer text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Reported businesses
CREATE TABLE IF NOT EXISTS public.reported_businesses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

-- Search logs
CREATE TABLE IF NOT EXISTS public.search_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    query text,
    city text,
    created_at timestamptz DEFAULT now()
);

-- Admin overrides
CREATE TABLE IF NOT EXISTS admin_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  override_type text NOT NULL CHECK (override_type IN ('homepage_featured','homepage_popular','homepage_recommended','search_pinned','category_pinned')),
  position_order int NOT NULL DEFAULT 1,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  city text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, override_type, category_id)
);

-- Email notifications
CREATE TABLE IF NOT EXISTS email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES profiles(id),
  recipient_email text NOT NULL DEFAULT '',
  email_type text NOT NULL,
  subject text,
  sent_at timestamptz DEFAULT now(),
  metadata jsonb
);

-- Vendor verifications
CREATE TABLE IF NOT EXISTS public.vendor_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  gst_number text,
  gst_certificate_url text,
  msme_number text,
  msme_certificate_url text,
  status text DEFAULT 'unverified' CHECK (status IN ('unverified','pending','approved','rejected')),
  rejection_reason text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Material categories
CREATE TABLE IF NOT EXISTS material_category_groups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    icon text DEFAULT '',
    sort_order int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS material_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES material_category_groups(id) ON DELETE CASCADE,
    name text NOT NULL,
    unit text DEFAULT '',
    sort_order int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS business_materials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
    item_id uuid REFERENCES material_items(id) ON DELETE CASCADE,
    custom_description text,
    UNIQUE(business_id, item_id)
);

-- Add missing columns to existing tables
DO $$ BEGIN ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug text; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE businesses ADD COLUMN IF NOT EXISTS year_established int; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE businesses ADD COLUMN IF NOT EXISTS employee_count text; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website_url text; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE businesses ADD COLUMN IF NOT EXISTS working_hours jsonb; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE businesses ADD COLUMN IF NOT EXISTS service_areas text[]; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE businesses ADD COLUMN IF NOT EXISTS total_views int DEFAULT 0; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE businesses ADD COLUMN IF NOT EXISTS total_leads int DEFAULT 0; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_on_vacation boolean DEFAULT false; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified'; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verification_rejection_reason text; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verified_at timestamptz; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE leads ADD COLUMN IF NOT EXISTS type text DEFAULT 'enquiry'; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE leads ADD COLUMN IF NOT EXISTS vendor_notes text; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE leads ADD COLUMN IF NOT EXISTS admin_note text; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE reviews ADD COLUMN IF NOT EXISTS vendor_reply text; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count int DEFAULT 0; EXCEPTION WHEN others THEN NULL; END; $$;

-- ─────────────────────────────────────────────
-- 2. SEED ADMIN ACCOUNT
-- ─────────────────────────────────────────────
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@snetwork.app';

  IF admin_uid IS NULL THEN
    admin_uid := gen_random_uuid();

    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token
    ) VALUES (
      admin_uid, '00000000-0000-0000-0000-000000000000', 'admin@snetwork.app',
      crypt('SNetwork@Admin2024!', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Super Admin","role":"admin"}',
      now(), now(), 'authenticated', 'authenticated', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (admin_uid, admin_uid, jsonb_build_object('sub', admin_uid::text, 'email', 'admin@snetwork.app'),
            'email', admin_uid::text, now(), now(), now());

    RAISE NOTICE 'Admin user created: %', admin_uid;
  ELSE
    RAISE NOTICE 'Admin exists: %', admin_uid;
  END IF;
END $$;

-- Ensure admin profile
INSERT INTO public.profiles (id, name, phone, role, avatar_url)
SELECT u.id, 'Super Admin', NULL, 'admin', ''
FROM auth.users u WHERE u.email = 'admin@snetwork.app'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Also make semmssolutions admin
UPDATE public.profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'semmssolutions@gmail.com');

-- ─────────────────────────────────────────────
-- 3. SEED CATEGORIES
-- ─────────────────────────────────────────────
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon text DEFAULT '';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug text DEFAULT '';
DO $$ BEGIN
  ALTER TABLE categories ADD CONSTRAINT categories_name_unique UNIQUE (name);
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

INSERT INTO categories (name, icon, slug) VALUES
  ('Civil Contractor', '🏗️', 'civil-contractor'),
  ('Residential Builder', '🏠', 'residential-builder'),
  ('Commercial Contractor', '🏢', 'commercial-contractor'),
  ('Turnkey Contractor', '🔑', 'turnkey-contractor'),
  ('Architect', '📐', 'architect'),
  ('Interior Designer', '🎨', 'interior-designer'),
  ('Electrician', '⚡', 'electrician'),
  ('Plumber', '🔧', 'plumber'),
  ('Material Supplier', '🧱', 'material-supplier')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────
-- 4. RLS POLICIES (all with duplicate-safe wrappers)
-- ─────────────────────────────────────────────

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Public read businesses" ON businesses FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN CREATE POLICY "Vendor creates own business" ON businesses FOR INSERT WITH CHECK (auth.uid() = owner_id); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN CREATE POLICY "Vendor updates own business" ON businesses FOR UPDATE USING (auth.uid() = owner_id); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Read own leads" ON leads FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT owner_id FROM businesses WHERE id = leads.business_id) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN CREATE POLICY "Authenticated create leads" ON leads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN CREATE POLICY "Update own leads" ON leads FOR UPDATE USING (auth.uid() IN (SELECT owner_id FROM businesses WHERE id = leads.business_id) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN CREATE POLICY "Authenticated create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN CREATE POLICY "Update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

ALTER TABLE saved_businesses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Manage own saved" ON saved_businesses FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

ALTER TABLE business_images ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Public read images" ON business_images FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN CREATE POLICY "Vendor manages images" ON business_images FOR ALL USING (EXISTS (SELECT 1 FROM businesses WHERE id = business_images.business_id AND owner_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

ALTER TABLE business_services ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Public read services" ON business_services FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

ALTER TABLE vendor_verifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Read own verifications" ON vendor_verifications FOR SELECT USING (EXISTS (SELECT 1 FROM businesses WHERE id = vendor_verifications.business_id AND owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

ALTER TABLE admin_overrides ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Public reads active overrides" ON admin_overrides FOR SELECT USING (is_active = true); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN CREATE POLICY "Admin manages overrides" ON admin_overrides FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Admin reads emails" ON email_notifications FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- ─────────────────────────────────────────────
-- 5. PERFORMANCE INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category_id);
CREATE INDEX IF NOT EXISTS idx_businesses_verified ON businesses(is_verified, is_active);
CREATE INDEX IF NOT EXISTS idx_leads_business ON leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_overrides_type ON admin_overrides(override_type);
CREATE INDEX IF NOT EXISTS idx_overrides_active ON admin_overrides(is_active);

-- ─────────────────────────────────────────────
-- DONE! Verify:
-- SELECT * FROM profiles WHERE role = 'admin';
-- SELECT * FROM categories ORDER BY name;
-- ─────────────────────────────────────────────
