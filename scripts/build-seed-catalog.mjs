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
import { readFileSync, writeFileSync } from 'node:fs'

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
-- Pallet quantities encoded in the Shopify bulk-pallet SKUs (…-HP16 = 16 per
-- half pallet, …-FP12 = 12 per full pallet). Only fills blanks.
-- ------------------------------------------------------------
UPDATE products SET units_per_half_pallet = (regexp_match(xpose_sku, '-HP([0-9]+)$'))[1]::int
  WHERE xpose_sku ~ '-HP[0-9]+$' AND units_per_half_pallet IS NULL;
UPDATE products SET units_per_full_pallet = (regexp_match(xpose_sku, '-FP([0-9]+)$'))[1]::int
  WHERE xpose_sku ~ '-FP[0-9]+$' AND units_per_full_pallet IS NULL;

-- Supplier catalog: ${products.length} tarps + ${accessories.length} accessories from catalog-232.sql, plus
-- ${added.length} tarps from the official Xpose catalog (supabase/pricing/xpose-catalog.csv)
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
const market = readCsv('supabase/pricing/market-reference.csv')
  .map((r) => ({ ...r, sku: norm(r.sku), cents: Number(r.market_price_cents) }))
  .filter((r) => Number.isInteger(r.cents) && r.cents > 0)
const marketMatched = market.filter((r) => knownNorm.has(r.sku))
const marketUnmatched = market.filter((r) => !knownNorm.has(r.sku)).map((r) => r.sku)
out += `
-- ------------------------------------------------------------
-- Market reference prices (${marketMatched.length} SKUs) from supabase/pricing/market-reference.csv.
-- Reference only: retail_price_cents is NEVER set from these (pricing is Farshid's call).
-- Matches xpose_sku with or without the marketplace "-X" suffix.
-- ------------------------------------------------------------
UPDATE products p SET
  market_price_cents = v.cents, market_price_source = v.source, market_price_url = v.url, market_price_checked_at = v.checked::date
FROM (VALUES
${marketMatched.map((r) => `  (${s(r.sku)}, ${r.cents}, ${s(r.source_name)}, ${s(r.source_url)}, ${s(r.checked_at)})`).join(',\n')}
) AS v(sku, cents, source, url, checked)
WHERE regexp_replace(upper(p.xpose_sku), '-X$', '') = v.sku;
`
writeFileSync('supabase/seed-catalog.sql', out)

// Suggested retail = market - 10% (exact cents) for import via /admin/products CSV import.
const sugg = marketMatched
  .map((r) => ({ sku: skuBySku.get(r.sku) ?? r.sku, retail: Math.round(r.cents * 0.9) }))
  .sort((a, b) => a.sku.localeCompare(b.sku))
writeFileSync('supabase/pricing/suggested-retail.csv',
  ['sku,retail', ...sugg.map((r) => `${r.sku},${(r.retail / 100).toFixed(2)}`)].join('\n') + '\n')

console.log(`seed-catalog.sql: ${products.length} tarps + ${accessories.length} accessories from catalog-232 (${existing} overlap with seed.sql) + ${added.length} new tarps from the Xpose catalog`)
console.log(`Xpose catalog: ${xpose.size} SKUs; matched ${matchedExisting} existing catalog-232 SKUs; units_per_case set on ${casePackMatched} products`)
console.log(`market prices: ${marketMatched.length} matched${marketUnmatched.length ? `, unmatched: ${marketUnmatched.join(' ')}` : ''}; suggested-retail.csv: ${sugg.length} rows`)
