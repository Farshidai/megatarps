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
