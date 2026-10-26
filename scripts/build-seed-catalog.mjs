// Generates supabase/seed-catalog.sql from supabase/catalog-232.sql (the raw Xpose
// supplier catalog) so it fits OUR schema (schema.sql + migrations/0002_catalog.sql)
// and layers on top of supabase/seed.sql without breaking it.
//
// - Loads catalog-232.sql into a throwaway in-memory Postgres (PGlite) to read its rows.
// - Maps product lines / categories / colors to the ones used by seed.sql.
// - Folds the separate `accessories` table into `products` (tarp_type = 'accessory').
// - Emits idempotent upserts keyed on xpose_sku that never overwrite existing
//   prices or images (the 24 live Shopify products keep their real data).
//
// Usage: node scripts/build-seed-catalog.mjs
import { PGlite } from '@electric-sql/pglite'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const src = new PGlite()
await src.exec(readFileSync('supabase/catalog-232.sql', 'utf8').replace(/CREATE EXTENSION[^;]*;/gi, ''))
const q = async (s) => (await src.query(s)).rows

// Existing seed slugs / SKUs (to keep slugs unique and know which SKUs already exist)
const seedSql = readFileSync('supabase/seed.sql', 'utf8')
const seedRows = [...seedSql.matchAll(/^\s*\('([^']+)',\s*'(?:[^']|'')*',\s*'([^']+)'/gm)]
const seedSkus = new Set(seedRows.map((m) => m[1]))
const usedSlugs = new Set(seedRows.map((m) => m[2]))

const LINE_MAP = {
  '5mil-multi': '5mil-light', // seed.sql already has the 5-mil line
  canvas: 'canvas-10oz', // seed's canvas-standard is 18 oz; the Xpose canvas is 10 oz
}
// Lines that seed.sql does not have yet (added with ON CONFLICT DO NOTHING)
const NEW_LINES = ['canvas', 'clear-20mil', 'clear-30mil', 'mesh', 'fr-clear']

const CAT_MAP = { agriculture: 'agriculture-farming', industrial: 'industrial-warehouse' }
const COLOR_MAP = {
  blue: 'Blue', 'silver-black': 'Silver/Black', brown: 'Brown', 'olive-drab': 'Olive Drab',
  black: 'Black', 'clear-fr': 'Clear', clear: 'Clear', 'white-fr': 'White', white: 'White',
}
const GRADE = {
  '5mil-multi': 'Multipurpose Poly Tarp',
  '10mil-heavy': 'Heavy Duty Poly Tarp',
  '12mil-xheavy': 'Extreme Duty Poly Tarp',
  '16mil-super': 'Super Heavy Duty Poly Tarp',
  '20mil-ultra': 'Ultra Heavy Duty Poly Tarp',
  canvas: 'Canvas Tarp',
  mesh: 'Mesh Tarp',
  'fr-clear': 'Fire Retardant Clear Vinyl Tarp',
  'fr-poly': 'Fire Retardant Poly Tarp',
  'clear-20mil': 'Clear Vinyl Tarp',
  'clear-30mil': 'Clear Vinyl Tarp',
}

const s = (v) => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)
const n = (v) => (v == null ? 'NULL' : String(Number(v)))
const b = (v) => (v ? 'true' : 'false')
const arr = (a) => `'{${a.join(',')}}'`

function uniqueSlug(slug) {
  let out = slug, i = 2
  while (usedSlugs.has(out)) out = `${slug}-${i++}`
  usedSlugs.add(out)
  return out
}

function productName(p, color) {
  const dims = `${p.width_ft}' x ${p.length_ft}'`
  const grade = GRADE[p.product_line_id] ?? 'Tarp'
  if (p.product_line_id === 'canvas') return `${dims} ${grade} - 10 oz (${color})`
  if (p.product_line_id === 'mesh') return `${dims} ${grade} - ${color} (60% Shade)`
  if (p.product_line_id?.startsWith('fr-') || p.product_line_id?.startsWith('clear-')) return `${dims} ${grade} - ${p.thickness_mil} Mil`
  return `${dims} ${grade} - ${p.thickness_mil} Mil (${color})`
}

// ─── Official Xpose catalog (case packs + SKUs missing from catalog-232) ──────
// supabase/pricing/xpose-catalog.csv is produced by scripts/parse-xpose-catalog.mjs.
const norm = (sku) => sku.trim().toUpperCase().replace(/-X$/, '')
const readCsv = (f) => {
  const [head, ...body] = readFileSync(f, 'utf8').trim().split(/\r?\n/)
  const cols = head.split(',')
  return body.map((line) => {
    const cells = [...line.matchAll(/("([^"]|"")*"|[^,]*)(,|$)/g)].map((m) => m[1].replace(/^"|"$/g, '').replace(/""/g, '"'))
    return Object.fromEntries(cols.map((c, i) => [c, cells[i] ?? '']))
  })
}
const xpose = new Map(readCsv('supabase/pricing/xpose-catalog.csv').map((r) => [r.sku, {
  sku: r.sku, prefix: r.line_prefix, w: +r.width_ft, l: +r.length_ft, color: r.color, case_pack: r.case_pack ? +r.case_pack : null,
}]))
GRADE['7mil-standard'] = 'Heavy Duty Poly Tarp'
GRADE['12mil-xheavy-x'] = 'Extra Heavy Duty Poly Tarp'
const PREFIX_DEFS = {
  BT: { line: '5mil-light', key: '5mil-multi', mil: 5, type: 'poly', slug: '5mil' },
  GT: { line: '5mil-light', key: '5mil-multi', mil: 5, type: 'poly', slug: '5mil' },
  BRT: { line: '5mil-light', key: '5mil-multi', mil: 5, type: 'poly', slug: '5mil' },
  BTH: { line: '7mil-standard', key: '7mil-standard', mil: 7, type: 'poly', slug: '7mil' },
  STH: { line: '10mil-heavy', key: '10mil-heavy', mil: 10, type: 'poly', slug: '10mil' },
  MTGB: { line: '10mil-heavy', key: '10mil-heavy', mil: 10, type: 'poly', slug: '10mil' },
  WHD: { line: '12mil-xheavy', key: '12mil-xheavy-x', mil: 12, type: 'poly', slug: '12mil' },
  STHD: { line: '12mil-xheavy', key: '12mil-xheavy-x', mil: 12, type: 'poly', slug: '12mil' },
  THD: { line: '12mil-xheavy', key: '12mil-xheavy-x', mil: 12, type: 'poly', slug: '12mil' },
  BHD: { line: '16mil-super', key: '16mil-super', mil: 16, type: 'poly', slug: '16mil' },
  UHD: { line: '20mil-ultra', key: '20mil-ultra', mil: 20, type: 'poly', slug: '20mil' },
  CTG10: { line: 'canvas-10oz', key: 'canvas', mil: null, type: 'canvas', slug: 'canvas' },
  CTT10: { line: 'canvas-10oz', key: 'canvas', mil: null, type: 'canvas', slug: 'canvas' },
  CTOD10: { line: 'canvas-10oz', key: 'canvas', mil: null, type: 'canvas', slug: 'canvas' },
  CTW10: { line: 'canvas-10oz', key: 'canvas', mil: null, type: 'canvas', slug: 'canvas' },
  CVT20: { line: 'clear-20mil', key: 'clear-20mil', mil: 20, type: 'clear-vinyl', slug: 'clear-20mil' },
  CVT30: { line: 'clear-30mil', key: 'clear-30mil', mil: 30, type: 'clear-vinyl', slug: 'clear-30mil' },
  CVTFR: { line: 'fr-clear', key: 'fr-clear', mil: 20, type: 'clear-vinyl', slug: 'fr-clear' },
}
const HEX = {
  Blue: '#2563EB', Green: '#15803D', Brown: '#78350F', 'Silver/Black': '#9CA3AF', 'Green/Black': '#166534',
  White: '#F8FAFC', Silver: '#CBD5E1', Tan: '#D2B48C', 'Brown/White': '#92400E', 'Olive Drab': '#4B5320', Clear: '#E5E7EB',
}
// Same sizing logic catalog-232 used: small = general purpose, bigger = jobsite / farm / warehouse
function catsForArea(a) {
  if (a < 100) return ['general-purpose']
  if (a < 300) return ['general-purpose', 'construction-roofing']
  if (a < 800) return ['construction-roofing', 'agriculture-farming']
  if (a < 1500) return ['construction-roofing', 'agriculture-farming', 'industrial-warehouse']
  return ['agriculture-farming', 'industrial-warehouse']
}

const lines = await q(`select * from product_lines order by id`)
const products = await q(`select * from products order by product_line_id, width_ft, length_ft`)
const accessories = await q(`select * from accessories order by accessory_type, xpose_sku`)

let out = `-- ============================================================
-- MegaTarps — Full supplier catalog (Xpose) layered on top of seed.sql
-- GENERATED by scripts/build-seed-catalog.mjs from supabase/catalog-232.sql — do not hand-edit.
--
-- Run order: schema.sql -> migrations/0002_catalog.sql -> seed.sql -> seed-catalog.sql
-- Idempotent: upserts by xpose_sku. Never overwrites an existing non-zero price,
-- cost or non-empty image list, and never renames/re-slugs existing products.
-- New SKUs land with retail_price_cents = 0 (quote-only) until priced in
-- /admin/products (bulk editor + CSV import).
-- ============================================================

-- ------------------------------------------------------------
-- Product lines missing from seed.sql
-- (5mil-multi -> 5mil-light; canvas -> canvas-10oz; the rest map 1:1)
-- ------------------------------------------------------------
INSERT INTO product_lines
  (id, name, thickness_mil, material, weave_count, weight_oz_per_sqyd, grommet_type, grommet_spacing_inches,
   uv_resistant, waterproof, mildew_resistant, fire_retardant, reinforced_corners, sewn_in_rope, description)
VALUES
`
const titleGrommet = (g) => (g === 'rust-proof' ? 'Rust-Proof Metal' : g.charAt(0).toUpperCase() + g.slice(1))
out += lines
  .filter((l) => NEW_LINES.includes(l.id))
  .map((l) => {
    const id = LINE_MAP[l.id] ?? l.id
    const name = l.id === 'canvas' ? '10 oz Cotton Canvas Tarp' : l.name.replace(/ Tarps\b/, ' Tarp').replace(/Tarps \(/, 'Tarp (')
    return `  (${s(id)}, ${s(name)}, ${n(l.thickness_mil)}, ${s(l.material)}, ${s(l.weave_count)}, ${n(l.weight_oz_per_sqyd)}, ${s(titleGrommet(l.grommet_type))}, ${n(l.grommet_spacing_inches)},\n   ${b(l.uv_resistant)}, ${b(l.waterproof)}, ${b(l.mildew_resistant)}, ${b(l.fire_retardant)}, ${b(l.reinforced_corners)}, ${b(l.sewn_in_rope)}, ${s(l.description)})`
  })
  .join(',\n')
out += `
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Tarps (${products.length} supplier SKUs)
-- ------------------------------------------------------------
INSERT INTO products
  (xpose_sku, name, slug, product_line_id, categories, tarp_type, thickness_mil,
   width_ft, length_ft, color, color_hex, retail_price_cents, cost_price_cents,
   units_per_case, active, in_stock, image_urls)
VALUES
`
const rows = []
let existing = 0
let casePackMatched = 0
const knownNorm = new Set([...seedSkus].map(norm))
const sizeCats = new Map()
for (const p of products) {
  if (seedSkus.has(p.xpose_sku)) existing++
  const pdf = xpose.get(norm(p.xpose_sku))
  // The official Xpose catalog wins for color (e.g. 20-mil is Brown/White, not Brown)
  const color = pdf?.color ?? COLOR_MAP[p.color] ?? p.color
  const cats = [...new Set(p.categories.map((c) => CAT_MAP[c] ?? c))]
  const line = LINE_MAP[p.product_line_id] ?? p.product_line_id
  const slug = seedSkus.has(p.xpose_sku) ? p.slug : uniqueSlug(p.slug)
  if (pdf?.case_pack) casePackMatched++
  knownNorm.add(norm(p.xpose_sku))
  const sz = `${p.width_ft}x${p.length_ft}`
  sizeCats.set(`${line}:${sz}`, cats)
  if (p.tarp_type === 'poly' && !sizeCats.has(sz)) sizeCats.set(sz, cats)
  rows.push(`  (${s(p.xpose_sku)}, ${s(productName(p, color))}, ${s(slug)}, ${s(line)}, ${arr(cats)}, ${s(p.tarp_type)}, ${n(p.thickness_mil)}, ${p.width_ft}, ${p.length_ft}, ${s(color)}, ${s(pdf ? HEX[color] ?? p.color_hex : p.color_hex)}, 0, 0, ${n(pdf?.case_pack)}, true, true, '[]'::jsonb)`)
}
const matchedExisting = products.filter((p) => xpose.has(norm(p.xpose_sku))).length
// SKUs in the official Xpose catalog that catalog-232.sql didn't have -> quote-only products
const added = []
const skuBySku = new Map(products.map((p) => [norm(p.xpose_sku), p.xpose_sku]))
for (const x of xpose.values()) {
  if (knownNorm.has(x.sku)) continue
  const def = PREFIX_DEFS[x.prefix]
  if (!def) continue
  const w = Math.min(x.w, x.l), l = Math.max(x.w, x.l)
  const p = { width_ft: w, length_ft: l, product_line_id: def.key, thickness_mil: def.mil }
  const cats = sizeCats.get(`${def.line}:${w}x${l}`)
    ?? (def.type === 'clear-vinyl' ? ['construction-roofing', 'industrial-warehouse'] : null) // enclosures, like the FR clear line
    ?? sizeCats.get(`${w}x${l}`) ?? catsForArea(w * l)
  const colorSlug = x.color === 'Clear' ? '' : `-${x.color.toLowerCase().replace(/[^a-z]+/g, '')}`
  const slug = uniqueSlug(`${def.slug}${colorSlug}-${w}x${l}`)
  if (x.case_pack) casePackMatched++
  added.push(x)
  knownNorm.add(x.sku)
  rows.push(`  (${s(x.sku)}, ${s(productName(p, x.color))}, ${s(slug)}, ${s(def.line)}, ${arr(cats)}, ${s(def.type)}, ${n(def.mil)}, ${w}, ${l}, ${s(x.color)}, ${s(HEX[x.color] ?? null)}, 0, 0, ${n(x.case_pack)}, true, true, '[]'::jsonb)`)
}
// ─── The Tarps Wholesaler (Xpose's own store) ────────────────────────────────
// supabase/pricing/tarps-wholesaler.csv: every per-unit and pallet variant from
// thetarpswholesaler.com/products/<handle>.json (collected 2026-10-25).
PREFIX_DEFS.BMT = { line: 'mesh', key: 'mesh', mil: null, type: 'mesh', slug: 'mesh' }
const PREFIX_COLOR = {
  BT: 'Blue', BRT: 'Brown', BTH: 'Blue', STH: 'Silver/Black', MTGB: 'Green/Black', WHD: 'White', STHD: 'Silver', THD: 'Tan',
  BHD: 'Brown', UHD: 'Brown/White', CTG10: 'Green', CTT10: 'Tan', CTOD10: 'Olive Drab', CTW10: 'White',
  CVT20: 'Clear', CVT30: 'Clear', CVTFR: 'Clear', BMT: 'Black',
}
const ttw = readCsv('supabase/pricing/tarps-wholesaler.csv').map((r) => ({ ...r, units: +r.units, cents: +r.price_cents, w: +r.width_ft, l: +r.length_ft }))
const ttwSingles = new Map(ttw.filter((r) => r.kind === 'single').map((r) => [r.sku, r]))
const ttwPallets = new Map()
for (const r of ttw.filter((r) => r.kind !== 'single')) {
  const cur = ttwPallets.get(r.sku) ?? { sku: r.sku, half: null, full: null, half_cents: null, full_cents: null, url: r.source_url }
  if (r.kind === 'half_pallet') { cur.half = r.units; cur.half_cents = r.cents } else { cur.full = r.units; cur.full_cents = r.cents }
  ttwPallets.set(r.sku, cur)
}
// Store SKUs we don't carry yet -> quote-only products (same style as the Xpose catalog adds)
const addedTtw = []
for (const x of ttwSingles.values()) {
  if (knownNorm.has(x.sku)) continue
  const prefix = x.sku.split('-')[0]
  const def = PREFIX_DEFS[prefix]
  if (!def || !x.w || !x.l) continue
  const w = Math.min(x.w, x.l), l = Math.max(x.w, x.l)
  const color = PREFIX_COLOR[prefix]
  const p = { width_ft: w, length_ft: l, product_line_id: def.key, thickness_mil: def.mil }
  const cats = sizeCats.get(`${def.line}:${w}x${l}`) ?? (def.type === 'clear-vinyl' ? ['construction-roofing', 'industrial-warehouse'] : null) ?? sizeCats.get(`${w}x${l}`) ?? catsForArea(w * l)
  const colorSlug = color === 'Clear' ? '' : `-${color.toLowerCase().replace(/[^a-z]+/g, '')}`
  const slug = uniqueSlug(`${def.slug}${colorSlug}-${w}x${l}`)
  addedTtw.push(x.sku)
  knownNorm.add(x.sku)
  rows.push(`  (${s(x.sku)}, ${s(productName(p, color))}, ${s(slug)}, ${s(def.line)}, ${arr(cats)}, ${s(def.type)}, ${n(def.mil)}, ${w}, ${l}, ${s(color)}, ${s(HEX[color] ?? null)}, 0, 0, NULL, true, true, '[]'::jsonb)`)
}
out += rows.join(',\n')

const upsertTail = `
ON CONFLICT (xpose_sku) DO UPDATE SET
  -- fill blanks only; never clobber real data from seed.sql / admin edits
  product_line_id       = COALESCE(products.product_line_id, EXCLUDED.product_line_id),
  thickness_mil         = COALESCE(products.thickness_mil, EXCLUDED.thickness_mil),
  color_hex             = COALESCE(products.color_hex, EXCLUDED.color_hex),
  units_per_case        = COALESCE(products.units_per_case, EXCLUDED.units_per_case),
  pack_quantity         = COALESCE(products.pack_quantity, EXCLUDED.pack_quantity),
  accessory_type        = COALESCE(products.accessory_type, EXCLUDED.accessory_type),
  size_label            = COALESCE(products.size_label, EXCLUDED.size_label),
  material              = COALESCE(products.material, EXCLUDED.material),
  retail_price_cents    = CASE WHEN products.retail_price_cents > 0 THEN products.retail_price_cents ELSE EXCLUDED.retail_price_cents END,
  cost_price_cents      = CASE WHEN COALESCE(products.cost_price_cents, 0) > 0 THEN products.cost_price_cents ELSE EXCLUDED.cost_price_cents END,
  image_urls            = CASE WHEN jsonb_array_length(COALESCE(products.image_urls, '[]'::jsonb)) > 0 THEN products.image_urls ELSE EXCLUDED.image_urls END;
`
// Tarps don't carry accessory columns in the VALUES list; use a narrower tail.
out += `
ON CONFLICT (xpose_sku) DO UPDATE SET
  -- fill blanks only; never clobber real data from seed.sql / admin edits
  product_line_id       = COALESCE(products.product_line_id, EXCLUDED.product_line_id),
  thickness_mil         = COALESCE(products.thickness_mil, EXCLUDED.thickness_mil),
  color_hex             = COALESCE(products.color_hex, EXCLUDED.color_hex),
  units_per_case        = COALESCE(products.units_per_case, EXCLUDED.units_per_case),
  retail_price_cents    = CASE WHEN products.retail_price_cents > 0 THEN products.retail_price_cents ELSE EXCLUDED.retail_price_cents END,
  cost_price_cents      = CASE WHEN COALESCE(products.cost_price_cents, 0) > 0 THEN products.cost_price_cents ELSE EXCLUDED.cost_price_cents END,
  image_urls            = CASE WHEN jsonb_array_length(COALESCE(products.image_urls, '[]'::jsonb)) > 0 THEN products.image_urls ELSE EXCLUDED.image_urls END;

-- ------------------------------------------------------------
-- Accessories (${accessories.length} SKUs) — folded into products as tarp_type 'accessory'
-- (catalog-232.sql's separate accessories table is NOT created; width/length = 0
--  like the accessories already in seed.sql)
-- ------------------------------------------------------------
INSERT INTO products
  (xpose_sku, name, slug, product_line_id, categories, tarp_type, thickness_mil,
   width_ft, length_ft, color, color_hex, retail_price_cents, cost_price_cents,
   units_per_case, pack_quantity, accessory_type, size_label, material, active, in_stock, image_urls)
VALUES
`
const ACC_CATS = {
  'tie-down': ['general-purpose', 'construction-roofing'],
  bungee: ['general-purpose', 'construction-roofing'],
  clip: ['general-purpose', 'construction-roofing'],
  'cable-tie': ['general-purpose', 'industrial-warehouse'],
  'ratchet-strap': ['general-purpose', 'industrial-warehouse', 'agriculture-farming'],
}
const accRows = []
for (const a of accessories) {
  if (seedSkus.has(a.xpose_sku)) existing++
  // Only state a color when the supplier name does; otherwise 'Standard' (not shown as a swatch)
  const color = /black/i.test(a.name) ? 'Black' : 'Standard'
  const hex = color === 'Black' ? '#1E293B' : null
  const slug = seedSkus.has(a.xpose_sku) ? a.slug : uniqueSlug(a.slug)
  accRows.push(`  (${s(a.xpose_sku)}, ${s(a.name)}, ${s(slug)}, NULL, ${arr(ACC_CATS[a.accessory_type] ?? ['general-purpose'])}, 'accessory', NULL, 0, 0, ${s(color)}, ${s(hex)}, ${n(a.retail_price_cents ?? 0)}, ${n(a.cost_price_cents ?? 0)}, NULL, ${n(a.pack_quantity)}, ${s(a.accessory_type)}, ${s(a.size)}, ${s(a.material)}, true, true, '[]'::jsonb)`)
}
out += accRows.join(',\n')
out += upsertTail

out += `
-- ------------------------------------------------------------
-- Shopify bulk-pallet SKUs (…-HP16 = a half pallet of 16 tarps, …-FP12 = a full pallet of 12):
-- the sellable unit IS a pallet, so the tarp count goes in pack_quantity (pieces per unit).
-- units_per_*_pallet stays NULL on these so per-tarp pallet tiers never apply to them.
-- ------------------------------------------------------------
UPDATE products SET pack_quantity = (regexp_match(xpose_sku, '-(HP|FP)([0-9]+)$'))[2]::int
  WHERE xpose_sku ~ '-(HP|FP)[0-9]+$' AND pack_quantity IS NULL;
UPDATE products SET units_per_half_pallet = NULL, units_per_full_pallet = NULL
  WHERE xpose_sku ~ '-(HP|FP)[0-9]+$';

-- Supplier catalog: ${products.length} tarps + ${accessories.length} accessories from catalog-232.sql, plus
-- ${added.length} tarps from the official Xpose catalog (supabase/pricing/xpose-catalog.csv), plus
-- ${addedTtw.length} more sizes listed on thetarpswholesaler.com (supabase/pricing/tarps-wholesaler.csv)
-- (${existing} already in seed.sql and kept as-is).
`

// ─── Official spec sheet corrections (Xpose "Tarp features and specifications") ──
out += `
-- ------------------------------------------------------------
-- Product-line specs from the official Xpose spec table (weave, weight, grommet spacing).
-- Spec data only — never touches prices.
-- ------------------------------------------------------------
UPDATE product_lines SET weave_count = '8x8',   weight_oz_per_sqyd = 3.6,  grommet_spacing_inches = 36 WHERE id = '5mil-light';
UPDATE product_lines SET weave_count = '10x10', weight_oz_per_sqyd = 3.65, grommet_spacing_inches = 36 WHERE id = '7mil-standard';
UPDATE product_lines SET weave_count = '12x12', weight_oz_per_sqyd = 4.25, grommet_spacing_inches = 18 WHERE id = '10mil-heavy';
UPDATE product_lines SET weave_count = '14x14', weight_oz_per_sqyd = 6,    grommet_spacing_inches = 18, name = '12-Mil Extra Heavy Duty Poly' WHERE id = '12mil-xheavy';
UPDATE product_lines SET weave_count = '16x16', weight_oz_per_sqyd = 8,    grommet_spacing_inches = 18 WHERE id = '16mil-super';
UPDATE product_lines SET weave_count = '16x16', weight_oz_per_sqyd = 11,   grommet_spacing_inches = 18 WHERE id = '20mil-ultra';
UPDATE product_lines SET weight_oz_per_sqyd = 18, grommet_spacing_inches = 18 WHERE id = 'fr-clear';
`

// ─── Market reference prices (public retail; reference only, never sets retail) ──
// Priority: The Tarps Wholesaler (Xpose's own store) > TractorSupply / Walmart / eBay / WebstaurantStore.
const TTW_SOURCE = 'The Tarps Wholesaler (Xpose store)'
const marketBySku = new Map()
for (const r of readCsv('supabase/pricing/market-reference.csv')) {
  const cents = Number(r.market_price_cents)
  if (Number.isInteger(cents) && cents > 0) marketBySku.set(norm(r.sku), { sku: norm(r.sku), cents, source: r.source_name, url: r.source_url, checked: r.checked_at })
}
const otherMarket = new Map(marketBySku)
for (const r of ttwSingles.values()) marketBySku.set(r.sku, { sku: r.sku, cents: r.cents, source: TTW_SOURCE, url: r.source_url, checked: r.checked_at })
const market = [...marketBySku.values()]
const marketMatched = market.filter((r) => knownNorm.has(r.sku))
const marketUnmatched = market.filter((r) => !knownNorm.has(r.sku)).map((r) => r.sku)
out += `
-- ------------------------------------------------------------
-- Market reference prices (${marketMatched.length} SKUs): The Tarps Wholesaler (Xpose's own store,
-- supabase/pricing/tarps-wholesaler.csv) first, else supabase/pricing/market-reference.csv.
-- Reference only: never used as the sell price. Matches xpose_sku with or without "-X".
-- ------------------------------------------------------------
UPDATE products p SET
  market_price_cents = v.cents, market_price_source = v.source, market_price_url = v.url, market_price_checked_at = v.checked::date
FROM (VALUES
${marketMatched.map((r) => `  (${s(r.sku)}, ${r.cents}, ${s(r.source)}, ${s(r.url)}, ${s(r.checked)})`).join(',\n')}
) AS v(sku, cents, source, url, checked)
WHERE regexp_replace(upper(p.xpose_sku), '-X$', '') = v.sku;

-- Shopify listings without an Xpose SKU: same mil / size / color as an Xpose SKU
UPDATE products p SET market_price_cents = q.market_price_cents, market_price_source = q.market_price_source,
  market_price_url = q.market_price_url, market_price_checked_at = q.market_price_checked_at
FROM products q
WHERE p.xpose_sku IN ('MT-30X40-10MIL', 'MT-30X40-10MIL-SB') AND q.xpose_sku = 'STH-3040' AND p.market_price_cents IS NULL;

-- ------------------------------------------------------------
-- Pallet quantities from The Tarps Wholesaler "Bulk Pallet" variants (…-HP48 / …-FP96).
-- ${ttwPallets.size} SKUs. Only fills blanks; never applied to the Shopify pallet SKUs themselves.
-- ------------------------------------------------------------
UPDATE products p SET
  units_per_half_pallet = COALESCE(p.units_per_half_pallet, v.half_qty),
  units_per_full_pallet = COALESCE(p.units_per_full_pallet, v.full_qty)
FROM (VALUES
${[...ttwPallets.values()].map((r) => `  (${s(r.sku)}, ${n(r.half)}, ${n(r.full)})`).join(',\n')}
) AS v(sku, half_qty, full_qty)
WHERE regexp_replace(upper(p.xpose_sku), '-X$', '') = v.sku AND p.xpose_sku !~ '-(HP|FP)[0-9]+$';
-- Shopify per-unit 7/10-mil listings (no Xpose SKU): take the pallet size of the same mil + size
UPDATE products p SET
  units_per_half_pallet = COALESCE(p.units_per_half_pallet, q.units_per_half_pallet),
  units_per_full_pallet = COALESCE(p.units_per_full_pallet, q.units_per_full_pallet)
FROM products q
WHERE p.xpose_sku LIKE 'MT-%' AND p.thickness_mil IN (7, 10) AND p.tarp_type = 'poly'
  AND q.xpose_sku ~ CASE p.thickness_mil WHEN 7 THEN '^BTH-' ELSE '^STH-' END
  AND q.width_ft = p.width_ft AND q.length_ft = p.length_ft;
`

// ─── Farshid's pallet plan (supabase/pricing/pallet-plan.csv) ────────────────
// Real Xpose half/full pallet quantities per mil + size and his price plan:
// guest (retail) = competitor full-pallet per-tarp × 0.95; approved account 1 / 2+ / 3+ pallets
// = × 0.90 / 0.85 / 0.81 (seeded as pallet rules in seed.sql, relative to guest).
// Safety: never below cost × 1.15 (min_unit_price_cents, enforced by the engine on every tier),
// never above the market single-unit price. Flagged rows fall back to cost × 1.35.
const PLAN_COLOR_LINES = { 5: '5mil-light', 7: '7mil-standard', 10: '10mil-heavy' }
const plan = readFileSync('supabase/pricing/pallet-plan.csv', 'utf8').split(/\r?\n/)
  .filter((l) => l && !l.startsWith('#') && !l.startsWith('size,'))
  .map((line, ord) => {
    const c = [...line.matchAll(/("([^"]|"")*"|[^,]*)(,|$)/g)].map((m) => m[1].replace(/^"|"$/g, ''))
    const [size, mil, color, half, , full, , comp, cost, flag = ''] = c
    const [w, l] = size.split('x').map(Number)
    const fullUnknown = !full || /full pallet qty unknown|SUSPECT: full listed/i.test(flag)
    const fallback = !comp || /SUSPECT|uses half-pallet listing/i.test(flag)
    return { ord, mil: +mil, w, l, color: color.toLowerCase(), half: half ? +half : null, full: fullUnknown ? null : +full,
      comp_cents: comp ? Math.round(Number(comp) * 100) : null, cost: cost ? Number(cost) : null, fallback, flag }
  })
function palletPlanSql() {
  const vals = plan.map((r) => `  (${r.ord}, ${r.mil}, ${r.w}, ${r.l}, ${s(r.color)}, ${n(r.half)}, ${n(r.full)}, ${n(r.comp_cents)}, ${r.fallback})`).join(',\n')
  const match = `p.tarp_type = 'poly' AND p.thickness_mil = plan.mil
      AND p.product_line_id IN (${Object.values(PLAN_COLOR_LINES).map(s).join(', ')})
      AND LEAST(p.width_ft, p.length_ft) = LEAST(plan.w, plan.l) AND GREATEST(p.width_ft, p.length_ft) = GREATEST(plan.w, plan.l)`
  // one plan row per product: same color first, else the first row for that mil + size
  const pick = `SELECT DISTINCT ON (p.id) p.id, plan.* FROM products p JOIN plan ON ${match}
    ORDER BY p.id, (lower(p.color) = plan.color) DESC, plan.ord`
  return `
-- ------------------------------------------------------------
-- PALLET QUANTITIES from Farshid's plan (real Xpose half/full pallet counts), all colors of the
-- same mil + size unless a color-specific row exists. Unknown / suspect counts keep the
-- The Tarps Wholesaler value set above. Overrides earlier values (this is the reference).
-- ------------------------------------------------------------
WITH plan(ord, mil, w, l, color, half_qty, full_qty, comp_cents, fallback) AS (VALUES
${vals}
), pick AS (${pick})
UPDATE products p SET
  units_per_half_pallet = COALESCE(pick.half_qty, p.units_per_half_pallet),
  units_per_full_pallet = COALESCE(pick.full_qty, p.units_per_full_pallet)
FROM pick WHERE p.id = pick.id AND p.xpose_sku !~ '-(HP|FP)[0-9]+$';
-- A "half" pallet that isn't smaller than the full one is a data error: drop the half count.
UPDATE products SET units_per_half_pallet = NULL WHERE units_per_half_pallet >= units_per_full_pallet;

-- ------------------------------------------------------------
-- PRICES — Farshid's plan. Per tarp: guest = competitor full-pallet per-tarp × 0.95
-- (fallback cost × 1.35 → next .99 for flagged rows / no competitor price), capped at the
-- market single-unit price, floored at cost × 1.15. min_unit_price_cents = cost × 1.15 is
-- the floor the pricing engine enforces on every tier (pallet tiers, account discounts).
-- Shopify pallet SKUs: per-tarp price × tarps on the pallet.
-- Sets retail where it is still 0, plus the 4 Shopify 10-mil listings the plan re-prices.
-- ------------------------------------------------------------
WITH plan(ord, mil, w, l, color, half_qty, full_qty, comp_cents, fallback) AS (VALUES
${vals}
), pick AS (${pick}),
calc AS (
  SELECT p.id, COALESCE(p.pack_quantity, 1) AS pack,
    p.cost_price_cents::numeric / CASE WHEN p.xpose_sku ~ '-(HP|FP)[0-9]+$' THEN COALESCE(p.pack_quantity, 1) ELSE 1 END AS unit_cost,
    pick.comp_cents, pick.fallback, p.market_price_cents
  FROM products p JOIN pick ON pick.id = p.id
  WHERE p.cost_price_cents > 0
), priced AS (
  SELECT id, pack, ceil(unit_cost * 1.15)::int AS floor_cents,
    GREATEST(ceil(unit_cost * 1.15),
      LEAST(COALESCE(market_price_cents, 2147483647),
        CASE WHEN fallback OR comp_cents IS NULL THEN ceil((unit_cost * 1.35 + 1) / 100.0) * 100 - 1
             ELSE round(comp_cents * 0.95) END))::int AS guest_cents
  FROM calc
)
UPDATE products p SET
  retail_price_cents = CASE WHEN p.xpose_sku ~ '-(HP|FP)[0-9]+$' THEN priced.guest_cents * priced.pack ELSE priced.guest_cents END,
  min_unit_price_cents = CASE WHEN p.xpose_sku ~ '-(HP|FP)[0-9]+$' THEN priced.floor_cents * priced.pack ELSE priced.floor_cents END
FROM priced
WHERE p.id = priced.id
  AND (p.retail_price_cents = 0 OR p.xpose_sku IN ('MT-20X30-10MIL', 'MT-30X40-10MIL', 'MT-30X40-10MIL-SB', 'MT-40X60-10MIL'));
`
}

// ─── Supplier cost (All In Safety quote 2025-11-03) ───────────────────────────
const quote = readFileSync('supabase/pricing/supplier-quote-2025-11-03.csv', 'utf8').split(/\r?\n/)
  .filter((l) => l && !l.startsWith('#') && !l.startsWith('mil,'))
  .map((l) => { const [mil, w, len, usd] = l.split(','); return { mil: +mil, w: +w, l: +len, cents: Math.round(Number(usd) * 100) } })
out += `
-- ------------------------------------------------------------
-- SUPPLIER COST — All In Safety quote 2025-11-03; reconfirm before ordering.
-- Per-unit cost applied to every color of the same mil + size (7 mil = BTH line,
-- 10 mil = STH silver/black + MTGB green/black + the Shopify 10-mil listings).
-- Shopify pallet SKUs (…-HP72 / …-FP20) get cost × units on the pallet.
-- Fills blanks only (admin / CSV edits win).
-- ------------------------------------------------------------
WITH q(mil, w, l, cents) AS (VALUES
${quote.map((r) => `  (${r.mil}, ${r.w}, ${r.l}, ${r.cents})`).join(',\n')}
)
UPDATE products p SET cost_price_cents = q.cents * CASE WHEN p.xpose_sku ~ '-(HP|FP)[0-9]+$' THEN p.pack_quantity ELSE 1 END
FROM q
WHERE p.tarp_type = 'poly' AND p.thickness_mil = q.mil
  AND p.product_line_id IN ('7mil-standard', '10mil-heavy')
  AND LEAST(p.width_ft, p.length_ft) = LEAST(q.w, q.l) AND GREATEST(p.width_ft, p.length_ft) = GREATEST(q.w, q.l)
  AND COALESCE(p.cost_price_cents, 0) = 0
  AND (p.xpose_sku !~ '-(HP|FP)[0-9]+$' OR p.pack_quantity IS NOT NULL);

${palletPlanSql()}
`
writeFileSync('supabase/seed-catalog.sql', out)

// ─── Derived CSVs (computed against the real seeded data) ─────────────────────
const db = new PGlite()
await db.exec(`CREATE SCHEMA IF NOT EXISTS auth; CREATE TABLE IF NOT EXISTS auth.users (id uuid primary key);
  CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'select null::uuid';`)
const migs = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort().map((f) => `supabase/migrations/${f}`)
for (const f of ['supabase/schema.sql', ...migs, 'supabase/seed.sql', 'supabase/seed-catalog.sql']) {
  await db.exec(readFileSync(f, 'utf8').replace(/CREATE EXTENSION[^;]*;/gi, ''))
}
const all = (await db.query(`select xpose_sku, name, thickness_mil, width_ft, length_ft, color, cost_price_cents, retail_price_cents,
  min_unit_price_cents, market_price_cents, market_price_source, units_per_full_pallet, units_per_half_pallet, pack_quantity
  from products order by thickness_mil, width_ft * length_ft, xpose_sku`)).rows
const money = (c) => (c / 100).toFixed(2)
const ceil99 = (c) => Math.ceil((c + 1) / 100) * 100 - 1
const costed = all.filter((r) => r.cost_price_cents > 0)
writeFileSync('supabase/pricing/supplier-cost.csv',
  ['sku,cost', ...costed.map((r) => `${r.xpose_sku},${money(r.cost_price_cents)}`)].join('\n') + '\n')
writeFileSync('supabase/pricing/suggested-retail-cost35.csv',
  ['sku,retail', ...costed.map((r) => `${r.xpose_sku},${money(ceil99(r.cost_price_cents * 1.35))}`)].join('\n') + '\n')
writeFileSync('supabase/pricing/suggested-retail-cost30.csv',
  ['sku,retail', ...costed.map((r) => `${r.xpose_sku},${money(ceil99(r.cost_price_cents * 1.30))}`)].join('\n') + '\n')
// market − 10% for everything with a market price (exact cents)
const withMarket = all.filter((r) => r.market_price_cents > 0)
writeFileSync('supabase/pricing/suggested-retail.csv',
  ['sku,retail', ...withMarket.map((r) => `${r.xpose_sku},${money(Math.round(r.market_price_cents * 0.9))}`)].join('\n') + '\n')
// Sanity: our cost×1.35 retail vs The Tarps Wholesaler per-unit price
const isPalletSku = (sku) => /-(HP|FP)\d+$/.test(sku)
const notBelow = costed.filter((r) => !isPalletSku(r.xpose_sku) && r.market_price_cents && r.retail_price_cents >= r.market_price_cents * 0.9)

console.log(`seed-catalog.sql: ${products.length} tarps + ${accessories.length} accessories from catalog-232 (${existing} overlap with seed.sql) + ${added.length} from the Xpose catalog + ${addedTtw.length} from The Tarps Wholesaler`)
console.log(`Xpose catalog: ${xpose.size} SKUs; matched ${matchedExisting} existing catalog-232 SKUs; units_per_case set on ${casePackMatched} products`)
console.log(`market prices: ${marketMatched.length} matched (${marketMatched.filter((r) => r.source === TTW_SOURCE).length} from The Tarps Wholesaler)${marketUnmatched.length ? `; unmatched: ${marketUnmatched.join(' ')}` : ''}`)
console.log(`pallet qty: full ${all.filter((r) => r.units_per_full_pallet).length}, half ${all.filter((r) => r.units_per_half_pallet).length} products`)
console.log(`supplier cost on ${costed.length} SKUs; priced ${costed.filter((r) => r.retail_price_cents > 0).length}; retail within 10% of (or above) market: ${notBelow.map((r) => r.xpose_sku).join(' ') || 'none'}`)
console.log(`plan rows falling back to cost x 1.35: ${plan.filter((r) => r.fallback && r.cost).map((r) => `${r.w}x${r.l} ${r.mil}mil ${r.color}`).join('; ')}`)
if (process.argv.includes('--report')) {
  const m = (r, f) => Math.max(r.min_unit_price_cents || 0, Math.round(r.retail_price_cents * f))
  console.log('sku | mil | size | color | cost | guest | 1 pallet | 2+ | 3+ | margin@3+ | half/full | market | other market')
  for (const r of costed) {
    const pal = isPalletSku(r.xpose_sku)
    const k = pal ? r.pack_quantity : 1
    const p3 = pal ? null : m(r, 0.81 / 0.95)
    const other = otherMarket.get(norm(r.xpose_sku))
    console.log([r.xpose_sku, r.thickness_mil, `${r.width_ft}x${r.length_ft}`, r.color, money(r.cost_price_cents / k), money(r.retail_price_cents / k),
      pal ? '' : money(m(r, 0.9 / 0.95)), pal ? '' : money(m(r, 0.85 / 0.95)), pal ? '' : money(p3),
      pal ? `(pallet of ${k})` : `${(((p3 - r.cost_price_cents) / p3) * 100).toFixed(1)}%`,
      `${r.units_per_half_pallet ?? '-'}/${r.units_per_full_pallet ?? '-'}`,
      r.market_price_cents ? `${money(r.market_price_cents)} ${r.market_price_source === TTW_SOURCE ? 'TTW' : r.market_price_source}` : '',
      other ? `${money(other.cents)} ${other.source}` : ''].join(' | '))
  }
}
