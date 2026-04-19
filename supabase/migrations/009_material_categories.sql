-- Material category groups (7 groups)
CREATE TABLE IF NOT EXISTS material_category_groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  icon text,
  sort_order int DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- Individual materials within each group
CREATE TABLE IF NOT EXISTS material_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid REFERENCES material_category_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order int DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- Links a vendor/business to materials they supply or work with
CREATE TABLE IF NOT EXISTS business_materials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  material_item_id uuid REFERENCES material_items(id) ON DELETE CASCADE,
  custom_description text,
  UNIQUE(business_id, material_item_id)
);

ALTER TABLE material_category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read material groups" ON material_category_groups;
CREATE POLICY "Public read material groups" ON material_category_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read material items" ON material_items;
CREATE POLICY "Public read material items" ON material_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read business materials" ON business_materials;
CREATE POLICY "Public read business materials" ON business_materials FOR SELECT USING (true);

DROP POLICY IF EXISTS "Vendor manages own materials" ON business_materials;
CREATE POLICY "Vendor manages own materials" ON business_materials FOR ALL
  USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = business_materials.business_id AND b.owner_id = auth.uid()));

-- Seeds
INSERT INTO material_category_groups (name, icon, sort_order) VALUES
('Structural & Foundation', '🏗️', 1),
('Carpentry & Woodwork', '🪵', 2),
('Glass & Windows', '🪟', 3),
('Interior Design & Finishing', '🎨', 4),
('Plumbing', '🔧', 5),
('Electrical', '⚡', 6),
('Miscellaneous', '🔩', 7);

DO $$
DECLARE
  v_group1 uuid;
  v_group2 uuid;
  v_group3 uuid;
  v_group4 uuid;
  v_group5 uuid;
  v_group6 uuid;
  v_group7 uuid;
BEGIN
  SELECT id INTO v_group1 FROM material_category_groups WHERE name = 'Structural & Foundation';
  SELECT id INTO v_group2 FROM material_category_groups WHERE name = 'Carpentry & Woodwork';
  SELECT id INTO v_group3 FROM material_category_groups WHERE name = 'Glass & Windows';
  SELECT id INTO v_group4 FROM material_category_groups WHERE name = 'Interior Design & Finishing';
  SELECT id INTO v_group5 FROM material_category_groups WHERE name = 'Plumbing';
  SELECT id INTO v_group6 FROM material_category_groups WHERE name = 'Electrical';
  SELECT id INTO v_group7 FROM material_category_groups WHERE name = 'Miscellaneous';

  INSERT INTO material_items (group_id, name, sort_order) VALUES
  (v_group1, 'Steel (TMT Bars)', 1), (v_group1, 'Cement (PPC)', 2), (v_group1, 'Cement (OPC)', 3), (v_group1, 'Red Bricks', 4),
  (v_group1, 'Fly Ash Bricks', 5), (v_group1, 'AAC Blocks', 6), (v_group1, 'Hollow Blocks', 7), (v_group1, 'M-Sand', 8),
  (v_group1, 'P-Sand', 9), (v_group1, 'Blue Metal Aggregates', 10), (v_group1, 'Binding Wire', 11), (v_group1, 'Cover Blocks', 12),
  (v_group1, 'Waterproofing Chemicals', 13), (v_group1, 'Anti-Termite Treatment', 14);

  INSERT INTO material_items (group_id, name, sort_order) VALUES
  (v_group2, 'Teak Wood', 1), (v_group2, 'Neem Wood', 2), (v_group2, 'Sal Wood', 3), (v_group2, 'Plywood (BWP Grade)', 4),
  (v_group2, 'Plywood (MR Grade)', 5), (v_group2, 'MDF Board', 6), (v_group2, 'HDF Board', 7), (v_group2, 'Particle Board', 8),
  (v_group2, 'Sunmica Laminates', 9), (v_group2, 'PVC Laminates', 10), (v_group2, 'Decorative Veneers', 11), (v_group2, 'Fevicol Adhesive', 12),
  (v_group2, 'Araldite Adhesive', 13), (v_group2, 'Butt Hinges', 14), (v_group2, 'Auto Hinges', 15), (v_group2, 'Telescopic Drawer Channels', 16),
  (v_group2, 'Soft-Close Drawer Channels', 17), (v_group2, 'Mortise Handles', 18), (v_group2, 'Cabinet Knobs', 19), (v_group2, 'Tower Bolts', 20), (v_group2, 'PVC Edge Banding', 21);

  INSERT INTO material_items (group_id, name, sort_order) VALUES
  (v_group3, 'Toughened Glass', 1), (v_group3, 'Tinted Glass', 2), (v_group3, 'Frosted Glass', 3), (v_group3, 'Fluted Glass', 4),
  (v_group3, 'UPVC Windows', 5), (v_group3, 'Aluminium Powder-Coated Frames', 6), (v_group3, 'Silicone Sealant', 7), (v_group3, 'Rubber Gaskets', 8),
  (v_group3, 'Glass Clips', 9), (v_group3, 'Spider Fittings', 10), (v_group3, 'Bathroom Mirrors', 11), (v_group3, 'Decorative Wall Mirrors', 12),
  (v_group3, 'SS Mosquito Mesh', 13), (v_group3, 'Velcro Mesh', 14);

  INSERT INTO material_items (group_id, name, sort_order) VALUES
  (v_group4, 'Gypsum Boards', 1), (v_group4, 'POP False Ceiling', 2), (v_group4, 'Grid Ceiling', 3), (v_group4, 'PVC Ceiling Panels', 4),
  (v_group4, 'Wall Putty', 5), (v_group4, 'Wall Primer', 6), (v_group4, 'Interior Emulsion Paint', 7), (v_group4, 'Exterior Emulsion Paint', 8),
  (v_group4, 'Wallpapers', 9), (v_group4, 'Charcoal Louvers', 10), (v_group4, 'WPC Wall Panels', 11), (v_group4, 'Vitrified Tiles', 12),
  (v_group4, 'Italian Marble', 13), (v_group4, 'Granite', 14), (v_group4, 'Wooden Flooring', 15), (v_group4, 'Profile Handles', 16),
  (v_group4, 'Tandem Boxes', 17), (v_group4, 'Pull-Out Baskets', 18), (v_group4, 'Hettich Fittings', 19), (v_group4, 'Hafele Fittings', 20);

  INSERT INTO material_items (group_id, name, sort_order) VALUES
  (v_group5, 'PVC Drainage Pipes', 1), (v_group5, 'CPVC Hot/Cold Pipes', 2), (v_group5, 'UPVC Main Lines', 3), (v_group5, 'Pipe Elbows', 4),
  (v_group5, 'Pipe Tee Fittings', 5), (v_group5, 'Union Fittings', 6), (v_group5, 'Couplers', 7), (v_group5, 'End Caps', 8),
  (v_group5, 'Reducers', 9), (v_group5, 'Wall-Hung Closets', 10), (v_group5, 'Floor Mount EWC', 11), (v_group5, 'Wash Basins', 12),
  (v_group5, 'Health Faucets', 13), (v_group5, 'Wall Mixers', 14), (v_group5, 'Diverters', 15), (v_group5, 'Pillar Cocks', 16),
  (v_group5, 'Waste Pipes', 17), (v_group5, 'Bottle Traps', 18), (v_group5, 'Teflon Tape', 19), (v_group5, 'Solvent Cement', 20),
  (v_group5, 'Overhead Water Tank', 21);

  INSERT INTO material_items (group_id, name, sort_order) VALUES
  (v_group6, 'PVC Conduit Pipes (Heavy-Duty)', 1), (v_group6, 'PVC Conduit Pipes (Medium)', 2), (v_group6, 'FR Wires', 3), (v_group6, 'FRLS Wires', 4),
  (v_group6, 'Modular Switches', 5), (v_group6, 'Modular Sockets', 6), (v_group6, 'Dimmers', 7), (v_group6, 'Step Regulators', 8),
  (v_group6, 'MCB', 9), (v_group6, 'RCCB', 10), (v_group6, 'Isolators', 11), (v_group6, 'Distribution Boards', 12),
  (v_group6, 'Metal Concealed Boxes', 13), (v_group6, 'PVC Surface Boxes', 14), (v_group6, 'LED Downlights', 15), (v_group6, 'COB Strip Lights', 16),
  (v_group6, 'Profile Lights', 17), (v_group6, 'Chandeliers', 18), (v_group6, 'Chemical Earthing Kit', 19), (v_group6, 'Copper Earthing Strips', 20);

  INSERT INTO material_items (group_id, name, sort_order) VALUES
  (v_group7, 'Screws', 1), (v_group7, 'Star Nails', 2), (v_group7, 'Concrete Nails', 3), (v_group7, 'Wall Plugs', 4),
  (v_group7, 'Digital Door Locks', 5), (v_group7, 'Cylindrical Door Locks', 6), (v_group7, 'Curtain Tracks', 7), (v_group7, 'Curtain Brackets', 8),
  (v_group7, 'Curtain Finials', 9);
END $$;
