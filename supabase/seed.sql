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
  ('5mil-light', '5-Mil Light Duty Poly', 5, 'Polyethylene', '8x8', 3.6, 'Aluminum', 36,
   true, true, true, false, false, false, 'Lightweight poly tarp for temporary use. Great for camping, home projects, furniture covers, and general outdoor use.'),
  ('7mil-standard', '7-Mil Standard Duty Poly', 7, 'Polyethylene', '10x10', 3.65, 'Aluminum', 36,
   true, true, true, false, false, false, 'Multi-purpose 7-mil poly tarp with a 10x10 weave and aluminum grommets. For indoor and outdoor use: equipment covers, truck beds and ground protection on job sites.'),
  ('10mil-heavy', '10-Mil Heavy Duty Poly', 10, 'Polyethylene', '12x12', 4.25, 'Aluminum', 18,
   true, true, true, false, true, false, 'Professional-grade 10-mil poly for demanding applications. Reinforced corners for extra durability. Ideal for construction sites, debris covers, and outdoor storage.'),
  ('12mil-xheavy', '12-Mil Extra Heavy Duty Poly', 12, 'Polyethylene', '14x14', 6, 'Aluminum', 18,
   true, true, true, false, true, true, 'Extra heavy duty 12-mil poly tarp with a 14x14 weave, sewn-in rope hems and reinforced corners. Used for roofing, scaffold enclosures and heavy-duty outdoor covers.'),
  ('16mil-super', '16-Mil Super Heavy Duty Poly', 16, 'Polyethylene', '16x16', 8, 'Aluminum', 18,
   true, true, true, false, true, true, 'Super heavy duty 16-mil poly tarp with a 16x16 weave and reinforced corners. Used by contractors and farms for longer-term outdoor covers and storage.'),
  ('20mil-ultra', '20-Mil Ultra Heavy Duty Poly', 20, 'Polyethylene', '16x16', 11, 'Aluminum', 18,
   true, true, true, false, true, true, 'Ultra heavy duty 20-mil poly tarp, the thickest poly we carry, with a 16x16 weave and reinforced corners. Used for semi-permanent covers and harsh-weather exposure.'),
  ('fr-poly', 'Fire Retardant Poly Tarp', 16, 'Fire Retardant Polyethylene', '14x14', 4.0, 'Aluminum', 18,
   true, true, true, true, true, false, 'Fire-retardant poly for welding areas, electrical work and other jobs that call for flame-resistant coverings. Ask us for the supplier''s fire-test certification for your job file.'),
  ('canvas-standard', 'Heavy Cotton Canvas Tarp', NULL, 'Cotton Canvas', NULL, 18.0, 'Brass', 24,
   false, false, false, false, true, false, 'Traditional breathable cotton canvas. Used for painting drop cloths, vehicle covers, and applications where air circulation matters.');

-- ============================================================
-- PRODUCTS — from Shopify export (24 products)
-- coverage_sqft is a generated column — omitted from INSERT
-- image_urls is jsonb — using JSON array syntax
-- width_ft/length_ft are NOT NULL — accessories use 0
-- ============================================================
INSERT INTO products
  (xpose_sku, name, slug, product_line_id, categories, tarp_type, thickness_mil,
   width_ft, length_ft, color, color_hex, retail_price_cents, cost_price_cents,
   active, in_stock, image_urls)
VALUES
  ('40X60-7MIL-FP12', '40'' x 60'' Heavy Duty Poly Tarp - 7 Mil (Bulk Pallet)', '40x60-heavy-duty-poly-tarp-7-mil-pallet', '7mil-standard', '{construction-roofing,industrial-warehouse}', 'poly', 7, 40, 60, 'Blue', '#3B82F6', 0, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/40-x-60-heavy-duty-poly-tarp-7-mil-bulk-pallet40-x-60-heavy-duty-poly-tarp-7-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-8824121.jpg?v=1764826690"]'::jsonb),

  ('30X50-7MIL-HP16', '30'' x 50'' Heavy Duty Poly Tarp - 7 Mil (Bulk Pallet)', '30x50-heavy-duty-poly-tarp-7-mil-pallet', '7mil-standard', '{construction-roofing,industrial-warehouse}', 'poly', 7, 30, 50, 'Blue', '#3B82F6', 0, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/30-x-50-heavy-duty-poly-tarp-7-mil-bulk-pallet30-x-50-heavy-duty-poly-tarp-7-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-5715064.jpg?v=1764826692"]'::jsonb),

  ('30X40-7MIL-HP24', '30'' x 40'' Heavy Duty Poly Tarp - 7 Mil (Bulk Pallet)', '30x40-heavy-duty-poly-tarp-7-mil-pallet', '7mil-standard', '{construction-roofing,industrial-warehouse}', 'poly', 7, 30, 40, 'Blue', '#3B82F6', 0, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/30-x-40-heavy-duty-poly-tarp-7-mil-bulk-pallet30-x-40-heavy-duty-poly-tarp-7-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-6853594.jpg?v=1764826691"]'::jsonb),

  ('20X20-7MIL-HP72', '20'' x 20'' Heavy Duty Poly Tarp - 7 Mil (Bulk Pallet)', '20x20-heavy-duty-poly-tarp-7-mil-pallet', '7mil-standard', '{construction-roofing,industrial-warehouse}', 'poly', 7, 20, 20, 'Blue', '#3B82F6', 0, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-20-heavy-duty-poly-tarp-7-mil-bulk-pallet20-x-20-heavy-duty-poly-tarp-7-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-7121853.jpg?v=1764826687"]'::jsonb),

  ('40X60-10MIL-FP20', '40'' x 60'' Heavy Duty Poly Tarp - 10 Mil (Bulk Pallet)', '40x60-heavy-duty-poly-tarp-10-mil-pallet', '10mil-heavy', '{construction-roofing,industrial-warehouse}', 'poly', 10, 40, 60, 'Silver', '#94A3B8', 0, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/40-x-60-heavy-duty-poly-tarp-10-mil-bulk-pallet40-x-60-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-9947945.jpg?v=1764826689"]'::jsonb),

  ('30X50-10MIL-HP18', '30'' x 50'' Heavy Duty Poly Tarp - 10 Mil (Bulk Pallet)', '30x50-heavy-duty-poly-tarp-10-mil-pallet', '10mil-heavy', '{construction-roofing,industrial-warehouse}', 'poly', 10, 30, 50, 'Silver', '#94A3B8', 0, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/30-x-50-heavy-duty-poly-tarp-10-mil-bulk-pallet30-x-50-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-2936687.jpg?v=1764826690"]'::jsonb),

  ('30X40-10MIL-HP22', '30'' x 40'' Heavy Duty Poly Tarp - 10 Mil (Bulk Pallet)', '30x40-heavy-duty-poly-tarp-10-mil-pallet', '10mil-heavy', '{construction-roofing,industrial-warehouse}', 'poly', 10, 30, 40, 'Silver', '#94A3B8', 0, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/30-x-40-heavy-duty-poly-tarp-10-mil-bulk-pallet30-x-40-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-7900725.jpg?v=1764826690"]'::jsonb),

  ('20X40-10MIL-HP30', '20'' x 40'' Heavy Duty Poly Tarp - 10 Mil (Bulk Pallet)', '20x40-heavy-duty-poly-tarp-10-mil-pallet', '10mil-heavy', '{construction-roofing,industrial-warehouse}', 'poly', 10, 20, 40, 'Black', '#1E293B', 0, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-40-heavy-duty-poly-tarp-10-mil-bulk-pallet20-x-40-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-3421677.jpg?v=1764826692"]'::jsonb),

  ('20X30-10MIL-HP48', '20'' x 30'' Heavy Duty Poly Tarp - 10 Mil (Bulk Pallet)', '20x30-heavy-duty-poly-tarp-10-mil-pallet', '10mil-heavy', '{construction-roofing,industrial-warehouse}', 'poly', 10, 20, 30, 'Silver', '#94A3B8', 0, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-30-heavy-duty-poly-tarp-10-mil-bulk-pallet20-x-30-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-7068500.jpg?v=1764826690"]'::jsonb),

  ('20X20-10MIL-HP72', '20'' x 20'' Heavy Duty Poly Tarp - 10 Mil (Bulk Pallet)', '20x20-heavy-duty-poly-tarp-10-mil-pallet', '10mil-heavy', '{construction-roofing,industrial-warehouse}', 'poly', 10, 20, 20, 'Blue', '#3B82F6', 0, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-20-heavy-duty-poly-tarp-10-mil-bulk-pallet20-x-20-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-1906435.jpg?v=1764826691"]'::jsonb),

  ('15X30-10MIL-HP72', '15'' x 30'' Heavy Duty Poly Tarp - 10 Mil (Bulk Pallet)', '15x30-heavy-duty-poly-tarp-10-mil-pallet', '10mil-heavy', '{construction-roofing,industrial-warehouse}', 'poly', 10, 15, 30, 'Silver', '#94A3B8', 0, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/15-x-30-heavy-duty-poly-tarp-10-mil-bulk-pallet15-x-30-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-7563016.jpg?v=1764826687"]'::jsonb),

  ('BB-11B-10', 'Ball Bungees 11" - Black', 'ball-bungees-11-black-10-pack', NULL, '{general-purpose}', 'accessory', NULL, 0, 0, 'Black', '#1E293B', 1499, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/ball-bungees-11-blackball-bungees-11-blackbungees-tarp-fasteners-hardware-accessories-11-inchmega-tarpsmega-tarps-3903860.jpg?v=1764826688"]'::jsonb),

  ('BB-9B-10', 'Ball Bungees 9" - Black', 'ball-bungees-9-black-10-pack', NULL, '{general-purpose}', 'accessory', NULL, 0, 0, 'Black', '#1E293B', 1299, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/ball-bungees-9-blackball-bungees-9-blackbungees-tarp-fasteners-hardware-accessories-9-inchmega-tarpsmega-tarps-4840394.jpg?v=1764826689"]'::jsonb),

  ('MT-12X16-10MIL', '12'' x 16'' Heavy Duty Poly Tarp - 10 Mil', '12-x-16-heavy-duty-poly-tarp-10-mil', '10mil-heavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 10, 12, 16, 'Blue', '#3B82F6', 4299, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/12-x-16-heavy-duty-poly-tarp-10-mil12-x-16-heavy-duty-poly-tarp-10-milheavy-duty-tarpmega-tarpsmega-tarps-4951988.jpg?v=1764826687"]'::jsonb),

  ('MT-10X12-7MIL', '10'' x 12'' Multi-purpose Poly Tarp - 7 Mil', '10-x-12-multipurpose-poly-tarp-7-mil', '7mil-standard', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 7, 10, 12, 'Blue', '#3B82F6', 2299, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/10-x-12-multi-purpose-poly-tarp-7-mil10-x-12-multi-purpose-poly-tarp-7-milmedium-duty-tarpmega-tarpsmega-tarps-7312906.jpg?v=1764826688"]'::jsonb),

  ('MT-40X60-10MIL', '40'' x 60'' Heavy Duty Poly Tarp - 10 Mil', '40-x-60-heavy-duty-poly-tarp-10-mil', '10mil-heavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 10, 40, 60, 'Blue', '#3B82F6', 21999, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/40-x-60-heavy-duty-poly-tarp-10-mil40-x-60-heavy-duty-poly-tarp-10-milheavy-duty-tarpmega-tarpsmega-tarps-9714655.jpg?v=1764826689"]'::jsonb),

  ('MT-30X40-12MIL', '30'' x 40'' Extreme Duty Poly Tarp - 12 Mil', '30-x-40-extreme-duty-poly-tarp-12-mil', '12mil-xheavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 12, 30, 40, 'Blue', '#3B82F6', 24699, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/30-x-40-extreme-duty-poly-tarp-12-mil30-x-40-extreme-duty-poly-tarp-12-milextreme-duty-tarpmega-tarpsmega-tarps-7675509.jpg?v=1764826687"]'::jsonb),

  ('MT-20X30-20MIL', '20'' x 30'' Ultra Duty Poly Tarp - 20 Mil', '20-x-30-ultra-duty-poly-tarp-20-mil', '20mil-ultra', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 20, 20, 30, 'Blue', '#3B82F6', 16799, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-30-ultra-duty-poly-tarp-20-mil20-x-30-ultra-duty-poly-tarp-20-milultra-duty-tarpmega-tarpsmega-tarps-4599513.jpg?v=1764826689"]'::jsonb),

  ('MT-20X40-10MIL', '20'' x 40'' Heavy Duty Poly Tarp - 10 Mil', '20-x-40-heavy-duty-poly-tarp-10-mil', '10mil-heavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 10, 20, 40, 'Blue', '#3B82F6', 10499, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-40-heavy-duty-poly-tarp-10-mil-bulk-pallet20-x-40-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-2493324.jpg?v=1764826691"]'::jsonb),

  ('MT-30X40-10MIL', '30'' x 40'' Heavy Duty Poly Tarp - 10 Mil', '30-x-40-heavy-duty-poly-tarp-10-mil', '10mil-heavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 10, 30, 40, 'Silver', '#94A3B8', 14988, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/30-x-40-heavy-duty-poly-tarp-10-mil30-x-40-heavy-duty-poly-tarp-10-milheavy-duty-tarpmega-tarpsmega-tarps-6389911.jpg?v=1764826688"]'::jsonb),

  ('MT-20X30-10MIL', '20'' x 30'' Heavy Duty Poly Tarp - 10 Mil', '20-x-30-heavy-duty-poly-tarp-10-mil', '10mil-heavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 10, 20, 30, 'Blue', '#3B82F6', 7498, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-30-heavy-duty-poly-tarp-10-mil20-x-30-heavy-duty-poly-tarp-10-milheavy-duty-tarpmega-tarpsmega-tarps-3569473.png?v=1764906069"]'::jsonb),

  ('MT-30X40-10MIL-SB', '30'' x 40'' Heavy Duty Silver/Black Poly Tarp - 10 Mil', '30-x-40-heavy-duty-silver-black-poly-tarp-10-mil', '10mil-heavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 10, 30, 40, 'Silver', '#94A3B8', 11999, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/30-x-40-heavy-duty-poly-tarp-10-mil-bulk-pallet30-x-40-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-4186421.jpg?v=1764826690"]'::jsonb),

  ('MT-20X30-12MIL', '20'' x 30'' Extreme Duty Poly Tarp - 12 Mil', '20-x-30-extreme-duty-poly-tarp-12-mil', '12mil-xheavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 12, 20, 30, 'Blue', '#3B82F6', 8999, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-30-extreme-duty-poly-tarp-12-mil20-x-30-extreme-duty-poly-tarp-12-milextreme-duty-tarpmega-tarpsmega-tarps-1037780.jpg?v=1764826688"]'::jsonb),

  ('MT-16X20-12MIL', '16'' x 20'' Extreme Duty Poly Tarp - 12 Mil', '16-x-20-extreme-duty-poly-tarp-12-mil', '12mil-xheavy', '{construction-roofing,agriculture-farming,industrial-warehouse,general-purpose}', 'poly', 12, 16, 20, 'White', '#F8FAFC', 6299, 0, true, true,
   '["https://cdn.shopify.com/s/files/1/0788/9040/2049/files/16-x-20-extreme-duty-poly-tarp-12-mil16-x-20-extreme-duty-poly-tarp-12-milextreme-duty-tarpmega-tarpsmega-tarps-8810614.jpg?v=1764826690"]'::jsonb);

-- ============================================================
-- PRICING RULES
-- ============================================================
INSERT INTO pricing_rules (min_quantity, max_quantity, discount_from_retail_percent, active)
VALUES
  (5,   9,  8.0,  true),
  (10, 24, 12.0,  true),
  (25, 49, 16.0,  true),
  (50, 99, 20.0,  true),
  (100, NULL, 25.0, true);

-- Pallet tiers (Farshid's plan): approved wholesale accounts pay a share of the guest price
-- when buying N full pallets of a product. 0.90 / 0.85 / 0.81 of the competitor per-tarp price,
-- expressed relative to guest (0.95). Needs migrations/0002_catalog.sql.
INSERT INTO pricing_rules (unit, min_quantity, max_quantity, price_multiplier, discount_from_retail_percent, requires_account, label, priority, active)
VALUES
  ('pallet', 1, NULL, 0.90 / 0.95, NULL, true, '1 pallet',   0, true),
  ('pallet', 2, NULL, 0.85 / 0.95, NULL, true, '2+ pallets', 0, true),
  ('pallet', 3, NULL, 0.81 / 0.95, NULL, true, '3+ pallets', 0, true);

-- Total: 24 products seeded
