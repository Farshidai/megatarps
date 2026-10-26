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

-- Priced accessories (bungee 10-packs). ESTIMATE, not measured: ten 9"/11" ball bungees plus the
-- bag weigh about 1 lb. Replace with the real packed weight from Xpose / All In Safety when known.
-- Weight is per sellable unit (the 10-pack). Without it these items forced a freight quote.
UPDATE products SET shipping_weight_lb = 1.0 WHERE xpose_sku IN ('BB-9B-10', 'BB-11B-10') AND shipping_weight_lb IS NULL;
