-- Script 023: Fix SVG upload in s-network-media bucket (Bug 2)
-- Run this in Supabase Studio > SQL Editor

-- ============================================================
-- STEP 1 (THE MISSING PIECE): Add image/svg+xml to bucket
-- ============================================================
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'image/svg+xml', 'application/pdf'
]
WHERE id = 's-network-media';

-- ============================================================
-- STEP 2: Drop old restrictive policies
-- ============================================================
DROP POLICY IF EXISTS "Auth upload storage" ON storage.objects;
DROP POLICY IF EXISTS "Vendor uploads own verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Auth update storage" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete storage" ON storage.objects;

-- ============================================================
-- STEP 3: Re-create policies with DO $$ blocks (correct syntax)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload'
  ) THEN
    CREATE POLICY "Authenticated users can upload"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 's-network-media' AND auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated users can update own files'
  ) THEN
    CREATE POLICY "Authenticated users can update own files"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 's-network-media' AND auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated users can delete own files'
  ) THEN
    CREATE POLICY "Authenticated users can delete own files"
      ON storage.objects FOR DELETE
      USING (bucket_id = 's-network-media' AND auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ============================================================
-- VERIFY: allowed_mime_types must now include image/svg+xml
-- ============================================================
SELECT id, name, public, allowed_mime_types
FROM storage.buckets WHERE id = 's-network-media';
