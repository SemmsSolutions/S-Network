-- Migration 007: Feature Audit Part A Additions

-- 1. saved_businesses table
CREATE TABLE IF NOT EXISTS public.saved_businesses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, business_id)
);
ALTER TABLE public.saved_businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own saved businesses" ON public.saved_businesses FOR ALL USING (auth.uid() = user_id);

-- 2. business_views table
CREATE TABLE IF NOT EXISTS public.business_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    viewer_ip text NOT NULL,
    viewed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.business_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Insert business views for all" ON public.business_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Select only for business owner" ON public.business_views FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE businesses.id = business_views.business_id AND businesses.owner_id = auth.uid())
);

-- 3. notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    body text NOT NULL,
    type text NOT NULL,
    is_read boolean DEFAULT false,
    ref_id uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- 4. review_helpful table
CREATE TABLE IF NOT EXISTS public.review_helpful (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(review_id, user_id)
);
ALTER TABLE public.review_helpful ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public select review helpful" ON public.review_helpful FOR SELECT USING (true);
CREATE POLICY "Auth insert review helpful" ON public.review_helpful FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth delete review helpful" ON public.review_helpful FOR DELETE USING (auth.uid() = user_id);

-- 5. business_faqs table
CREATE TABLE IF NOT EXISTS public.business_faqs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    question text NOT NULL,
    answer text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.business_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public select faqs" ON public.business_faqs FOR SELECT USING (true);
CREATE POLICY "Owner manage faqs" ON public.business_faqs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE businesses.id = business_faqs.business_id AND businesses.owner_id = auth.uid())
);

-- 6. reported_businesses table
CREATE TABLE IF NOT EXISTS public.reported_businesses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.reported_businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert reports" ON public.reported_businesses FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin select reports" ON public.reported_businesses FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 7. search_logs table
CREATE TABLE IF NOT EXISTS public.search_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    query text,
    city text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert search logs" ON public.search_logs FOR INSERT WITH CHECK (true);


-- 8. Alter existing tables to add columns
DO $$
BEGIN
    ALTER TABLE public.businesses ADD COLUMN slug text UNIQUE;
EXCEPTION WHEN duplicate_column THEN END; $$;

DO $$ BEGIN ALTER TABLE public.businesses ADD COLUMN year_established int; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE public.businesses ADD COLUMN employee_count text; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE public.businesses ADD COLUMN website_url text; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE public.businesses ADD COLUMN working_hours jsonb; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE public.businesses ADD COLUMN languages_spoken text[]; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE public.businesses ADD COLUMN service_areas text[]; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE public.businesses ADD COLUMN total_views int DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE public.businesses ADD COLUMN total_leads int DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE public.businesses ADD COLUMN response_rate numeric DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE public.businesses ADD COLUMN avg_response_time_hours numeric DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE public.businesses ADD COLUMN is_on_vacation boolean DEFAULT false; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE public.businesses ADD COLUMN is_premium boolean DEFAULT false; EXCEPTION WHEN duplicate_column THEN END; $$;


DO $$ BEGIN ALTER TABLE public.leads ADD COLUMN type text DEFAULT 'enquiry' CHECK (type IN ('enquiry', 'call')); EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE public.leads ADD COLUMN vendor_notes text; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE public.leads ADD COLUMN contacted_at timestamp with time zone; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE public.leads ADD COLUMN converted_at timestamp with time zone; EXCEPTION WHEN duplicate_column THEN END; $$;

DO $$ BEGIN ALTER TABLE public.reviews ADD COLUMN vendor_reply text; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE public.reviews ADD COLUMN helpful_count int DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END; $$;

-- 9. RPC for nearby businesses
CREATE OR REPLACE FUNCTION get_nearby_businesses(
  lat double precision,
  lng double precision,
  radius_km double precision,
  target_category_id uuid DEFAULT NULL,
  row_limit integer DEFAULT 20
) RETURNS TABLE (
  id uuid,
  owner_id uuid,
  name text,
  city text,
  address text,
  lat double precision,
  lng double precision,
  description text,
  category_id uuid,
  is_verified boolean,
  slug text,
  year_established int,
  employee_count text,
  website_url text,
  working_hours jsonb,
  total_views int,
  total_leads int,
  response_rate numeric,
  avg_response_time_hours numeric,
  is_on_vacation boolean,
  is_premium boolean,
  distance_km double precision
) AS $func$
BEGIN
  RETURN QUERY
  SELECT 
    b.id, b.owner_id, b.name, b.city, b.address, b.lat, b.lng, b.description, b.category_id, b.is_verified,
    b.slug, b.year_established, b.employee_count, b.website_url, b.working_hours, 
    b.total_views, b.total_leads, b.response_rate, b.avg_response_time_hours, b.is_on_vacation, b.is_premium,
    ( 6371 * acos( cos( radians(get_nearby_businesses.lat) ) * cos( radians( b.lat ) ) * cos( radians( b.lng ) - radians(get_nearby_businesses.lng) ) + sin( radians(get_nearby_businesses.lat) ) * sin( radians( b.lat ) ) ) ) AS distance_km
  FROM public.businesses b
  WHERE 
    b.is_on_vacation = false
    AND (target_category_id IS NULL OR b.category_id = target_category_id)
    AND ( 6371 * acos( cos( radians(get_nearby_businesses.lat) ) * cos( radians( b.lat ) ) * cos( radians( b.lng ) - radians(get_nearby_businesses.lng) ) + sin( radians(get_nearby_businesses.lat) ) * sin( radians( b.lat ) ) ) ) <= radius_km
  ORDER BY distance_km ASC
  LIMIT row_limit;
END;
$func$ LANGUAGE plpgsql;
