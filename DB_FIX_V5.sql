-- S-Network Fix 5 DB Script
-- Run in Supabase SQL Editor

-- Add new columns to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_url text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order int DEFAULT 0;

-- Category subcategories/specializations table
CREATE TABLE IF NOT EXISTS category_specializations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order int DEFAULT 0,
  created_at timestamp DEFAULT now()
);

ALTER TABLE category_specializations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read specializations" ON category_specializations;
DROP POLICY IF EXISTS "Admin manages specializations" ON category_specializations;
CREATE POLICY "Public read specializations" ON category_specializations FOR SELECT USING (true);
CREATE POLICY "Admin manages specializations" ON category_specializations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Vendor specializations (vendor selections)
CREATE TABLE IF NOT EXISTS vendor_specializations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  specialization_id uuid REFERENCES category_specializations(id) ON DELETE CASCADE,
  custom_description text,
  UNIQUE(business_id, specialization_id)
);

ALTER TABLE vendor_specializations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read vendor specializations" ON vendor_specializations;
DROP POLICY IF EXISTS "Owner manages vendor specializations" ON vendor_specializations;
CREATE POLICY "Public read vendor specializations" ON vendor_specializations FOR SELECT USING (true);
CREATE POLICY "Owner manages vendor specializations" ON vendor_specializations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = vendor_specializations.business_id AND b.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = vendor_specializations.business_id AND b.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed specializations for Material Supplier
INSERT INTO category_specializations (category_id, name, sort_order)
SELECT c.id, spec.name, spec.ord FROM categories c
CROSS JOIN (VALUES
  ('Cement Supplier', 1), ('Steel/TMT Bars', 2), ('Bricks & Blocks', 3),
  ('Sand & Aggregates', 4), ('Tiles & Flooring', 5), ('Paint & Primer', 6),
  ('Electrical Materials', 7), ('Plumbing Materials', 8), ('Glass & Windows', 9),
  ('Waterproofing Chemicals', 10), ('Hardware & Fasteners', 11), ('Timber & Plywood', 12)
) AS spec(name, ord)
WHERE c.slug = 'material-supplier' ON CONFLICT DO NOTHING;

-- Seed for Electrician
INSERT INTO category_specializations (category_id, name, sort_order)
SELECT c.id, spec.name, spec.ord FROM categories c
CROSS JOIN (VALUES
  ('Residential Wiring', 1), ('Commercial Wiring', 2), ('Industrial Wiring', 3),
  ('CCTV Installation', 4), ('Solar Panel Installation', 5), ('Switchboard Work', 6),
  ('Generator Installation', 7), ('Earthing & Grounding', 8)
) AS spec(name, ord)
WHERE c.slug = 'electrician' ON CONFLICT DO NOTHING;

-- Seed for Plumber
INSERT INTO category_specializations (category_id, name, sort_order)
SELECT c.id, spec.name, spec.ord FROM categories c
CROSS JOIN (VALUES
  ('Pipe Fitting', 1), ('Drainage Work', 2), ('Waterproofing', 3),
  ('Bathroom Fitting', 4), ('Water Tank Installation', 5),
  ('Hot Water System', 6), ('Bore Well', 7)
) AS spec(name, ord)
WHERE c.slug = 'plumber' ON CONFLICT DO NOTHING;

-- Seed for Civil Contractor
INSERT INTO category_specializations (category_id, name, sort_order)
SELECT c.id, spec.name, spec.ord FROM categories c
CROSS JOIN (VALUES
  ('Residential Construction', 1), ('Commercial Construction', 2),
  ('Foundation Work', 3), ('RCC Work', 4), ('Brick & Block Work', 5),
  ('Plastering', 6), ('Renovation', 7), ('Demolition', 8)
) AS spec(name, ord)
WHERE c.slug = 'civil-contractor' ON CONFLICT DO NOTHING;

-- Seed for Interior Designer
INSERT INTO category_specializations (category_id, name, sort_order)
SELECT c.id, spec.name, spec.ord FROM categories c
CROSS JOIN (VALUES
  ('Modular Kitchen', 1), ('Living Room', 2), ('Bedroom Design', 3),
  ('Office Interior', 4), ('False Ceiling', 5), ('Flooring', 6),
  ('Wardrobe Design', 7), ('Hotel/Resort Interior', 8)
) AS spec(name, ord)
WHERE c.slug = 'interior-designer' ON CONFLICT DO NOTHING;

-- Seed for Architect
INSERT INTO category_specializations (category_id, name, sort_order)
SELECT c.id, spec.name, spec.ord FROM categories c
CROSS JOIN (VALUES
  ('Residential Architect', 1), ('Commercial Architect', 2), ('3D Elevation', 3),
  ('Building Plan', 4), ('Vastu Consultant', 5), ('Landscape Design', 6),
  ('Green Building', 7)
) AS spec(name, ord)
WHERE c.slug = 'architect' ON CONFLICT DO NOTHING;
