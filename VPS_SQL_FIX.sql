-- Run this script in your Supabase SQL Editor to add the missing columns and table for the Home Page 

-- 1. Add missing columns to the businesses table
DO $$ 
BEGIN 
  ALTER TABLE public.businesses ADD COLUMN total_views int DEFAULT 0; 
EXCEPTION WHEN duplicate_column THEN null; 
END; $$;

DO $$ 
BEGIN 
  ALTER TABLE public.businesses ADD COLUMN is_on_vacation boolean DEFAULT false; 
EXCEPTION WHEN duplicate_column THEN null; 
END; $$;

-- 2. Create the missing search_logs table
CREATE TABLE IF NOT EXISTS public.search_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    query text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS and missing policies on search_logs
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    CREATE POLICY "Public insert search logs" ON public.search_logs FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; 
END; $$;

DO $$ 
BEGIN
    CREATE POLICY "Public read search logs" ON public.search_logs FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; 
END; $$;
