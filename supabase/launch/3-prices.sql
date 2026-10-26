-- ============================================================
-- MegaTarps launch — STEP 3 of 3: shipping weights, prices (Xpose store −5%), Amazon reference, final security
-- Paste ALL of this into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.
-- ============================================================

BEGIN;


-- ---------------- supabase/seed-weights.sql ----------------
-- Real packed shipping weights (lb) for Xpose 10-mil tarps, from Amazon listing data in
-- Farshid's "Pe TARPULINE" sheet (tab "Xpose"). Overrides the area × oz/sq yd formula,
-- which runs a few % light because it ignores packaging. Run after seed.sql + seed-catalog.sql.
UPDATE products p SET shipping_weight_lb = w.lb
FROM (VALUES
  (5,7,1.2),(6,8,1.57),(8,10,2.52),(9,12,3.28),(10,10,3.06),(10,12,3.73),(10,15,4.57),(10,20,6.0),
  (12,12,4.35),(12,14,4.95),(12,16,5.69),(12,20,7.1),(12,25,8.65),(14,14,6.05),(15,20,8.99),
  (15,25,10.94),(15,30,13.1),(16,20,9.4),(18,24,13.2),(20,20,11.4),(20,25,14.65),(20,30,16.54),
  (20,35,20.4),(20,40,24.96),(25,40,30.9),(30,30,27.35),(30,40,37.65),(30,50,44.75),(30,60,53.0),
  (40,40,47.0),(40,50,63.0),(40,60,73.0)
) AS w(wd, ln, lb)
WHERE p.thickness_mil = 10 AND p.tarp_type = 'poly'
  AND LEAST(p.width_ft, p.length_ft) = w.wd AND GREATEST(p.width_ft, p.length_ft) = w.ln
  AND COALESCE(p.pack_quantity, 1) = 1;


-- ---------------- supabase/seed-prices-2026-10-25.sql ----------------
-- Guest prices = The Tarps Wholesaler (Xpose's own store) per-tarp pallet price, checked 2026-10-25, x 0.95
-- Floor: never below cost x 1.15 (rows marked FLOOR = Xpose store undercuts our Nov-2025 cost; renegotiate with All In Safety).
-- Run after seed.sql, seed-catalog.sql, seed-weights.sql.
UPDATE products SET retail_price_cents = 175248, min_unit_price_cents = 147384 WHERE xpose_sku = '20X20-7MIL-HP72';  -- market 25.62/tarp (full_pallet BTH-2020) 
UPDATE products SET retail_price_cents = 2553, min_unit_price_cents = 2392 WHERE xpose_sku = 'MTGB-2020';  -- market 26.87/tarp (full_pallet MTGB-2020) 
UPDATE products SET retail_price_cents = 2434, min_unit_price_cents = 2047 WHERE xpose_sku = 'BTH-2020';  -- market 25.62/tarp (full_pallet BTH-2020) 
UPDATE products SET retail_price_cents = 172224, min_unit_price_cents = 172224 WHERE xpose_sku = '20X20-10MIL-HP72';  -- market 20.71/tarp (full_pallet STH-2020) FLOOR
UPDATE products SET retail_price_cents = 2392, min_unit_price_cents = 2392 WHERE xpose_sku = 'STH-2020';  -- market 20.71/tarp (full_pallet STH-2020) FLOOR
UPDATE products SET retail_price_cents = 3830, min_unit_price_cents = 3588 WHERE xpose_sku = 'MTGB-2030';  -- market 40.31/tarp (full_pallet MTGB-2030) 
UPDATE products SET retail_price_cents = 183840, min_unit_price_cents = 172224 WHERE xpose_sku = '20X30-10MIL-HP48';  -- market 40.31/tarp (full_pallet STH-2030) 
UPDATE products SET retail_price_cents = 3483, min_unit_price_cents = 3082 WHERE xpose_sku = 'BTH-2030';  -- market 36.67/tarp (full_pallet BTH-2030) 
UPDATE products SET retail_price_cents = 3830, min_unit_price_cents = 3588 WHERE xpose_sku = 'STH-2030';  -- market 40.31/tarp (full_pallet STH-2030) 
UPDATE products SET retail_price_cents = 3830, min_unit_price_cents = 3588 WHERE xpose_sku = 'MT-20X30-10MIL';  -- market 40.31/tarp (full_pallet STH-2030) 
UPDATE products SET retail_price_cents = 7176, min_unit_price_cents = 7176 WHERE xpose_sku = 'MT-30X40-10MIL-SB';  -- market 60.00/tarp (full_pallet STH-3040) FLOOR
UPDATE products SET retail_price_cents = 7939, min_unit_price_cents = 7176 WHERE xpose_sku = 'MTGB-3040';  -- market 83.57/tarp (full_pallet MTGB-3040) 
UPDATE products SET retail_price_cents = 7176, min_unit_price_cents = 7176 WHERE xpose_sku = 'STH-3040';  -- market 60.00/tarp (full_pallet STH-3040) FLOOR
UPDATE products SET retail_price_cents = 157872, min_unit_price_cents = 157872 WHERE xpose_sku = '30X40-10MIL-HP22';  -- market 60.00/tarp (full_pallet STH-3040) FLOOR
UPDATE products SET retail_price_cents = 171000, min_unit_price_cents = 149592 WHERE xpose_sku = '30X40-7MIL-HP24';  -- market 75.00/tarp (full_pallet BTH-3040) 
UPDATE products SET retail_price_cents = 7125, min_unit_price_cents = 6233 WHERE xpose_sku = 'BTH-3040';  -- market 75.00/tarp (full_pallet BTH-3040) 
UPDATE products SET retail_price_cents = 7176, min_unit_price_cents = 7176 WHERE xpose_sku = 'MT-30X40-10MIL';  -- market 60.00/tarp (full_pallet STH-3040) FLOOR
UPDATE products SET retail_price_cents = 149632, min_unit_price_cents = 124016 WHERE xpose_sku = '30X50-7MIL-HP16';  -- market 98.44/tarp (full_pallet BTH-3050) 
UPDATE products SET retail_price_cents = 9352, min_unit_price_cents = 7751 WHERE xpose_sku = 'BTH-3050';  -- market 98.44/tarp (full_pallet BTH-3050) 
UPDATE products SET retail_price_cents = 8970, min_unit_price_cents = 8970 WHERE xpose_sku = 'STH-3050';  -- market 72.50/tarp (full_pallet STH-3050) FLOOR
UPDATE products SET retail_price_cents = 9381, min_unit_price_cents = 8970 WHERE xpose_sku = 'MTGB-3050';  -- market 98.75/tarp (full_pallet MTGB-3050) 
UPDATE products SET retail_price_cents = 161460, min_unit_price_cents = 161460 WHERE xpose_sku = '30X50-10MIL-HP18';  -- market 72.50/tarp (full_pallet STH-3050) FLOOR
UPDATE products SET retail_price_cents = 15604, min_unit_price_cents = 14352 WHERE xpose_sku = 'MTGB-4060';  -- market 164.25/tarp (full_pallet MTGB-4060) 
UPDATE products SET retail_price_cents = 14250, min_unit_price_cents = 12443 WHERE xpose_sku = 'BTH-4060';  -- market 150.00/tarp (full_pallet BTH-4060) 
UPDATE products SET retail_price_cents = 171000, min_unit_price_cents = 149316 WHERE xpose_sku = '40X60-7MIL-FP12';  -- market 150.00/tarp (full_pallet BTH-4060) 
UPDATE products SET retail_price_cents = 292580, min_unit_price_cents = 287040 WHERE xpose_sku = '40X60-10MIL-FP20';  -- market 153.99/tarp (full_pallet STH-4060) 
UPDATE products SET retail_price_cents = 14629, min_unit_price_cents = 14352 WHERE xpose_sku = 'MT-40X60-10MIL';  -- market 153.99/tarp (full_pallet STH-4060) 
UPDATE products SET retail_price_cents = 14629, min_unit_price_cents = 14352 WHERE xpose_sku = 'STH-4060';  -- market 153.99/tarp (full_pallet STH-4060) 

-- Products with a price but no known cost (old Shopify listings, accessories): no volume
-- discounts below the listed price until a real cost is entered (QA blocker 4).
UPDATE products SET min_unit_price_cents = retail_price_cents
WHERE (cost_price_cents IS NULL OR cost_price_cents = 0) AND retail_price_cents > 0 AND min_unit_price_cents IS NULL;


-- ---------------- supabase/seed-market-amazon-2026-10-25.sql ----------------
-- Amazon (Xpose Safety store) prices pasted by Farshid on 2026-10-25. Reference only.
INSERT INTO market_observations (sku, source, kind, units, price_cents, note, checked_at) VALUES
  ('MTGB-1015', 'Amazon (Xpose Safety)', 'half_pallet', 140, 229999, 'Half pallet 140-pack', '2026-10-25'),
  ('BMT-5050',  'Amazon (Xpose Safety)', 'half_pallet', 4,   199999, 'Half pallet 4-pack, 60% shade', '2026-10-25'),
  ('CTW10-2020','Amazon (Xpose Safety)', 'full_pallet', 30,  439999, 'Full pallet 30-pack', '2026-10-25'),
  ('STH-3030',  'Amazon (Xpose Safety)', 'single', 1, 13499, NULL, '2026-10-25'),
  ('MTGB-3030', 'Amazon (Xpose Safety)', 'single', 1, 13499, NULL, '2026-10-25'),
  ('STH-3040',  'Amazon (Xpose Safety)', 'single', 1, 15699, NULL, '2026-10-25'),
  ('STH-3050',  'Amazon (Xpose Safety)', 'single', 1, 20199, NULL, '2026-10-25'),
  ('STH-3060',  'Amazon (Xpose Safety)', 'single', 1, 25699, NULL, '2026-10-25'),
  ('BHD-1230',  'Amazon (Xpose Safety)', 'single', 1, 10999, NULL, '2026-10-25'),
  ('BHD-2030',  'Amazon (Xpose Safety)', 'single', 1, 16999, NULL, '2026-10-25'),
  ('BHD-3030',  'Amazon (Xpose Safety)', 'single', 1, 24999, NULL, '2026-10-25'),
  -- 16-mil Silver/Brown line (not yet in our catalog), kept for reference
  ('SILVER-BROWN-16-2030', 'Amazon (Xpose Safety)', 'single', 1, 19999, '16 mil Silver/Brown 20x30 — not in catalog', '2026-10-25'),
  ('SILVER-BROWN-16-3030', 'Amazon (Xpose Safety)', 'single', 1, 24999, '16 mil Silver/Brown 30x30 — not in catalog', '2026-10-25'),
  ('SILVER-BROWN-16-3050', 'Amazon (Xpose Safety)', 'single', 1, 33299, '16 mil Silver/Brown 30x50 — not in catalog', '2026-10-25')
ON CONFLICT (sku, source, kind, units, checked_at) DO UPDATE SET price_cents = EXCLUDED.price_cents, note = EXCLUDED.note;


-- ---------------- supabase/migrations/0099_column_privileges.sql ----------------
-- ============================================================
-- 0099: Column-level privileges — hide cost & market data from the public API.
--
-- RLS controls WHICH ROWS a role can see; it cannot hide columns. The storefront
-- uses the public anon key, so without this anyone could query
-- products.cost_price_cents directly. Here we revoke table-wide SELECT from the
-- public roles and grant SELECT on every column EXCEPT the private ones.
--
-- Runs last on purpose. Safe to re-run. RE-RUN THIS FILE after any migration that
-- adds a new public column to products or pricing_rules (new columns are private
-- until granted). Service role (admin pages, webhooks) is unaffected.
-- ============================================================

DO $$
DECLARE
  cols text;
BEGIN
  -- products: everything except cost / market reference data
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'products'
    AND column_name NOT IN ('cost_price_cents', 'market_price_cents', 'market_price_source', 'market_price_url', 'market_price_checked_at');
  EXECUTE 'REVOKE SELECT ON public.products FROM anon, authenticated';
  EXECUTE format('GRANT SELECT (%s) ON public.products TO anon, authenticated', cols);

  -- pricing_rules: hide internal margin / markup inputs
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'pricing_rules'
    AND column_name NOT IN ('margin_percent', 'flat_markup_cents');
  EXECUTE 'REVOKE SELECT ON public.pricing_rules FROM anon, authenticated';
  EXECUTE format('GRANT SELECT (%s) ON public.pricing_rules TO anon, authenticated', cols);
END $$;


COMMIT;

-- Check: should list ~597 products, ~31 priced
SELECT count(*) AS products, count(*) FILTER (WHERE retail_price_cents > 0) AS priced FROM products;
