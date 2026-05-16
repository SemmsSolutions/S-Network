-- Script 024: Fix RLS policies on categories table
-- Run this in Supabase Studio > SQL Editor

-- ============================================================
-- STEP 1: Check what policies currently exist on categories
-- ============================================================
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'categories';

-- ============================================================
-- STEP 2: Drop any restrictive existing policies
-- ============================================================
DROP POLICY IF EXISTS "Allow read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow admin write categories" ON public.categories;
DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_update_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON public.categories;

-- ============================================================
-- STEP 3: Make sure RLS is enabled (it is, otherwise no error)
-- ============================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: Everyone can READ categories (public browsing)
-- ============================================================
CREATE POLICY "Public can read categories"
  ON public.categories FOR SELECT
  USING (true);

-- ============================================================
-- STEP 5: Only admins can INSERT / UPDATE / DELETE categories
-- Admin = profiles.role = 'admin' for the current user
-- ============================================================
CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- STEP 6: Also fix category_specializations table (same issue)
-- ============================================================
ALTER TABLE public.category_specializations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read specializations" ON public.category_specializations;
DROP POLICY IF EXISTS "Admins can write specializations" ON public.category_specializations;
DROP POLICY IF EXISTS "Admins can insert specializations" ON public.category_specializations;
DROP POLICY IF EXISTS "Admins can update specializations" ON public.category_specializations;
DROP POLICY IF EXISTS "Admins can delete specializations" ON public.category_specializations;

CREATE POLICY "Public can read specializations"
  ON public.category_specializations FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert specializations"
  ON public.category_specializations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update specializations"
  ON public.category_specializations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete specializations"
  ON public.category_specializations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- VERIFY: Confirm your profile role is 'admin'
-- ============================================================
SELECT id, name, role FROM public.profiles WHERE role = 'admin';
