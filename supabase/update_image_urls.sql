-- Update product image_urls to use local photos.
-- Local images take priority; Shopify CDN URL kept as fallback in array.
-- Run in Supabase SQL editor after seed.sql has loaded products.

-- 20x20 7-mil bulk pallet
UPDATE products SET image_urls =
  '["/images/pallet-20x20-7mil.jpg","https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-20-heavy-duty-poly-tarp-7-mil-bulk-pallet20-x-20-heavy-duty-poly-tarp-7-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-7121853.jpg?v=1764826687"]'::jsonb
WHERE xpose_sku = '20X20-7MIL-HP72';

-- 20x20 10-mil bulk pallet
UPDATE products SET image_urls =
  '["/images/pallet-20x20-10mil.jpg","https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-20-heavy-duty-poly-tarp-10-mil-bulk-pallet20-x-20-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-1906435.jpg?v=1764826691"]'::jsonb
WHERE xpose_sku = '20X20-10MIL-HP72';

-- 20x30 12-mil bulk pallet (24 pack) — also used for 30x40 12-mil if needed
UPDATE products SET image_urls =
  '["/images/pallet-20x30-12mil.jpg","/images/spec-12mil.jpg","/images/wave-12mil.jpg"]'::jsonb
WHERE xpose_sku = 'MT-20X30-12MIL';

-- 30x40 12-mil extreme duty
UPDATE products SET image_urls =
  '["/images/pallet-20x30-12mil.jpg","/images/spec-12mil.jpg","/images/wave-12mil.jpg","https://cdn.shopify.com/s/files/1/0788/9040/2049/files/30-x-40-extreme-duty-poly-tarp-12-mil30-x-40-extreme-duty-poly-tarp-12-milextreme-duty-tarpmega-tarpsmega-tarps-7675509.jpg?v=1764826687"]'::jsonb
WHERE xpose_sku = 'MT-30X40-12MIL';

-- 16x20 12-mil extreme duty (White)
UPDATE products SET image_urls =
  '["/images/spec-12mil.jpg","/images/wave-12mil.jpg","https://cdn.shopify.com/s/files/1/0788/9040/2049/files/16-x-20-extreme-duty-poly-tarp-12-mil16-x-20-extreme-duty-poly-tarp-12-milextreme-duty-tarpmega-tarpsmega-tarps-8810614.jpg?v=1764826690"]'::jsonb
WHERE xpose_sku = 'MT-16X20-12MIL';

-- 30x40 10-mil Silver/Black (reversible)
UPDATE products SET image_urls =
  '["/images/tarp-10mil-reversible.jpg","/images/wave-10mil.jpg"]'::jsonb
WHERE xpose_sku = 'MT-30X40-10MIL-SB';

-- 30x40 10-mil heavy duty (single)
UPDATE products SET image_urls =
  '["/images/tarp-10mil-mega.jpg","/images/wave-10mil.jpg","/images/pallet-30x40.jpg"]'::jsonb
WHERE xpose_sku = 'MT-30X40-10MIL';

-- 20x20 10-mil heavy duty — no matching single SKU, skip

-- 12x16 10-mil heavy duty
UPDATE products SET image_urls =
  '["/images/tarp-10mil.jpg","/images/wave-10mil.jpg"]'::jsonb
WHERE xpose_sku = 'MT-12X16-10MIL';

-- 40x60 10-mil heavy duty
UPDATE products SET image_urls =
  '["/images/tarp-10mil-mega.jpg","/images/wave-10mil.jpg","https://cdn.shopify.com/s/files/1/0788/9040/2049/files/40-x-60-heavy-duty-poly-tarp-10-mil40-x-60-heavy-duty-poly-tarp-10-milheavy-duty-tarpmega-tarpsmega-tarps-9714655.jpg?v=1764826689"]'::jsonb
WHERE xpose_sku = 'MT-40X60-10MIL';

-- 20x30 10-mil bulk pallet
UPDATE products SET image_urls =
  '["/images/pallet-20x30.jpg","https://cdn.shopify.com/s/files/1/0788/9040/2049/files/20-x-30-heavy-duty-poly-tarp-10-mil-bulk-pallet20-x-30-heavy-duty-poly-tarp-10-mil-bulk-palletconstruction-tarpsmega-tarpsmega-tarps-7068500.jpg?v=1764826690"]'::jsonb
WHERE xpose_sku = '20X30-10MIL-HP48';

-- Verify
SELECT xpose_sku, name, image_urls FROM products WHERE image_urls::text LIKE '%/images/%' ORDER BY xpose_sku;
