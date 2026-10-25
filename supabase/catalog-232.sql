-- ============================================================
-- MegaTarps Product Seed Data
-- Source: Xpose Safety Catalog + MegaTarps Shopify Store
-- Generated: April 2026
--
-- INSTRUCTIONS FOR FARSHID:
-- 1. retail_price_cents = Your displayed retail price (per unit)
--    → Set these based on Amazon/Home Depot retail or your markup
-- 2. cost_price_cents = Your cost from Xpose (per unit)
--    → Fill from your weekly Xpose invoices
-- 3. Run this SQL against your Supabase database
-- 4. Products with retail_price_cents = 0 are placeholders
-- ============================================================

-- ============================================================
-- PRODUCT LINES TABLE (Reference for AI Agent Knowledge Base)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_lines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  thickness_mil INTEGER,
  material TEXT NOT NULL,
  weave_count TEXT,
  weight_oz_per_sqyd NUMERIC,
  grommet_type TEXT NOT NULL,
  grommet_spacing_inches INTEGER NOT NULL,
  uv_resistant BOOLEAN DEFAULT true,
  waterproof BOOLEAN DEFAULT true,
  mildew_resistant BOOLEAN DEFAULT true,
  fire_retardant BOOLEAN DEFAULT false,
  reinforced_corners BOOLEAN DEFAULT false,
  sewn_in_rope BOOLEAN DEFAULT false,
  description TEXT
);

INSERT INTO product_lines VALUES
('5mil-multi',   '5-Mil Multipurpose Tarps',        5,  'Polyethylene', '10x10', NULL, 'aluminum', 18, true, true, true, false, false, true,
 'Quality multi-purpose poly tarp. Double-sided laminated coating, heat-sealed seams. Good for light to medium duty temporary coverage, painting drop cloths, camping, and general protection.'),

('10mil-heavy',  '10-Mil Heavy Duty Tarps',         10, 'Polyethylene', '14x14', NULL, 'aluminum', 18, true, true, true, false, true, true,
 'Heavy duty polyethylene tarp with higher fabric weave count. Sturdy plastic reinforced corners. Ideal for construction sites, roofing projects, equipment coverage, hay protection, and long-term outdoor storage.'),

('12mil-xheavy', '12-Mil Extra Heavy Duty Tarps',   12, 'Polyethylene', '14x14', NULL, 'aluminum', 18, true, true, true, false, true, true,
 'Extra heavy duty white polyethylene tarp. Higher weave count for increased tear resistance. Perfect for industrial warehouse coverage, construction weatherproofing, and commercial applications requiring high visibility white color.'),

('16mil-super',  '16-Mil Super Heavy Duty Tarps',   16, 'Polyethylene', '16x16', 8,    'brass',    18, true, true, true, false, true, true,
 'Super heavy duty polyethylene tarp. 8oz per square yard density with 16x16 weave count for exceptional strength. Brass grommets for superior corrosion resistance. Best seller for contractors. Ideal for permanent outdoor installations, heavy equipment, and demanding jobsite conditions.'),

('20mil-ultra',  '20-Mil Ultra Heavy Duty Tarps',   20, 'Polyethylene', '16x16', NULL, 'brass',    18, true, true, true, false, true, true,
 'Ultra heavy duty polyethylene tarp. Maximum thickness and durability. Brass grommets every 18 inches. For the most demanding applications: permanent outdoor coverage, industrial equipment, year-round agricultural protection.'),

('canvas',       'Canvas Tarps',                    NULL, 'Cotton Canvas', NULL, 10,   'rust-proof', 24, false, false, false, false, false, false,
 '10oz cotton canvas tarp. Water-resistant (not waterproof). Double stitched hem. Breathable — ideal for covering items that need air circulation. Perfect for machinery, vehicles, and materials that should not trap moisture.'),

('clear-20mil',  'Clear Vinyl Tarps (20 Mil)',      20, 'PVC Vinyl',    NULL,  NULL,  'brass',    24, true, true, true, false, false, false,
 'Heavy duty 20 mil clear vinyl tarp. Optically super clear for visibility. 100% waterproof. Cold resistant to -30°F. Ideal for enclosures, windbreaks, restaurant patios, and any application where see-through weatherproofing is needed.'),

('clear-30mil',  'Clear Vinyl Tarps (30 Mil)',      30, 'PVC Vinyl',    NULL,  NULL,  'brass',    24, true, true, true, false, false, false,
 'Super heavy duty 30 mil clear vinyl tarp. Maximum clarity and thickness for permanent installations. 100% waterproof. Cold resistant. Best for commercial enclosures and high-wind environments.'),

('mesh',         'Mesh Tarps',                      NULL, 'Polypropylene', NULL, NULL, 'brass',    24, true, false, true, false, false, false,
 'Black mesh polypropylene tarp. Double-stitched hems, tear resistant. Provides 60% shade while allowing airflow. Perfect for shade structures, privacy screens, debris containment, dump trucks, and fence covers.'),

('fr-clear',     'Fire Retardant Clear Vinyl Tarps', 20, 'PVC Vinyl',   NULL,  NULL,  'brass',    24, true, true, true, true, false, false,
 'Fire retardant 20 mil clear vinyl tarp. Meets fire code requirements. 100% waterproof. Optically clear. Required for commercial construction in many jurisdictions. Ideal for welding curtains and fire-rated enclosures.'),

('fr-poly',      'Fire Retardant Poly Tarps',       12, 'Polyethylene', NULL,  NULL,  'aluminum', 18, true, true, true, true, true, true,
 'Fire retardant extra heavy duty white polyethylene tarp. Meets fire retardant specifications. Required for certain commercial and institutional projects. Higher fabric weave count with reinforced construction.');


-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  xpose_sku TEXT UNIQUE NOT NULL,
  mega_sku TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  product_line_id TEXT REFERENCES product_lines(id),
  
  -- Classification
  categories TEXT[] NOT NULL,          -- Can belong to multiple: {"construction-roofing","agriculture"}
  tarp_type TEXT NOT NULL,
  thickness_mil INTEGER,
  
  -- Dimensions
  width_ft INTEGER NOT NULL,
  length_ft INTEGER NOT NULL,
  coverage_sqft INTEGER GENERATED ALWAYS AS (width_ft * length_ft) STORED,
  
  -- Color
  color TEXT NOT NULL,
  color_hex TEXT,                       -- For UI swatches
  
  -- Pricing (FARSHID: Fill these from Xpose invoices + your markup)
  retail_price_cents INTEGER NOT NULL DEFAULT 0,   -- Per-unit retail price displayed on site
  cost_price_cents INTEGER DEFAULT 0,              -- Per-unit cost from Xpose (admin only)
  
  -- Pallet info
  units_per_half_pallet INTEGER,
  units_per_full_pallet INTEGER,
  
  -- Images
  image_urls JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  active BOOLEAN DEFAULT true,
  in_stock BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- 5-MIL MULTIPURPOSE TARPS — Blue
-- ============================================================
INSERT INTO products (xpose_sku, name, slug, product_line_id, categories, tarp_type, thickness_mil, width_ft, length_ft, color, color_hex) VALUES
('BT-57',     '5-Mil Blue Multipurpose Tarp 5x7',     '5mil-blue-5x7',     '5mil-multi', '{"general-purpose"}',         'poly', 5, 5, 7, 'blue', '#2563EB'),
('BT-68',     '5-Mil Blue Multipurpose Tarp 6x8',     '5mil-blue-6x8',     '5mil-multi', '{"general-purpose"}',         'poly', 5, 6, 8, 'blue', '#2563EB'),
('BT-810',    '5-Mil Blue Multipurpose Tarp 8x10',    '5mil-blue-8x10',    '5mil-multi', '{"general-purpose"}',         'poly', 5, 8, 10, 'blue', '#2563EB'),
('BT-812',    '5-Mil Blue Multipurpose Tarp 8x12',    '5mil-blue-8x12',    '5mil-multi', '{"general-purpose"}',         'poly', 5, 8, 12, 'blue', '#2563EB'),
('BT-815',    '5-Mil Blue Multipurpose Tarp 8x15',    '5mil-blue-8x15',    '5mil-multi', '{"general-purpose"}',         'poly', 5, 8, 15, 'blue', '#2563EB'),
('BT-912',    '5-Mil Blue Multipurpose Tarp 9x12',    '5mil-blue-9x12',    '5mil-multi', '{"general-purpose"}',         'poly', 5, 9, 12, 'blue', '#2563EB'),
('BT-1010',   '5-Mil Blue Multipurpose Tarp 10x10',   '5mil-blue-10x10',   '5mil-multi', '{"general-purpose"}',         'poly', 5, 10, 10, 'blue', '#2563EB'),
('BT-1012',   '5-Mil Blue Multipurpose Tarp 10x12',   '5mil-blue-10x12',   '5mil-multi', '{"general-purpose"}',         'poly', 5, 10, 12, 'blue', '#2563EB'),
('BT-1015',   '5-Mil Blue Multipurpose Tarp 10x15',   '5mil-blue-10x15',   '5mil-multi', '{"general-purpose"}',         'poly', 5, 10, 15, 'blue', '#2563EB'),
('BT-1016',   '5-Mil Blue Multipurpose Tarp 10x16',   '5mil-blue-10x16',   '5mil-multi', '{"general-purpose"}',         'poly', 5, 10, 16, 'blue', '#2563EB'),
('BT-1018',   '5-Mil Blue Multipurpose Tarp 10x18',   '5mil-blue-10x18',   '5mil-multi', '{"general-purpose"}',         'poly', 5, 10, 18, 'blue', '#2563EB'),
('BT-1020',   '5-Mil Blue Multipurpose Tarp 10x20',   '5mil-blue-10x20',   '5mil-multi', '{"general-purpose"}',         'poly', 5, 10, 20, 'blue', '#2563EB'),
('BT-1022',   '5-Mil Blue Multipurpose Tarp 10x22',   '5mil-blue-10x22',   '5mil-multi', '{"general-purpose"}',         'poly', 5, 10, 22, 'blue', '#2563EB'),
('BT-1212',   '5-Mil Blue Multipurpose Tarp 12x12',   '5mil-blue-12x12',   '5mil-multi', '{"general-purpose"}',         'poly', 5, 12, 12, 'blue', '#2563EB'),
('BT-1214',   '5-Mil Blue Multipurpose Tarp 12x14',   '5mil-blue-12x14',   '5mil-multi', '{"general-purpose"}',         'poly', 5, 12, 14, 'blue', '#2563EB'),
('BT-1216',   '5-Mil Blue Multipurpose Tarp 12x16',   '5mil-blue-12x16',   '5mil-multi', '{"general-purpose"}',         'poly', 5, 12, 16, 'blue', '#2563EB'),
('BT-1218',   '5-Mil Blue Multipurpose Tarp 12x18',   '5mil-blue-12x18',   '5mil-multi', '{"general-purpose"}',         'poly', 5, 12, 18, 'blue', '#2563EB'),
('BT-1220',   '5-Mil Blue Multipurpose Tarp 12x20',   '5mil-blue-12x20',   '5mil-multi', '{"general-purpose"}',         'poly', 5, 12, 20, 'blue', '#2563EB'),
('BT-1222',   '5-Mil Blue Multipurpose Tarp 12x22',   '5mil-blue-12x22',   '5mil-multi', '{"general-purpose"}',         'poly', 5, 12, 22, 'blue', '#2563EB'),
('BT-1225',   '5-Mil Blue Multipurpose Tarp 12x25',   '5mil-blue-12x25',   '5mil-multi', '{"general-purpose"}',         'poly', 5, 12, 25, 'blue', '#2563EB'),
('BT-1520',   '5-Mil Blue Multipurpose Tarp 15x20',   '5mil-blue-15x20',   '5mil-multi', '{"general-purpose","construction-roofing"}', 'poly', 5, 15, 20, 'blue', '#2563EB'),
('BT-1525',   '5-Mil Blue Multipurpose Tarp 15x25',   '5mil-blue-15x25',   '5mil-multi', '{"general-purpose","construction-roofing"}', 'poly', 5, 15, 25, 'blue', '#2563EB'),
('BT-1530',   '5-Mil Blue Multipurpose Tarp 15x30',   '5mil-blue-15x30',   '5mil-multi', '{"general-purpose","construction-roofing"}', 'poly', 5, 15, 30, 'blue', '#2563EB'),
('BT-1620',   '5-Mil Blue Multipurpose Tarp 16x20',   '5mil-blue-16x20',   '5mil-multi', '{"general-purpose","construction-roofing"}', 'poly', 5, 16, 20, 'blue', '#2563EB'),
('BT-1824',   '5-Mil Blue Multipurpose Tarp 18x24',   '5mil-blue-18x24',   '5mil-multi', '{"general-purpose","construction-roofing"}', 'poly', 5, 18, 24, 'blue', '#2563EB'),
('BT-2020',   '5-Mil Blue Multipurpose Tarp 20x20',   '5mil-blue-20x20',   '5mil-multi', '{"general-purpose","construction-roofing","agriculture"}', 'poly', 5, 20, 20, 'blue', '#2563EB'),
('BT-2025',   '5-Mil Blue Multipurpose Tarp 20x25',   '5mil-blue-20x25',   '5mil-multi', '{"general-purpose","construction-roofing","agriculture"}', 'poly', 5, 20, 25, 'blue', '#2563EB'),
('BT-2030',   '5-Mil Blue Multipurpose Tarp 20x30',   '5mil-blue-20x30',   '5mil-multi', '{"construction-roofing","agriculture"}', 'poly', 5, 20, 30, 'blue', '#2563EB'),
('BT-2035',   '5-Mil Blue Multipurpose Tarp 20x35',   '5mil-blue-20x35',   '5mil-multi', '{"construction-roofing","agriculture"}', 'poly', 5, 20, 35, 'blue', '#2563EB'),
('BT-2040',   '5-Mil Blue Multipurpose Tarp 20x40',   '5mil-blue-20x40',   '5mil-multi', '{"construction-roofing","agriculture","industrial"}', 'poly', 5, 20, 40, 'blue', '#2563EB'),
('BT-2436',   '5-Mil Blue Multipurpose Tarp 24x36',   '5mil-blue-24x36',   '5mil-multi', '{"construction-roofing","agriculture","industrial"}', 'poly', 5, 24, 36, 'blue', '#2563EB'),
('BT-2540',   '5-Mil Blue Multipurpose Tarp 25x40',   '5mil-blue-25x40',   '5mil-multi', '{"construction-roofing","agriculture","industrial"}', 'poly', 5, 25, 40, 'blue', '#2563EB'),
('BT-3030',   '5-Mil Blue Multipurpose Tarp 30x30',   '5mil-blue-30x30',   '5mil-multi', '{"construction-roofing","agriculture","industrial"}', 'poly', 5, 30, 30, 'blue', '#2563EB'),
('BT-3040',   '5-Mil Blue Multipurpose Tarp 30x40',   '5mil-blue-30x40',   '5mil-multi', '{"construction-roofing","agriculture","industrial"}', 'poly', 5, 30, 40, 'blue', '#2563EB'),
('BT-3050',   '5-Mil Blue Multipurpose Tarp 30x50',   '5mil-blue-30x50',   '5mil-multi', '{"construction-roofing","agriculture","industrial"}', 'poly', 5, 30, 50, 'blue', '#2563EB'),
('BT-3060',   '5-Mil Blue Multipurpose Tarp 30x60',   '5mil-blue-30x60',   '5mil-multi', '{"construction-roofing","agriculture","industrial"}', 'poly', 5, 30, 60, 'blue', '#2563EB'),
('BT-4040',   '5-Mil Blue Multipurpose Tarp 40x40',   '5mil-blue-40x40',   '5mil-multi', '{"agriculture","industrial"}', 'poly', 5, 40, 40, 'blue', '#2563EB'),
('BT-4050',   '5-Mil Blue Multipurpose Tarp 40x50',   '5mil-blue-40x50',   '5mil-multi', '{"agriculture","industrial"}', 'poly', 5, 40, 50, 'blue', '#2563EB'),
('BT-4060',   '5-Mil Blue Multipurpose Tarp 40x60',   '5mil-blue-40x60',   '5mil-multi', '{"agriculture","industrial"}', 'poly', 5, 40, 60, 'blue', '#2563EB'),
('BT-5050',   '5-Mil Blue Multipurpose Tarp 50x50',   '5mil-blue-50x50',   '5mil-multi', '{"agriculture","industrial"}', 'poly', 5, 50, 50, 'blue', '#2563EB'),
('BT-50100',  '5-Mil Blue Multipurpose Tarp 50x100',  '5mil-blue-50x100',  '5mil-multi', '{"agriculture","industrial"}', 'poly', 5, 50, 100, 'blue', '#2563EB'),
('BT-100100', '5-Mil Blue Multipurpose Tarp 100x100', '5mil-blue-100x100', '5mil-multi', '{"agriculture","industrial"}', 'poly', 5, 100, 100, 'blue', '#2563EB');


-- ============================================================
-- 10-MIL HEAVY DUTY — Silver/Black (Best sellers for contractors)
-- ============================================================
INSERT INTO products (xpose_sku, name, slug, product_line_id, categories, tarp_type, thickness_mil, width_ft, length_ft, color, color_hex) VALUES
('STH-57',     '10-Mil Silver/Black Heavy Duty Tarp 5x7',     '10mil-silver-5x7',     '10mil-heavy', '{"general-purpose"}', 'poly', 10, 5, 7, 'silver-black', '#9CA3AF'),
('STH-68',     '10-Mil Silver/Black Heavy Duty Tarp 6x8',     '10mil-silver-6x8',     '10mil-heavy', '{"general-purpose"}', 'poly', 10, 6, 8, 'silver-black', '#9CA3AF'),
('STH-810',    '10-Mil Silver/Black Heavy Duty Tarp 8x10',    '10mil-silver-8x10',    '10mil-heavy', '{"general-purpose","construction-roofing"}', 'poly', 10, 8, 10, 'silver-black', '#9CA3AF'),
('STH-912',    '10-Mil Silver/Black Heavy Duty Tarp 9x12',    '10mil-silver-9x12',    '10mil-heavy', '{"general-purpose","construction-roofing"}', 'poly', 10, 9, 12, 'silver-black', '#9CA3AF'),
('STH-1010',   '10-Mil Silver/Black Heavy Duty Tarp 10x10',   '10mil-silver-10x10',   '10mil-heavy', '{"construction-roofing"}', 'poly', 10, 10, 10, 'silver-black', '#9CA3AF'),
('STH-1012',   '10-Mil Silver/Black Heavy Duty Tarp 10x12',   '10mil-silver-10x12',   '10mil-heavy', '{"construction-roofing"}', 'poly', 10, 10, 12, 'silver-black', '#9CA3AF'),
('STH-1015',   '10-Mil Silver/Black Heavy Duty Tarp 10x15',   '10mil-silver-10x15',   '10mil-heavy', '{"construction-roofing"}', 'poly', 10, 10, 15, 'silver-black', '#9CA3AF'),
('STH-1020',   '10-Mil Silver/Black Heavy Duty Tarp 10x20',   '10mil-silver-10x20',   '10mil-heavy', '{"construction-roofing","agriculture"}', 'poly', 10, 10, 20, 'silver-black', '#9CA3AF'),
('STH-1212',   '10-Mil Silver/Black Heavy Duty Tarp 12x12',   '10mil-silver-12x12',   '10mil-heavy', '{"construction-roofing"}', 'poly', 10, 12, 12, 'silver-black', '#9CA3AF'),
('STH-1214',   '10-Mil Silver/Black Heavy Duty Tarp 12x14',   '10mil-silver-12x14',   '10mil-heavy', '{"construction-roofing"}', 'poly', 10, 12, 14, 'silver-black', '#9CA3AF'),
('STH-1216',   '10-Mil Silver/Black Heavy Duty Tarp 12x16',   '10mil-silver-12x16',   '10mil-heavy', '{"construction-roofing"}', 'poly', 10, 12, 16, 'silver-black', '#9CA3AF'),
('STH-1220',   '10-Mil Silver/Black Heavy Duty Tarp 12x20',   '10mil-silver-12x20',   '10mil-heavy', '{"construction-roofing","agriculture"}', 'poly', 10, 12, 20, 'silver-black', '#9CA3AF'),
('STH-1225',   '10-Mil Silver/Black Heavy Duty Tarp 12x25',   '10mil-silver-12x25',   '10mil-heavy', '{"construction-roofing","agriculture"}', 'poly', 10, 12, 25, 'silver-black', '#9CA3AF'),
('STH-1414',   '10-Mil Silver/Black Heavy Duty Tarp 14x14',   '10mil-silver-14x14',   '10mil-heavy', '{"construction-roofing"}', 'poly', 10, 14, 14, 'silver-black', '#9CA3AF'),
('STH-1520',   '10-Mil Silver/Black Heavy Duty Tarp 15x20',   '10mil-silver-15x20',   '10mil-heavy', '{"construction-roofing","agriculture"}', 'poly', 10, 15, 20, 'silver-black', '#9CA3AF'),
('STH-1525',   '10-Mil Silver/Black Heavy Duty Tarp 15x25',   '10mil-silver-15x25',   '10mil-heavy', '{"construction-roofing","agriculture"}', 'poly', 10, 15, 25, 'silver-black', '#9CA3AF'),
('STH-1530',   '10-Mil Silver/Black Heavy Duty Tarp 15x30',   '10mil-silver-15x30',   '10mil-heavy', '{"construction-roofing","agriculture"}', 'poly', 10, 15, 30, 'silver-black', '#9CA3AF'),
('STH-1620',   '10-Mil Silver/Black Heavy Duty Tarp 16x20',   '10mil-silver-16x20',   '10mil-heavy', '{"construction-roofing","agriculture"}', 'poly', 10, 16, 20, 'silver-black', '#9CA3AF'),
('STH-1824',   '10-Mil Silver/Black Heavy Duty Tarp 18x24',   '10mil-silver-18x24',   '10mil-heavy', '{"construction-roofing","agriculture"}', 'poly', 10, 18, 24, 'silver-black', '#9CA3AF'),
('STH-2020',   '10-Mil Silver/Black Heavy Duty Tarp 20x20',   '10mil-silver-20x20',   '10mil-heavy', '{"construction-roofing","agriculture","industrial"}', 'poly', 10, 20, 20, 'silver-black', '#9CA3AF'),
('STH-2025',   '10-Mil Silver/Black Heavy Duty Tarp 20x25',   '10mil-silver-20x25',   '10mil-heavy', '{"construction-roofing","agriculture","industrial"}', 'poly', 10, 20, 25, 'silver-black', '#9CA3AF'),
('STH-2030',   '10-Mil Silver/Black Heavy Duty Tarp 20x30',   '10mil-silver-20x30',   '10mil-heavy', '{"construction-roofing","agriculture","industrial"}', 'poly', 10, 20, 30, 'silver-black', '#9CA3AF'),
('STH-2035',   '10-Mil Silver/Black Heavy Duty Tarp 20x35',   '10mil-silver-20x35',   '10mil-heavy', '{"construction-roofing","agriculture","industrial"}', 'poly', 10, 20, 35, 'silver-black', '#9CA3AF'),
('STH-2040',   '10-Mil Silver/Black Heavy Duty Tarp 20x40',   '10mil-silver-20x40',   '10mil-heavy', '{"construction-roofing","agriculture","industrial"}', 'poly', 10, 20, 40, 'silver-black', '#9CA3AF'),
('STH-2540',   '10-Mil Silver/Black Heavy Duty Tarp 25x40',   '10mil-silver-25x40',   '10mil-heavy', '{"construction-roofing","agriculture","industrial"}', 'poly', 10, 25, 40, 'silver-black', '#9CA3AF'),
('STH-3030',   '10-Mil Silver/Black Heavy Duty Tarp 30x30',   '10mil-silver-30x30',   '10mil-heavy', '{"agriculture","industrial"}', 'poly', 10, 30, 30, 'silver-black', '#9CA3AF'),
('STH-3040',   '10-Mil Silver/Black Heavy Duty Tarp 30x40',   '10mil-silver-30x40',   '10mil-heavy', '{"agriculture","industrial"}', 'poly', 10, 30, 40, 'silver-black', '#9CA3AF'),
('STH-3050',   '10-Mil Silver/Black Heavy Duty Tarp 30x50',   '10mil-silver-30x50',   '10mil-heavy', '{"agriculture","industrial"}', 'poly', 10, 30, 50, 'silver-black', '#9CA3AF'),
('STH-3060',   '10-Mil Silver/Black Heavy Duty Tarp 30x60',   '10mil-silver-30x60',   '10mil-heavy', '{"agriculture","industrial"}', 'poly', 10, 30, 60, 'silver-black', '#9CA3AF'),
('STH-4040',   '10-Mil Silver/Black Heavy Duty Tarp 40x40',   '10mil-silver-40x40',   '10mil-heavy', '{"agriculture","industrial"}', 'poly', 10, 40, 40, 'silver-black', '#9CA3AF'),
('STH-4050',   '10-Mil Silver/Black Heavy Duty Tarp 40x50',   '10mil-silver-40x50',   '10mil-heavy', '{"agriculture","industrial"}', 'poly', 10, 40, 50, 'silver-black', '#9CA3AF'),
('STH-4060',   '10-Mil Silver/Black Heavy Duty Tarp 40x60',   '10mil-silver-40x60',   '10mil-heavy', '{"agriculture","industrial"}', 'poly', 10, 40, 60, 'silver-black', '#9CA3AF'),
('STH-5050',   '10-Mil Silver/Black Heavy Duty Tarp 50x50',   '10mil-silver-50x50',   '10mil-heavy', '{"agriculture","industrial"}', 'poly', 10, 50, 50, 'silver-black', '#9CA3AF'),
('STH-50100',  '10-Mil Silver/Black Heavy Duty Tarp 50x100',  '10mil-silver-50x100',  '10mil-heavy', '{"agriculture","industrial"}', 'poly', 10, 50, 100, 'silver-black', '#9CA3AF'),
('STH-6060',   '10-Mil Silver/Black Heavy Duty Tarp 60x60',   '10mil-silver-60x60',   '10mil-heavy', '{"agriculture","industrial"}', 'poly', 10, 60, 60, 'silver-black', '#9CA3AF'),
('STH-100100', '10-Mil Silver/Black Heavy Duty Tarp 100x100', '10mil-silver-100x100', '10mil-heavy', '{"agriculture","industrial"}', 'poly', 10, 100, 100, 'silver-black', '#9CA3AF');


-- ============================================================
-- 16-MIL SUPER HEAVY DUTY — Brown (Contractor favorite)
-- ============================================================
INSERT INTO products (xpose_sku, name, slug, product_line_id, categories, tarp_type, thickness_mil, width_ft, length_ft, color, color_hex) VALUES
('BHD-57',    '16-Mil Brown Super Heavy Duty Tarp 5x7',    '16mil-brown-5x7',    '16mil-super', '{"general-purpose"}', 'poly', 16, 5, 7, 'brown', '#78350F'),
('BHD-68',    '16-Mil Brown Super Heavy Duty Tarp 6x8',    '16mil-brown-6x8',    '16mil-super', '{"general-purpose"}', 'poly', 16, 6, 8, 'brown', '#78350F'),
('BHD-420',   '16-Mil Brown Super Heavy Duty Tarp 4x20',   '16mil-brown-4x20',   '16mil-super', '{"construction-roofing"}', 'poly', 16, 4, 20, 'brown', '#78350F'),
('BHD-620',   '16-Mil Brown Super Heavy Duty Tarp 6x20',   '16mil-brown-6x20',   '16mil-super', '{"construction-roofing"}', 'poly', 16, 6, 20, 'brown', '#78350F'),
('BHD-810',   '16-Mil Brown Super Heavy Duty Tarp 8x10',   '16mil-brown-8x10',   '16mil-super', '{"construction-roofing"}', 'poly', 16, 8, 10, 'brown', '#78350F'),
('BHD-1010',  '16-Mil Brown Super Heavy Duty Tarp 10x10',  '16mil-brown-10x10',  '16mil-super', '{"construction-roofing"}', 'poly', 16, 10, 10, 'brown', '#78350F'),
('BHD-1012',  '16-Mil Brown Super Heavy Duty Tarp 10x12',  '16mil-brown-10x12',  '16mil-super', '{"construction-roofing"}', 'poly', 16, 10, 12, 'brown', '#78350F'),
('BHD-1020',  '16-Mil Brown Super Heavy Duty Tarp 10x20',  '16mil-brown-10x20',  '16mil-super', '{"construction-roofing","agriculture"}', 'poly', 16, 10, 20, 'brown', '#78350F'),
('BHD-1216',  '16-Mil Brown Super Heavy Duty Tarp 12x16',  '16mil-brown-12x16',  '16mil-super', '{"construction-roofing"}', 'poly', 16, 12, 16, 'brown', '#78350F'),
('BHD-1220',  '16-Mil Brown Super Heavy Duty Tarp 12x20',  '16mil-brown-12x20',  '16mil-super', '{"construction-roofing","agriculture"}', 'poly', 16, 12, 20, 'brown', '#78350F'),
('BHD-1225',  '16-Mil Brown Super Heavy Duty Tarp 12x25',  '16mil-brown-12x25',  '16mil-super', '{"construction-roofing","agriculture"}', 'poly', 16, 12, 25, 'brown', '#78350F'),
('BHD-1230',  '16-Mil Brown Super Heavy Duty Tarp 12x30',  '16mil-brown-12x30',  '16mil-super', '{"construction-roofing","agriculture"}', 'poly', 16, 12, 30, 'brown', '#78350F'),
('BHD-1240',  '16-Mil Brown Super Heavy Duty Tarp 12x40',  '16mil-brown-12x40',  '16mil-super', '{"construction-roofing","agriculture","industrial"}', 'poly', 16, 12, 40, 'brown', '#78350F'),
('BHD-1515',  '16-Mil Brown Super Heavy Duty Tarp 15x15',  '16mil-brown-15x15',  '16mil-super', '{"construction-roofing"}', 'poly', 16, 15, 15, 'brown', '#78350F'),
('BHD-1540',  '16-Mil Brown Super Heavy Duty Tarp 15x40',  '16mil-brown-15x40',  '16mil-super', '{"construction-roofing","agriculture","industrial"}', 'poly', 16, 15, 40, 'brown', '#78350F'),
('BHD-1620',  '16-Mil Brown Super Heavy Duty Tarp 16x20',  '16mil-brown-16x20',  '16mil-super', '{"construction-roofing","agriculture"}', 'poly', 16, 16, 20, 'brown', '#78350F'),
('BHD-1824',  '16-Mil Brown Super Heavy Duty Tarp 18x24',  '16mil-brown-18x24',  '16mil-super', '{"construction-roofing","agriculture"}', 'poly', 16, 18, 24, 'brown', '#78350F'),
('BHD-2020',  '16-Mil Brown Super Heavy Duty Tarp 20x20',  '16mil-brown-20x20',  '16mil-super', '{"construction-roofing","agriculture","industrial"}', 'poly', 16, 20, 20, 'brown', '#78350F'),
('BHD-2030',  '16-Mil Brown Super Heavy Duty Tarp 20x30',  '16mil-brown-20x30',  '16mil-super', '{"construction-roofing","agriculture","industrial"}', 'poly', 16, 20, 30, 'brown', '#78350F'),
('BHD-2040',  '16-Mil Brown Super Heavy Duty Tarp 20x40',  '16mil-brown-20x40',  '16mil-super', '{"construction-roofing","agriculture","industrial"}', 'poly', 16, 20, 40, 'brown', '#78350F'),
('BHD-2436',  '16-Mil Brown Super Heavy Duty Tarp 24x36',  '16mil-brown-24x36',  '16mil-super', '{"construction-roofing","agriculture","industrial"}', 'poly', 16, 24, 36, 'brown', '#78350F'),
('BHD-2545',  '16-Mil Brown Super Heavy Duty Tarp 25x45',  '16mil-brown-25x45',  '16mil-super', '{"agriculture","industrial"}', 'poly', 16, 25, 45, 'brown', '#78350F'),
('BHD-3030',  '16-Mil Brown Super Heavy Duty Tarp 30x30',  '16mil-brown-30x30',  '16mil-super', '{"agriculture","industrial"}', 'poly', 16, 30, 30, 'brown', '#78350F'),
('BHD-3040',  '16-Mil Brown Super Heavy Duty Tarp 30x40',  '16mil-brown-30x40',  '16mil-super', '{"agriculture","industrial"}', 'poly', 16, 30, 40, 'brown', '#78350F'),
('BHD-3050',  '16-Mil Brown Super Heavy Duty Tarp 30x50',  '16mil-brown-30x50',  '16mil-super', '{"agriculture","industrial"}', 'poly', 16, 30, 50, 'brown', '#78350F'),
('BHD-4060',  '16-Mil Brown Super Heavy Duty Tarp 40x60',  '16mil-brown-40x60',  '16mil-super', '{"agriculture","industrial"}', 'poly', 16, 40, 60, 'brown', '#78350F');


-- ============================================================
-- 20-MIL ULTRA HEAVY DUTY — Brown
-- ============================================================
INSERT INTO products (xpose_sku, name, slug, product_line_id, categories, tarp_type, thickness_mil, width_ft, length_ft, color, color_hex) VALUES
('UHD-57-X',    '20-Mil Brown Ultra Heavy Duty Tarp 5x7',    '20mil-brown-5x7',    '20mil-ultra', '{"general-purpose"}', 'poly', 20, 5, 7, 'brown', '#78350F'),
('UHD-68-X',    '20-Mil Brown Ultra Heavy Duty Tarp 6x8',    '20mil-brown-6x8',    '20mil-ultra', '{"general-purpose"}', 'poly', 20, 6, 8, 'brown', '#78350F'),
('UHD-420-X',   '20-Mil Brown Ultra Heavy Duty Tarp 4x20',   '20mil-brown-4x20',   '20mil-ultra', '{"construction-roofing"}', 'poly', 20, 4, 20, 'brown', '#78350F'),
('UHD-620-X',   '20-Mil Brown Ultra Heavy Duty Tarp 6x20',   '20mil-brown-6x20',   '20mil-ultra', '{"construction-roofing"}', 'poly', 20, 6, 20, 'brown', '#78350F'),
('UHD-810-X',   '20-Mil Brown Ultra Heavy Duty Tarp 8x10',   '20mil-brown-8x10',   '20mil-ultra', '{"construction-roofing"}', 'poly', 20, 8, 10, 'brown', '#78350F'),
('UHD-1010-X',  '20-Mil Brown Ultra Heavy Duty Tarp 10x10',  '20mil-brown-10x10',  '20mil-ultra', '{"construction-roofing"}', 'poly', 20, 10, 10, 'brown', '#78350F'),
('UHD-1012-X',  '20-Mil Brown Ultra Heavy Duty Tarp 10x12',  '20mil-brown-10x12',  '20mil-ultra', '{"construction-roofing"}', 'poly', 20, 10, 12, 'brown', '#78350F'),
('UHD-1020-X',  '20-Mil Brown Ultra Heavy Duty Tarp 10x20',  '20mil-brown-10x20',  '20mil-ultra', '{"construction-roofing","agriculture"}', 'poly', 20, 10, 20, 'brown', '#78350F'),
('UHD-1216-X',  '20-Mil Brown Ultra Heavy Duty Tarp 12x16',  '20mil-brown-12x16',  '20mil-ultra', '{"construction-roofing"}', 'poly', 20, 12, 16, 'brown', '#78350F'),
('UHD-1220-X',  '20-Mil Brown Ultra Heavy Duty Tarp 12x20',  '20mil-brown-12x20',  '20mil-ultra', '{"construction-roofing","agriculture"}', 'poly', 20, 12, 20, 'brown', '#78350F'),
('UHD-1225-X',  '20-Mil Brown Ultra Heavy Duty Tarp 12x25',  '20mil-brown-12x25',  '20mil-ultra', '{"construction-roofing","agriculture"}', 'poly', 20, 12, 25, 'brown', '#78350F'),
('UHD-1230-X',  '20-Mil Brown Ultra Heavy Duty Tarp 12x30',  '20mil-brown-12x30',  '20mil-ultra', '{"construction-roofing","agriculture"}', 'poly', 20, 12, 30, 'brown', '#78350F'),
('UHD-1240-X',  '20-Mil Brown Ultra Heavy Duty Tarp 12x40',  '20mil-brown-12x40',  '20mil-ultra', '{"construction-roofing","agriculture","industrial"}', 'poly', 20, 12, 40, 'brown', '#78350F'),
('UHD-1515-X',  '20-Mil Brown Ultra Heavy Duty Tarp 15x15',  '20mil-brown-15x15',  '20mil-ultra', '{"construction-roofing"}', 'poly', 20, 15, 15, 'brown', '#78350F'),
('UHD-1540-X',  '20-Mil Brown Ultra Heavy Duty Tarp 15x40',  '20mil-brown-15x40',  '20mil-ultra', '{"construction-roofing","agriculture","industrial"}', 'poly', 20, 15, 40, 'brown', '#78350F'),
('UHD-1620-X',  '20-Mil Brown Ultra Heavy Duty Tarp 16x20',  '20mil-brown-16x20',  '20mil-ultra', '{"construction-roofing","agriculture"}', 'poly', 20, 16, 20, 'brown', '#78350F'),
('UHD-1824-X',  '20-Mil Brown Ultra Heavy Duty Tarp 18x24',  '20mil-brown-18x24',  '20mil-ultra', '{"construction-roofing","agriculture"}', 'poly', 20, 18, 24, 'brown', '#78350F'),
('UHD-2020-X',  '20-Mil Brown Ultra Heavy Duty Tarp 20x20',  '20mil-brown-20x20',  '20mil-ultra', '{"construction-roofing","agriculture","industrial"}', 'poly', 20, 20, 20, 'brown', '#78350F'),
('UHD-2030-X',  '20-Mil Brown Ultra Heavy Duty Tarp 20x30',  '20mil-brown-20x30',  '20mil-ultra', '{"construction-roofing","agriculture","industrial"}', 'poly', 20, 20, 30, 'brown', '#78350F'),
('UHD-2040-X',  '20-Mil Brown Ultra Heavy Duty Tarp 20x40',  '20mil-brown-20x40',  '20mil-ultra', '{"construction-roofing","agriculture","industrial"}', 'poly', 20, 20, 40, 'brown', '#78350F'),
('UHD-2436-X',  '20-Mil Brown Ultra Heavy Duty Tarp 24x36',  '20mil-brown-24x36',  '20mil-ultra', '{"construction-roofing","agriculture","industrial"}', 'poly', 20, 24, 36, 'brown', '#78350F'),
('UHD-2545-X',  '20-Mil Brown Ultra Heavy Duty Tarp 25x45',  '20mil-brown-25x45',  '20mil-ultra', '{"agriculture","industrial"}', 'poly', 20, 25, 45, 'brown', '#78350F'),
('UHD-3030-X',  '20-Mil Brown Ultra Heavy Duty Tarp 30x30',  '20mil-brown-30x30',  '20mil-ultra', '{"agriculture","industrial"}', 'poly', 20, 30, 30, 'brown', '#78350F'),
('UHD-3040-X',  '20-Mil Brown Ultra Heavy Duty Tarp 30x40',  '20mil-brown-30x40',  '20mil-ultra', '{"agriculture","industrial"}', 'poly', 20, 30, 40, 'brown', '#78350F'),
('UHD-3050-X',  '20-Mil Brown Ultra Heavy Duty Tarp 30x50',  '20mil-brown-30x50',  '20mil-ultra', '{"agriculture","industrial"}', 'poly', 20, 30, 50, 'brown', '#78350F'),
('UHD-4060-X',  '20-Mil Brown Ultra Heavy Duty Tarp 40x60',  '20mil-brown-40x60',  '20mil-ultra', '{"agriculture","industrial"}', 'poly', 20, 40, 60, 'brown', '#78350F');


-- ============================================================
-- CANVAS TARPS — Olive Drab (most popular canvas color)
-- ============================================================
INSERT INTO products (xpose_sku, name, slug, product_line_id, categories, tarp_type, thickness_mil, width_ft, length_ft, color, color_hex) VALUES
('CTOD10-57',   'Canvas Tarp 10oz Olive Drab 5x7',   'canvas-od-5x7',   'canvas', '{"general-purpose"}', 'canvas', NULL, 5, 7, 'olive-drab', '#4B5320'),
('CTOD10-68',   'Canvas Tarp 10oz Olive Drab 6x8',   'canvas-od-6x8',   'canvas', '{"general-purpose"}', 'canvas', NULL, 6, 8, 'olive-drab', '#4B5320'),
('CTOD10-79',   'Canvas Tarp 10oz Olive Drab 7x9',   'canvas-od-7x9',   'canvas', '{"general-purpose"}', 'canvas', NULL, 7, 9, 'olive-drab', '#4B5320'),
('CTOD10-810',  'Canvas Tarp 10oz Olive Drab 8x10',  'canvas-od-8x10',  'canvas', '{"general-purpose","construction-roofing"}', 'canvas', NULL, 8, 10, 'olive-drab', '#4B5320'),
('CTOD10-812',  'Canvas Tarp 10oz Olive Drab 8x12',  'canvas-od-8x12',  'canvas', '{"general-purpose","construction-roofing"}', 'canvas', NULL, 8, 12, 'olive-drab', '#4B5320'),
('CTOD10-816',  'Canvas Tarp 10oz Olive Drab 8x16',  'canvas-od-8x16',  'canvas', '{"construction-roofing"}', 'canvas', NULL, 8, 16, 'olive-drab', '#4B5320'),
('CTOD10-1010', 'Canvas Tarp 10oz Olive Drab 10x10', 'canvas-od-10x10', 'canvas', '{"construction-roofing"}', 'canvas', NULL, 10, 10, 'olive-drab', '#4B5320'),
('CTOD10-1012', 'Canvas Tarp 10oz Olive Drab 10x12', 'canvas-od-10x12', 'canvas', '{"construction-roofing"}', 'canvas', NULL, 10, 12, 'olive-drab', '#4B5320'),
('CTOD10-1014', 'Canvas Tarp 10oz Olive Drab 10x14', 'canvas-od-10x14', 'canvas', '{"construction-roofing"}', 'canvas', NULL, 10, 14, 'olive-drab', '#4B5320'),
('CTOD10-1016', 'Canvas Tarp 10oz Olive Drab 10x16', 'canvas-od-10x16', 'canvas', '{"construction-roofing"}', 'canvas', NULL, 10, 16, 'olive-drab', '#4B5320'),
('CTOD10-1214', 'Canvas Tarp 10oz Olive Drab 12x14', 'canvas-od-12x14', 'canvas', '{"construction-roofing"}', 'canvas', NULL, 12, 14, 'olive-drab', '#4B5320'),
('CTOD10-1216', 'Canvas Tarp 10oz Olive Drab 12x16', 'canvas-od-12x16', 'canvas', '{"construction-roofing"}', 'canvas', NULL, 12, 16, 'olive-drab', '#4B5320'),
('CTOD10-1220', 'Canvas Tarp 10oz Olive Drab 12x20', 'canvas-od-12x20', 'canvas', '{"construction-roofing","agriculture"}', 'canvas', NULL, 12, 20, 'olive-drab', '#4B5320'),
('CTOD10-1224', 'Canvas Tarp 10oz Olive Drab 12x24', 'canvas-od-12x24', 'canvas', '{"construction-roofing","agriculture"}', 'canvas', NULL, 12, 24, 'olive-drab', '#4B5320'),
('CTOD10-1414', 'Canvas Tarp 10oz Olive Drab 14x14', 'canvas-od-14x14', 'canvas', '{"construction-roofing"}', 'canvas', NULL, 14, 14, 'olive-drab', '#4B5320'),
('CTOD10-1416', 'Canvas Tarp 10oz Olive Drab 14x16', 'canvas-od-14x16', 'canvas', '{"construction-roofing"}', 'canvas', NULL, 14, 16, 'olive-drab', '#4B5320'),
('CTOD10-1420', 'Canvas Tarp 10oz Olive Drab 14x20', 'canvas-od-14x20', 'canvas', '{"construction-roofing","agriculture"}', 'canvas', NULL, 14, 20, 'olive-drab', '#4B5320'),
('CTOD10-1620', 'Canvas Tarp 10oz Olive Drab 16x20', 'canvas-od-16x20', 'canvas', '{"construction-roofing","agriculture"}', 'canvas', NULL, 16, 20, 'olive-drab', '#4B5320'),
('CTOD10-2020', 'Canvas Tarp 10oz Olive Drab 20x20', 'canvas-od-20x20', 'canvas', '{"construction-roofing","agriculture","industrial"}', 'canvas', NULL, 20, 20, 'olive-drab', '#4B5320'),
('CTOD10-2030', 'Canvas Tarp 10oz Olive Drab 20x30', 'canvas-od-20x30', 'canvas', '{"construction-roofing","agriculture","industrial"}', 'canvas', NULL, 20, 30, 'olive-drab', '#4B5320'),
('CTOD10-2040', 'Canvas Tarp 10oz Olive Drab 20x40', 'canvas-od-20x40', 'canvas', '{"agriculture","industrial"}', 'canvas', NULL, 20, 40, 'olive-drab', '#4B5320');


-- ============================================================
-- MESH TARPS — Black
-- ============================================================
INSERT INTO products (xpose_sku, name, slug, product_line_id, categories, tarp_type, thickness_mil, width_ft, length_ft, color, color_hex) VALUES
('BMT-410',  'Black Mesh Tarp 4x10',  'mesh-black-4x10',  'mesh', '{"general-purpose"}', 'mesh', NULL, 4, 10, 'black', '#1F2937'),
('BMT-415',  'Black Mesh Tarp 4x15',  'mesh-black-4x15',  'mesh', '{"general-purpose"}', 'mesh', NULL, 4, 15, 'black', '#1F2937'),
('BMT-68',   'Black Mesh Tarp 6x8',   'mesh-black-6x8',   'mesh', '{"general-purpose"}', 'mesh', NULL, 6, 8, 'black', '#1F2937'),
('BMT-810',  'Black Mesh Tarp 8x10',  'mesh-black-8x10',  'mesh', '{"general-purpose","construction-roofing"}', 'mesh', NULL, 8, 10, 'black', '#1F2937'),
('BMT-816',  'Black Mesh Tarp 8x16',  'mesh-black-8x16',  'mesh', '{"construction-roofing"}', 'mesh', NULL, 8, 16, 'black', '#1F2937'),
('BMT-1012', 'Black Mesh Tarp 10x12', 'mesh-black-10x12', 'mesh', '{"construction-roofing"}', 'mesh', NULL, 10, 12, 'black', '#1F2937'),
('BMT-1016', 'Black Mesh Tarp 10x16', 'mesh-black-10x16', 'mesh', '{"construction-roofing"}', 'mesh', NULL, 10, 16, 'black', '#1F2937'),
('BMT-1020', 'Black Mesh Tarp 10x20', 'mesh-black-10x20', 'mesh', '{"construction-roofing"}', 'mesh', NULL, 10, 20, 'black', '#1F2937'),
('BMT-1212', 'Black Mesh Tarp 12x12', 'mesh-black-12x12', 'mesh', '{"construction-roofing"}', 'mesh', NULL, 12, 12, 'black', '#1F2937'),
('BMT-1216', 'Black Mesh Tarp 12x16', 'mesh-black-12x16', 'mesh', '{"construction-roofing"}', 'mesh', NULL, 12, 16, 'black', '#1F2937'),
('BMT-1220', 'Black Mesh Tarp 12x20', 'mesh-black-12x20', 'mesh', '{"construction-roofing","industrial"}', 'mesh', NULL, 12, 20, 'black', '#1F2937'),
('BMT-1620', 'Black Mesh Tarp 16x20', 'mesh-black-16x20', 'mesh', '{"construction-roofing","industrial"}', 'mesh', NULL, 16, 20, 'black', '#1F2937'),
('BMT-2020', 'Black Mesh Tarp 20x20', 'mesh-black-20x20', 'mesh', '{"construction-roofing","industrial"}', 'mesh', NULL, 20, 20, 'black', '#1F2937'),
('BMT-2030', 'Black Mesh Tarp 20x30', 'mesh-black-20x30', 'mesh', '{"industrial"}', 'mesh', NULL, 20, 30, 'black', '#1F2937'),
('BMT-2040', 'Black Mesh Tarp 20x40', 'mesh-black-20x40', 'mesh', '{"industrial"}', 'mesh', NULL, 20, 40, 'black', '#1F2937'),
('BMT-3030', 'Black Mesh Tarp 30x30', 'mesh-black-30x30', 'mesh', '{"industrial"}', 'mesh', NULL, 30, 30, 'black', '#1F2937'),
('BMT-3040', 'Black Mesh Tarp 30x40', 'mesh-black-30x40', 'mesh', '{"industrial"}', 'mesh', NULL, 30, 40, 'black', '#1F2937'),
('BMT-4040', 'Black Mesh Tarp 40x40', 'mesh-black-40x40', 'mesh', '{"industrial"}', 'mesh', NULL, 40, 40, 'black', '#1F2937'),
('BMT-5050', 'Black Mesh Tarp 50x50', 'mesh-black-50x50', 'mesh', '{"industrial"}', 'mesh', NULL, 50, 50, 'black', '#1F2937');


-- ============================================================
-- FIRE RETARDANT TARPS
-- ============================================================
INSERT INTO products (xpose_sku, name, slug, product_line_id, categories, tarp_type, thickness_mil, width_ft, length_ft, color, color_hex) VALUES
-- FR Clear Vinyl
('CVTFR-58',   'FR Clear Vinyl Tarp 20-Mil 5x8',   'fr-clear-5x8',   'fr-clear', '{"construction-roofing","industrial"}', 'clear-vinyl', 20, 5, 8, 'clear-fr', '#E5E7EB'),
('CVTFR-68',   'FR Clear Vinyl Tarp 20-Mil 6x8',   'fr-clear-6x8',   'fr-clear', '{"construction-roofing","industrial"}', 'clear-vinyl', 20, 6, 8, 'clear-fr', '#E5E7EB'),
('CVTFR-610',  'FR Clear Vinyl Tarp 20-Mil 6x10',  'fr-clear-6x10',  'fr-clear', '{"construction-roofing","industrial"}', 'clear-vinyl', 20, 6, 10, 'clear-fr', '#E5E7EB'),
('CVTFR-810',  'FR Clear Vinyl Tarp 20-Mil 8x10',  'fr-clear-8x10',  'fr-clear', '{"construction-roofing","industrial"}', 'clear-vinyl', 20, 8, 10, 'clear-fr', '#E5E7EB'),
('CVTFR-812',  'FR Clear Vinyl Tarp 20-Mil 8x12',  'fr-clear-8x12',  'fr-clear', '{"construction-roofing","industrial"}', 'clear-vinyl', 20, 8, 12, 'clear-fr', '#E5E7EB'),
('CVTFR-815',  'FR Clear Vinyl Tarp 20-Mil 8x15',  'fr-clear-8x15',  'fr-clear', '{"construction-roofing","industrial"}', 'clear-vinyl', 20, 8, 15, 'clear-fr', '#E5E7EB'),
('CVTFR-1010', 'FR Clear Vinyl Tarp 20-Mil 10x10', 'fr-clear-10x10', 'fr-clear', '{"construction-roofing","industrial"}', 'clear-vinyl', 20, 10, 10, 'clear-fr', '#E5E7EB'),
('CVTFR-1020', 'FR Clear Vinyl Tarp 20-Mil 10x20', 'fr-clear-10x20', 'fr-clear', '{"construction-roofing","industrial"}', 'clear-vinyl', 20, 10, 20, 'clear-fr', '#E5E7EB'),
-- FR Poly (White)
('WTFR-1520',  'FR White Poly Tarp 12-Mil 15x20',  'fr-white-15x20', 'fr-poly', '{"construction-roofing","industrial"}', 'poly', 12, 15, 20, 'white-fr', '#F9FAFB'),
('WTFR-2030',  'FR White Poly Tarp 12-Mil 20x30',  'fr-white-20x30', 'fr-poly', '{"construction-roofing","industrial"}', 'poly', 12, 20, 30, 'white-fr', '#F9FAFB'),
('WTFR-2040',  'FR White Poly Tarp 12-Mil 20x40',  'fr-white-20x40', 'fr-poly', '{"construction-roofing","industrial"}', 'poly', 12, 20, 40, 'white-fr', '#F9FAFB'),
('WTFR-2120',  'FR White Poly Tarp 12-Mil 21x20',  'fr-white-21x20', 'fr-poly', '{"construction-roofing","industrial"}', 'poly', 12, 21, 20, 'white-fr', '#F9FAFB');


-- ============================================================
-- ACCESSORIES — Tie Downs, Bungees, Clips, Ratchet Straps
-- ============================================================
CREATE TABLE IF NOT EXISTS accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  xpose_sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  accessory_type TEXT NOT NULL,       -- "tie-down", "bungee", "clip", "ratchet-strap", "cable-tie"
  material TEXT,
  size TEXT,
  pack_quantity INTEGER NOT NULL,
  retail_price_cents INTEGER DEFAULT 0,
  cost_price_cents INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rubber Tie Down Straps (Natural Rubber)
INSERT INTO accessories (xpose_sku, name, slug, accessory_type, material, size, pack_quantity) VALUES
('TS-9-10',  'Rubber Tie Down 9" 10-Pack',  'tie-down-9in-10pk',  'tie-down', 'Natural Rubber', '9"', 10),
('TS-9-25',  'Rubber Tie Down 9" 25-Pack',  'tie-down-9in-25pk',  'tie-down', 'Natural Rubber', '9"', 25),
('TS-9-50',  'Rubber Tie Down 9" 50-Pack',  'tie-down-9in-50pk',  'tie-down', 'Natural Rubber', '9"', 50),
('TS-15-10', 'Rubber Tie Down 15" 10-Pack', 'tie-down-15in-10pk', 'tie-down', 'Natural Rubber', '15"', 10),
('TS-15-25', 'Rubber Tie Down 15" 25-Pack', 'tie-down-15in-25pk', 'tie-down', 'Natural Rubber', '15"', 25),
('TS-15-50', 'Rubber Tie Down 15" 50-Pack', 'tie-down-15in-50pk', 'tie-down', 'Natural Rubber', '15"', 50),
('TS-21-10', 'Rubber Tie Down 21" 10-Pack', 'tie-down-21in-10pk', 'tie-down', 'Natural Rubber', '21"', 10),
('TS-21-25', 'Rubber Tie Down 21" 25-Pack', 'tie-down-21in-25pk', 'tie-down', 'Natural Rubber', '21"', 25),
('TS-21-50', 'Rubber Tie Down 21" 50-Pack', 'tie-down-21in-50pk', 'tie-down', 'Natural Rubber', '21"', 50),
('TS-31-10', 'Rubber Tie Down 31" 10-Pack', 'tie-down-31in-10pk', 'tie-down', 'Natural Rubber', '31"', 10),
('TS-31-25', 'Rubber Tie Down 31" 25-Pack', 'tie-down-31in-25pk', 'tie-down', 'Natural Rubber', '31"', 25),
('TS-31-50', 'Rubber Tie Down 31" 50-Pack', 'tie-down-31in-50pk', 'tie-down', 'Natural Rubber', '31"', 50),
('TS-41-10', 'Rubber Tie Down 41" 10-Pack', 'tie-down-41in-10pk', 'tie-down', 'Natural Rubber', '41"', 10),
('TS-41-25', 'Rubber Tie Down 41" 25-Pack', 'tie-down-41in-25pk', 'tie-down', 'Natural Rubber', '41"', 25),
('TS-41-50', 'Rubber Tie Down 41" 50-Pack', 'tie-down-41in-50pk', 'tie-down', 'Natural Rubber', '41"', 50),
-- Ball Bungees (Black)
('BB-6B-10',   'Ball Bungee 6" Black 10-Pack',   'bungee-6in-blk-10pk',   'bungee', 'Elastic', '6"', 10),
('BB-6B-25',   'Ball Bungee 6" Black 25-Pack',   'bungee-6in-blk-25pk',   'bungee', 'Elastic', '6"', 25),
('BB-6B-100',  'Ball Bungee 6" Black 100-Pack',  'bungee-6in-blk-100pk',  'bungee', 'Elastic', '6"', 100),
('BB-9B-10',   'Ball Bungee 9" Black 10-Pack',   'bungee-9in-blk-10pk',   'bungee', 'Elastic', '9"', 10),
('BB-9B-25',   'Ball Bungee 9" Black 25-Pack',   'bungee-9in-blk-25pk',   'bungee', 'Elastic', '9"', 25),
('BB-9B-100',  'Ball Bungee 9" Black 100-Pack',  'bungee-9in-blk-100pk',  'bungee', 'Elastic', '9"', 100),
('BB-11B-10',  'Ball Bungee 11" Black 10-Pack',  'bungee-11in-blk-10pk',  'bungee', 'Elastic', '11"', 10),
('BB-11B-25',  'Ball Bungee 11" Black 25-Pack',  'bungee-11in-blk-25pk',  'bungee', 'Elastic', '11"', 25),
('BB-11B-100', 'Ball Bungee 11" Black 100-Pack', 'bungee-11in-blk-100pk', 'bungee', 'Elastic', '11"', 100),
-- Tarp Clips
('TC-10', 'Tarp Grabber Clips 10-Pack', 'tarp-clips-10pk', 'clip', 'High-Impact Nylon', 'O/S', 10),
('TC-25', 'Tarp Grabber Clips 25-Pack', 'tarp-clips-25pk', 'clip', 'High-Impact Nylon', 'O/S', 25),
-- Cable Ties
('NCT-8',  'Nylon Cable Ties 8" 100-Pack',  'cable-ties-8in',  'cable-tie', 'Nylon', '8"', 100),
('NCT-11', 'Nylon Cable Ties 11" 100-Pack', 'cable-ties-11in', 'cable-tie', 'Nylon', '11"', 100),
('NCT-15', 'Nylon Cable Ties 15" 100-Pack', 'cable-ties-15in', 'cable-tie', 'Nylon', '15"', 100),
-- Ratchet Straps
('RTD115-DJH-4-X', 'Ratchet Strap 1"x15ft Double J-Hook',  'ratchet-1x15-djh',  'ratchet-strap', 'Polyester', '1" x 15ft', 1),
('RTD215-DJH-1-X', 'Ratchet Strap 2"x15ft Double J-Hook',  'ratchet-2x15-djh',  'ratchet-strap', 'Polyester', '2" x 15ft', 1),
('RTD227-DJH-1-X', 'Ratchet Strap 2"x27ft Double J-Hook',  'ratchet-2x27-djh',  'ratchet-strap', 'Polyester', '2" x 27ft', 1),
('RTD330-DJH-1-X', 'Ratchet Strap 3"x30ft Double J-Hook',  'ratchet-3x30-djh',  'ratchet-strap', 'Polyester', '3" x 30ft', 1),
('RTD430-DJH-1-X', 'Ratchet Strap 4"x30ft Double J-Hook',  'ratchet-4x30-djh',  'ratchet-strap', 'Polyester', '4" x 30ft', 1),
('RTD215-FH-1-X',  'Ratchet Strap 2"x15ft Flat Hook',      'ratchet-2x15-fh',   'ratchet-strap', 'Polyester', '2" x 15ft', 1),
('RTD227-FH-1-X',  'Ratchet Strap 2"x27ft Flat Hook',      'ratchet-2x27-fh',   'ratchet-strap', 'Polyester', '2" x 27ft', 1),
('RTD330-FH-1-X',  'Ratchet Strap 3"x30ft Flat Hook',      'ratchet-3x30-fh',   'ratchet-strap', 'Polyester', '3" x 30ft', 1),
('RTD430-FH-1-X',  'Ratchet Strap 4"x30ft Flat Hook',      'ratchet-4x30-fh',   'ratchet-strap', 'Polyester', '4" x 30ft', 1),
('RTD227-CG-1-X',  'Ratchet Strap 2"x27ft Chain Grab Hook', 'ratchet-2x27-cg',  'ratchet-strap', 'Polyester', '2" x 27ft', 1);


-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_line ON products(product_line_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_type ON products(tarp_type) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_thickness ON products(thickness_mil) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_dims ON products(width_ft, length_ft) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_color ON products(color) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_xpose ON products(xpose_sku);
CREATE INDEX IF NOT EXISTS idx_products_categories ON products USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_accessories_type ON accessories(accessory_type) WHERE active = true;


-- ============================================================
-- SUMMARY
-- ============================================================
-- Product Lines:  10 (5mil, 10mil, 12mil, 16mil, 20mil, canvas, clear-20, clear-30, mesh, FR)
-- Tarp Products:  ~200 SKUs across all lines and sizes
-- Accessories:    ~40 SKUs (tie downs, bungees, clips, ratchets)
-- 
-- FARSHID TODO:
-- 1. Fill retail_price_cents from Amazon/HD retail or your desired markup
-- 2. Fill cost_price_cents from your Xpose invoices
-- 3. Add remaining 5-mil colors (green, brown) — same sizes as blue
-- 4. Add remaining 10-mil Green/Black (MTGB-*) — same sizes as silver/black
-- 5. Add 12-mil White (WHD-*) — use same pattern
-- 6. Add Clear Vinyl 20-mil and 30-mil (CVT20-*, CVT30-*)
-- 7. Add canvas Green and Tan colors (CTG10-*, CTT10-*)
-- 8. Add EPDM tie downs (TSEP-*) — same sizes as natural rubber
-- 9. Add pallet quantities (units_per_half_pallet, units_per_full_pallet)
-- 10. Add image URLs from Xpose or your own product photography
