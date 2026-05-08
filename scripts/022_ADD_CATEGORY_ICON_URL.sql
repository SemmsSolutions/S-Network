-- Script 022: Add icon_url column to categories + set up Storage bucket
-- Run this in Supabase SQL Editor

-- 1. Add icon_url column if it doesn't exist
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Ensure categories have icon column for emoji fallback
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '📦';

-- 3. Update index
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order, name);

-- 4. Verify columns
SELECT id, name, slug, icon, icon_url, sort_order FROM categories ORDER BY sort_order, name LIMIT 20;
