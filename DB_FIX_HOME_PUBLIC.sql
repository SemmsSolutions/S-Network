-- S-Network Home Page Public Fix
-- Run in Supabase SQL Editor to make the home page visible to public (non-logged-in) users

-- 1. Allow public (anon) read on categories
DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories"
  ON categories FOR SELECT USING (true);

-- 2. Allow public (anon) read on active businesses
DROP POLICY IF EXISTS "Public read active businesses" ON businesses;
CREATE POLICY "Public read active businesses"
  ON businesses FOR SELECT USING (is_active = true);

-- 3. Allow public read on profiles (basic info only) — needed for vendor cards
DROP POLICY IF EXISTS "Public read profiles basic" ON profiles;
CREATE POLICY "Public read profiles basic"
  ON profiles FOR SELECT USING (true);

-- 4. Allow public read on business_images
DROP POLICY IF EXISTS "Public read business images" ON business_images;
CREATE POLICY "Public read business images"
  ON business_images FOR SELECT USING (true);

-- 5. Allow public read on reviews
DROP POLICY IF EXISTS "Public read reviews" ON reviews;
CREATE POLICY "Public read reviews"
  ON reviews FOR SELECT USING (true);

-- Verify: after running this, the home page should load for unauthenticated users
-- Also check the Supabase anon key is set correctly in the Angular environment.ts
