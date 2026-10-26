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
