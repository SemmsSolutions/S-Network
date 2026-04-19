-- Seed categories from memory.md
insert into categories (name, slug, icon) values 
('Civil Contractor', 'civil-contractor', '👷'),
('Residential Builder', 'residential-builder', '🏠'),
('Commercial Contractor', 'commercial-contractor', '🏢'),
('Turnkey Contractor', 'turnkey-contractor', '🔑'),
('Architect', 'architect', '📐'),
('Interior Designer', 'interior-designer', '🎨'),
('Electrician', 'electrician', '⚡'),
('Plumber / Waterproofing', 'plumber-waterproofing', '🔧'),
('Material Supplier', 'material-supplier', '🧱')
on conflict (slug) do nothing;
