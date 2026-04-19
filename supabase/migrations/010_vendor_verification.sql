-- Migration 010: Vendor Verification System
-- Adds verification columns to businesses + vendor_verifications table + storage policies

-- 1. Add verification columns to businesses table
DO $$ BEGIN
  ALTER TABLE public.businesses ADD COLUMN verification_status text DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','pending','verified','rejected'));
EXCEPTION WHEN duplicate_column THEN NULL;
END; $$;

DO $$ BEGIN
  ALTER TABLE public.businesses ADD COLUMN verified_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL;
END; $$;

DO $$ BEGIN
  ALTER TABLE public.businesses ADD COLUMN verification_rejection_reason text;
EXCEPTION WHEN duplicate_column THEN NULL;
END; $$;

-- 2. Create vendor_verifications table
CREATE TABLE IF NOT EXISTS public.vendor_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- GST
  gst_number text,
  gst_certificate_url text,

  -- MSME / Udyam
  msme_number text,
  msme_certificate_url text,

  -- Status tracking
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),

  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id),
  rejection_reason text,

  -- Resubmission tracking
  submission_count int DEFAULT 1,

  UNIQUE(business_id) -- one active verification record per business
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_verifications_status ON public.vendor_verifications(status);
CREATE INDEX IF NOT EXISTS idx_verifications_business ON public.vendor_verifications(business_id);

-- 4. RLS
ALTER TABLE public.vendor_verifications ENABLE ROW LEVEL SECURITY;

-- Vendor can view their own verification record
DO $$ BEGIN
CREATE POLICY "Vendor views own verification"
  ON public.vendor_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = vendor_verifications.business_id
      AND b.owner_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

-- Vendor can insert their own verification
DO $$ BEGIN
CREATE POLICY "Vendor submits verification"
  ON public.vendor_verifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = vendor_verifications.business_id
      AND b.owner_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

-- Vendor can update their own verification (for resubmission)
DO $$ BEGIN
CREATE POLICY "Vendor resubmits verification"
  ON public.vendor_verifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = vendor_verifications.business_id
      AND b.owner_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

-- Admin can do everything
DO $$ BEGIN
CREATE POLICY "Admin manages all verifications"
  ON public.vendor_verifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

-- 5. Storage policies for verification documents (private)
DO $$ BEGIN
CREATE POLICY "Vendor uploads own verification docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'build-connect-media'
    AND (storage.foldername(name))[1] = 'verifications'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

DO $$ BEGIN
CREATE POLICY "Vendor and admin view verification docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'build-connect-media'
    AND (storage.foldername(name))[1] = 'verifications'
    AND (
      auth.uid() IS NOT NULL
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;
