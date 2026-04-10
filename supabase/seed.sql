-- ============================================================
-- MegaTarps Seed Data — Generated from Shopify export
-- Run this AFTER schema.sql in your Supabase SQL editor
-- ============================================================

DELETE FROM pricing_rules;
DELETE FROM products;
DELETE FROM product_lines;

-- ============================================================
-- PRODUCT LINES
-- ============================================================
INSERT INTO product_lines
  (id, name, thickness_mil, material, weave_count, weight_oz_per_sqyd, grommet_type, grommet_spacing_inches,
   uv_resistant, waterproof, mildew_resistant, fire_retardant, reinforced_corners, sewn_in_rope, description)
VALUES
  ('5mil-light', '5-Mil Light Duty Poly', 5, 'Polyethylene', '10x10', 1.5, 'Aluminum', 18,
   true, true, true, false, false, false, 'Lightweight poly tarp for temporary use. Great for camping, home projects, furniture covers, and general outdoor use.'),
  ('7mil-standard', '7-Mil Standard Duty Poly', 7, 'Polyethylene', '12x12', 2.0, 'Aluminum', 18,
   true, true, true, false, false, false, 'Multi-purpose 7-mil poly tarp for versatile indoor and outdoor use. Works -50F to 180F. Balanced durability for equipment covers, truck beds, and construction ground protection.'),
  ('10mil-heavy', '10-Mil Heavy Duty Poly', 10, 'Polyethylene', '12x12', 2.5, 'Aluminum', 18,
   true, true, true, false, true, false, 'Professional-grade 10-mil poly for demanding applications. Reinforced corners for extra durability. Ideal for construction sites, debris covers, and outdoor storage.'),
  ('12mil-xheavy', '12-Mil Extreme Duty Poly', 12, 'Polyethylene', '14x14', 3.0, 'Aluminum', 18,
   true, true, true, false, true, true, 'Extreme duty 12-mil with sewn-in rope perimeter for maximum strength. Built for roofing, scaffold enclosures, and heavy-duty outdoor use. Lasts 1-3+ years.'),
  ('16mil-super', '16-Mil Super Heavy Duty Poly', 16, 'Polyethylene', '14x14', 4.0, 'Aluminum', 18,
   true, true, true, false, true, true, 'Industrial-grade super heavy-duty poly. Used by contractors and farmers for long-term outdoor applications and permanent storage structures.'),
  ('20mil-ultra', '20-Mil Ultra Heavy Duty Poly', 20, 'Polyethylene', '16x16', 5.0, 'Aluminum', 18,
   true, true, true, false, true, true, 'Ultra-heavy 20-mil tarp for extreme conditions. Maximum strength for permanent commercial covers, extreme weather, and years of continuous use.'),
  ('fr-poly', 'Fire Retardant Poly Tarp', 16, 'Fire Retardant Polyethylene', '14x14', 4.0, 'Aluminum', 18,
   true, true, true, true, true, false, 'NFPA 701 rated fire retardant. Self-extinguishing when flame removed. Required for welding areas, electrical work, and OSHA-regulated job sites.'),
  ('canvas-standard', 'Heavy Cotton Canvas Tarp', NULL, 'Cotton Canvas', NULL, 18.0, 'Brass', 24,
   false, false, false, false, true, false, 'Traditional breathable cotton canvas. Used for painting drop cloths, vehicle covers, and applications where air circulation matters.');

-- ============================================================
-- PRODUCTS — from Shopify export (24 products)
-- ============================================================
INSERT INTO products
  (xpose_sku, name, slug, product_line_id, categories, tarp_type, thickness_mil,
   width_ft, length_ft, coverage_sqft, color, color_hex, retail_price_cents, cost_price_cents,
   active, in_stock, image_urls)
VALUES
  ('40X60-7MIL-FP12', '40'' x 60'' Heavy Duty Poly Tarp - 7 Mil (Bulk Pallet)', '40x60-heavy-duty-poly-tarp-7-mil-pallet', '7mil-standard', '{construction-roofing,industrial-warehouse}', 'poly', 7, 40, 60, 2400, 'Blue', '#3B82F6', 0, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/40-x-60-heavy-duty-poly-tarp-7-mil-bulk-pallet40-x-60-heavy-duty-poly-tarp-7-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-8824121.jpg?v=1764826690']),
  ('30X50-7MIL-HP16', '30'' x 50'' Heavy Duty Poly Tarp - 7 Mil (Bulk Pallet)', '30x50-heavy-duty-poly-tarp-7-mil-pallet', '7mil-standard', '{construction-roofing,industrial-warehouse}', 'poly', 7, 30, 50, 1500, 'Blue', '#3B82F6', 0, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/30-x-50-heavy-duty-poly-tarp-7-mil-bulk-pallet30-x-50-heavy-duty-poly-tarp-7-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-5715064.jpg?v=1764826692']),
  ('30X40-7MIL-HP24', '30'' x 40'' Heavy Duty Poly Tarp - 7 Mil (Bulk Pallet)', '30x40-heavy-duty-poly-tarp-7-mil-pallet', '7mil-standard', '{construction-roofing,industrial-warehouse}', 'poly', 7, 30, 40, 1200, 'Blue', '#3B82F6', 0, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/30-x-40-heavy-duty-poly-tarp-7-mil-bulk-pallet30-x-40-heavy-duty-poly-tarp-7-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-6853594.jpg?v=1764826691']),
  ('20X20-7MIL-HP72', '20'' x 20'' Heavy Duty Poly Tarp - 7 Mil (Bulk Pallet)', '20x20-heavy-duty-poly-tarp-7-mil-pallet', '7mil-standard', '{construction-roofing,industrial-warehouse}', 'poly', 7, 20, 20, 400, 'Blue', '#3B82F6', 0, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-20-heavy-duty-poly-tarp-7-mil-bulk-pallet20-x-20-heavy-duty-poly-tarp-7-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-7121853.jpg?v=1764826687']),
  ('40X60-10MIL-FP20', '40'' x 60'' Heavy Duty Poly Tarp - 10 Mil (Bulk Pallet)', '40x60-heavy-duty-poly-tarp-10-mil-pallet', '10mil-heavy', '{construction-roofing,industrial-warehouse}', 'poly', 10, 40, 60, 2400, 'Silver', '#94A3B8', 0, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/40-x-60-heavy-duty-poly-tarp-10-mil-bulk-pallet40-x-60-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-9947945.jpg?v=1764826689']),
  ('30X50-10MIL-HP18', '30'' x 50'' Heavy Duty Poly Tarp - 10 Mil (Bulk Pallet)', '30x50-heavy-duty-poly-tarp-10-mil-pallet', '10mil-heavy', '{construction-roofing,industrial-warehouse}', 'poly', 10, 30, 50, 1500, 'Silver', '#94A3B8', 0, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/30-x-50-heavy-duty-poly-tarp-10-mil-bulk-pallet30-x-50-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-2936687.jpg?v=1764826690']),
  ('30X40-10MIL-HP22', '30'' x 40'' Heavy Duty Poly Tarp - 10 Mil (Bulk Pallet)', '30x40-heavy-duty-poly-tarp-10-mil-pallet', '10mil-heavy', '{construction-roofing,industrial-warehouse}', 'poly', 10, 30, 40, 1200, 'Silver', '#94A3B8', 0, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/30-x-40-heavy-duty-poly-tarp-10-mil-bulk-pallet30-x-40-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-7900725.jpg?v=1764826690']),
  ('20X40-10MIL-HP30', '20'' x 40'' Heavy Duty Poly Tarp - 10 Mil (Bulk Pallet)', '20x40-heavy-duty-poly-tarp-10-mil-pallet', '10mil-heavy', '{construction-roofing,industrial-warehouse}', 'poly', 10, 20, 40, 800, 'Black', '#1E293B', 0, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-40-heavy-duty-poly-tarp-10-mil-bulk-pallet20-x-40-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-3421677.jpg?v=1764826692']),
  ('20X30-10MIL-HP48', '20'' x 30'' Heavy Duty Poly Tarp - 10 Mil (Bulk Pallet)', '20x30-heavy-duty-poly-tarp-10-mil-pallet', '10mil-heavy', '{construction-roofing,industrial-warehouse}', 'poly', 10, 20, 30, 600, 'Silver', '#94A3B8', 0, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-30-heavy-duty-poly-tarp-10-mil-bulk-pallet20-x-30-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-7068500.jpg?v=1764826690']),
  ('20X20-10MIL-HP72', '20'' x 20'' Heavy Duty Poly Tarp - 10 Mil (Bulk Pallet)', '20x20-heavy-duty-poly-tarp-10-mil-pallet', '10mil-heavy', '{construction-roofing,industrial-warehouse}', 'poly', 10, 20, 20, 400, 'Blue', '#3B82F6', 0, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-20-heavy-duty-poly-tarp-10-mil-bulk-pallet20-x-20-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-1906435.jpg?v=1764826691']),
  ('15X30-10MIL-HP72', '15'' x 30'' Heavy Duty Poly Tarp - 10 Mil (Bulk Pallet)', '15x30-heavy-duty-poly-tarp-10-mil-pallet', '10mil-heavy', '{construction-roofing,industrial-warehouse}', 'poly', 10, 15, 30, 450, 'Silver', '#94A3B8', 0, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/15-x-30-heavy-duty-poly-tarp-10-mil-bulk-pallet15-x-30-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-7563016.jpg?v=1764826687']),
  ('BB-11B-10', 'Ball Bungees 11" - Black', 'ball-bungees-11-black-10-pack', '10mil-heavy', '{general-purpose}', 'poly', NULL, NULL, NULL, NULL, 'Black', '#1E293B', 1499, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/ball-bungees-11-blackball-bungees-11-blackbungees-tarp-fasteners-hardware-accessories-11-inchmega-tarpsmega-tarps-3903860.jpg?v=1764826688']),
  ('BB-9B-10', 'Ball Bungees 9" - Black', 'ball-bungees-9-black-10-pack', '10mil-heavy', '{general-purpose}', 'poly', NULL, NULL, NULL, NULL, 'Black', '#1E293B', 1299, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/ball-bungees-9-blackball-bungees-9-blackbungees-tarp-fasteners-hardware-accessories-9-inchmega-tarpsmega-tarps-4840394.jpg?v=1764826689']),
  ('BUNGEE-12-X-16-ME', '12'' x 16'' Heavy Duty Poly Tarp - 10 Mil', '12-x-16-medium-duty-blue-poly-tarp-10-mil', '10mil-heavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 10, 12, 16, 192, 'Blue', '#3B82F6', 4299, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/12-x-16-heavy-duty-poly-tarp-10-mil12-x-16-heavy-duty-poly-tarp-10-milheavy-duty-tarpmega-tarpsmega-tarps-4951988.jpg?v=1764826687']),
  ('BUNGEE-10-X-12-ME', '10'' x 12'' Multi-purpose Poly Tarp - 7 Mil', '10-x-12-medium-duty-blue-poly-tarp-7-mil', '7mil-standard', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 7, 10, 12, 120, 'Blue', '#3B82F6', 2299, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/10-x-12-multi-purpose-poly-tarp-7-mil10-x-12-multi-purpose-poly-tarp-7-milmedium-duty-tarpmega-tarpsmega-tarps-7312906.jpg?v=1764826688']),
  ('BUNGEE-40-X-60-SU', '40'' x 60'' Heavy Duty Poly Tarp - 10 Mil', '40-x-60-super-heavy-duty-silver-black-poly-tarp-10-mil', '10mil-heavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 10, 40, 60, 2400, 'Blue', '#3B82F6', 21999, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/40-x-60-heavy-duty-poly-tarp-10-mil40-x-60-heavy-duty-poly-tarp-10-milheavy-duty-tarpmega-tarpsmega-tarps-9714655.jpg?v=1764826689']),
  ('BUNGEE-30-X-40-SU', '30'' x 40'' Extreme Duty Poly Tarp - 12 Mil', '30-x-40-super-heavy-duty-silver-black-poly-tarp-12-mil', '12mil-xheavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 12, 30, 40, 1200, 'Blue', '#3B82F6', 24699, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/30-x-40-extreme-duty-poly-tarp-12-mil30-x-40-extreme-duty-poly-tarp-12-milextreme-duty-tarpmega-tarpsmega-tarps-7675509.jpg?v=1764826687']),
  ('BUNGEE-20-X-30-SU', '20'' x 30'' Ultra Duty Poly Tarp - 20 Mil', '20-x-30-super-heavy-duty-silver-black-poly-tarp-16-mil', '20mil-ultra', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 20, 20, 30, 600, 'Blue', '#3B82F6', 16799, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-30-ultra-duty-poly-tarp-20-mil20-x-30-ultra-duty-poly-tarp-20-milultra-duty-tarpmega-tarpsmega-tarps-4599513.jpg?v=1764826689']),
  ('BUNGEE-20-X-40-ME', '20'' x 40'' Heavy Duty Poly Tarp - 10 Mil', '20-x-40-medium-duty-blue-poly-tarp-10-mil', '10mil-heavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 10, 20, 40, 800, 'Blue', '#3B82F6', 10499, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-40-heavy-duty-poly-tarp-10-mil-bulk-pallet20-x-40-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-2493324.jpg?v=1764826691']),
  ('BUNGEE-30-X-40-ME', '30'' x 40'' Heavy Duty Poly Tarp - 10 Mil', '30-x-40-medium-duty-blue-poly-tarp-10-mil', '10mil-heavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 10, 30, 40, 1200, 'Silver', '#94A3B8', 14988, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/30-x-40-heavy-duty-poly-tarp-10-mil30-x-40-heavy-duty-poly-tarp-10-milheavy-duty-tarpmega-tarpsmega-tarps-6389911.jpg?v=1764826688']),
  ('BUNGEE-20-X-30-ME', '20'' x 30'' Heavy Duty Poly Tarp - 10 Mil', '20-x-30-medium-duty-blue-poly-tarp-10-mil', '10mil-heavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 10, 20, 30, 600, 'Blue', '#3B82F6', 7498, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-30-heavy-duty-poly-tarp-10-mil20-x-30-heavy-duty-poly-tarp-10-milheavy-duty-tarpmega-tarpsmega-tarps-3569473.png?v=1764906069']),
  ('BUNGEE-30-X-40-HE', '30'' x 40'' Heavy Duty Silver/Black Poly Tarp - 10 Mil', '30-x-40-heavy-duty-silver-black-poly-tarp-10-mil', '10mil-heavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 10, 30, 40, 1200, 'Silver', '#94A3B8', 11999, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/30-x-40-heavy-duty-poly-tarp-10-mil-bulk-pallet30-x-40-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-4186421.jpg?v=1764826690']),
  ('BUNGEE-20-X-30-HE', '20'' x 30'' Extreme Duty Poly Tarp - 12 Mil', '20-x-30-heavy-duty-silver-black-poly-tarp-12-mil', '12mil-xheavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 12, 20, 30, 600, 'Blue', '#3B82F6', 8999, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-30-extreme-duty-poly-tarp-12-mil20-x-30-extreme-duty-poly-tarp-12-milextreme-duty-tarpmega-tarpsmega-tarps-1037780.jpg?v=1764826688']),
  ('BUNGEE-16-X-20-HE', '16'' x 20'' Extreme Duty Poly Tarp - 12 Mil', '16-x-20-heavy-duty-silver-black-poly-tarp-12-mil', '12mil-xheavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 12, 16, 20, 320, 'Blue', '#3B82F6', 6299, 0, true, true, ARRAY['https://cdn.shopify.com/s/files/1/0788/9040/2049/files/16-x-20-extreme-duty-poly-tarp-12-mil16-x-20-extreme-duty-poly-tarp-12-milextreme-duty-tarpmega-tarpsmega-tarps-8810614.jpg?v=1764826690']);

-- ============================================================
-- PRICING RULES
-- ============================================================
INSERT INTO pricing_rules (name, min_quantity, discount_pct, active)
VALUES
  ('5-9 units',     5,  8.0,  true),
  ('10-24 units',  10, 12.0,  true),
  ('25-49 units',  25, 16.0,  true),
  ('50-99 units',  50, 20.0,  true),
  ('100+ units',  100, 25.0,  true);

-- Total: 24 products seeded
