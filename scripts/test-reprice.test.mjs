// Unit tests for src/lib/reprice.ts ("Reprice from market" on /admin/products).
// Run: node --experimental-strip-types --no-warnings --test scripts/test-reprice.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { repriceRow, repriceRows, marketSkuFor, pickPalletObservation, floorCents, observationsFor, TTW_SOURCE } from '../src/lib/reprice.ts'

const obs = (sku, kind, units, price, checked_at = '2026-10-25', source = TTW_SOURCE) => ({ sku, kind, units, price_cents: price, checked_at, source })

const OBS = [
  obs('STH-2030', 'single', 1, 4999),
  obs('STH-2030', 'half_pallet', 48, 233999),
  obs('STH-2030', 'full_pallet', 96, 386999), // 4031/tarp
  obs('BTH-2020', 'half_pallet', 72, 199999), // only a half pallet → 2777/tarp
  obs('STH-3040', 'full_pallet', 42, 252000), // 6000/tarp
  obs('STH-3040', 'full_pallet', 42, 270000, '2026-09-01'), // older, ignored
  obs('MTGB-1530', 'full_pallet', 144, 500000, '2026-10-25', 'Amazon (Xpose Safety)'),
]

test('SKU mapping: Xpose SKUs map to themselves, Shopify SKUs by color / mil / size', () => {
  assert.equal(marketSkuFor({ xpose_sku: 'STH-2030', retail_price_cents: 1 }), 'STH-2030')
  assert.equal(marketSkuFor({ xpose_sku: 'sth-2030-x', retail_price_cents: 1 }), 'STH-2030')
  assert.equal(marketSkuFor({ xpose_sku: 'MT-20X30-10MIL', tarp_type: 'poly', thickness_mil: 10, width_ft: 20, length_ft: 30, color: 'Blue', retail_price_cents: 1 }), 'STH-2030')
  assert.equal(marketSkuFor({ xpose_sku: 'MT-30X40-10MIL-SB', tarp_type: 'poly', thickness_mil: 10, width_ft: 30, length_ft: 40, color: 'Silver', retail_price_cents: 1 }), 'STH-3040')
  assert.equal(marketSkuFor({ xpose_sku: '20X20-7MIL-HP72', tarp_type: 'poly', thickness_mil: 7, width_ft: 20, length_ft: 20, color: 'Blue', pack_quantity: 72, retail_price_cents: 1 }), 'BTH-2020')
  assert.equal(marketSkuFor({ xpose_sku: 'X-GB', tarp_type: 'poly', thickness_mil: 10, width_ft: 30, length_ft: 15, color: 'Green/Black', retail_price_cents: 1 }), 'MTGB-1530')
  assert.equal(marketSkuFor({ xpose_sku: 'MT-20X30-12MIL', tarp_type: 'poly', thickness_mil: 12, width_ft: 20, length_ft: 30, color: 'Blue', retail_price_cents: 1 }), null)
  assert.equal(marketSkuFor({ xpose_sku: 'CVT20-1012', tarp_type: 'vinyl', thickness_mil: 20, width_ft: 10, length_ft: 12, retail_price_cents: 1 }), null)
})

test('picks the latest full pallet, falls back to half pallet, filters by source', () => {
  assert.equal(pickPalletObservation('STH-2030', OBS).units, 96)
  assert.equal(pickPalletObservation('STH-3040', OBS).price_cents, 252000)
  assert.equal(pickPalletObservation('BTH-2020', OBS).kind, 'half_pallet')
  assert.equal(pickPalletObservation('MTGB-1530', OBS, TTW_SOURCE), null)
  assert.equal(pickPalletObservation('MTGB-1530', OBS, null).units, 144)
  assert.equal(pickPalletObservation('NOPE-1', OBS), null)
})

test('new retail = per-tarp pallet price × (1 − X%), when above the floor', () => {
  const p = { xpose_sku: 'STH-2030', retail_price_cents: 5000, cost_price_cents: 3120 } // floor 3588
  const r = repriceRow(p, OBS, 5)
  assert.equal(r.market_per_tarp_cents, 4031)
  assert.equal(r.new_retail_cents, 3830) // round(386999 / 96 × 0.95) = round(3829.7)
  assert.equal(r.floor_cents, 3588)
  assert.equal(r.floor_wins, false)
  assert.equal(r.status, 'ok')
  assert.equal(r.margin_percent, Math.round(((3830 - 3120) / 3830) * 1000) / 10)
  assert.equal(repriceRow(p, OBS, 0).new_retail_cents, 4031)
  assert.equal(repriceRow(p, OBS, 10).new_retail_cents, 3628) // round(3628.1)
})

test('the floor (cost × 1.15, rounded up) wins when the market is too low, and is flagged', () => {
  const p = { xpose_sku: 'STH-3040', retail_price_cents: 9000, cost_price_cents: 6240 } // floor 7176 > 5700
  const r = repriceRow(p, OBS, 5)
  assert.equal(r.new_retail_cents, 7176)
  assert.equal(r.floor_wins, true)
  assert.equal(r.status, 'floor')
  assert.equal(floorCents({ cost_price_cents: 1001 }), 1152) // ceil(1151.15)
  assert.equal(floorCents({ cost_price_cents: 1000, min_unit_price_cents: 2000 }), 2000) // admin floor higher
})

test('pallet SKUs get per-tarp price × pack_quantity; floor is per pack', () => {
  const p = { xpose_sku: '20X30-10MIL-HP48', tarp_type: 'poly', thickness_mil: 10, width_ft: 20, length_ft: 30, color: 'Silver', pack_quantity: 48, retail_price_cents: 1, cost_price_cents: 149760 }
  const r = repriceRow(p, OBS, 5)
  assert.equal(r.pack, 48)
  assert.equal(r.market_sku, 'STH-2030')
  assert.equal(r.new_retail_cents, 3830 * 48)
  const half = { xpose_sku: '20X20-7MIL-HP72', tarp_type: 'poly', thickness_mil: 7, width_ft: 20, length_ft: 20, color: 'Blue', pack_quantity: 72, retail_price_cents: 1, cost_price_cents: 128160 }
  assert.equal(repriceRow(half, OBS, 5).new_retail_cents, Math.round((199999 / 72) * 0.95) * 72)
})

test('no pallet observation or no cost → row unchanged', () => {
  const a = repriceRow({ xpose_sku: 'STH-9999', retail_price_cents: 1234, cost_price_cents: 100 }, OBS, 5)
  assert.equal(a.status, 'no-market')
  assert.equal(a.new_retail_cents, 1234)
  const b = repriceRow({ xpose_sku: 'STH-2030', retail_price_cents: 1234, cost_price_cents: 0, min_unit_price_cents: 1234 }, OBS, 5)
  assert.equal(b.status, 'no-cost')
  assert.equal(b.new_retail_cents, 1234)
  // only a single-unit observation is not enough
  const c = repriceRow({ xpose_sku: 'X', retail_price_cents: 10, cost_price_cents: 1 }, [obs('X', 'single', 1, 999)], 5)
  assert.equal(c.status, 'no-market')
})

test('rejects a bad percent', () => {
  assert.throws(() => repriceRow({ xpose_sku: 'STH-2030', retail_price_cents: 1 }, OBS, 100))
  assert.throws(() => repriceRow({ xpose_sku: 'STH-2030', retail_price_cents: 1 }, OBS, -1))
})

test('observationsFor lists own + mapped SKU rows, newest first, pallets first', () => {
  const rows = observationsFor({ xpose_sku: 'MT-20X30-10MIL', tarp_type: 'poly', thickness_mil: 10, width_ft: 20, length_ft: 30, color: 'Blue', retail_price_cents: 1 }, OBS)
  assert.deepEqual(rows.map((r) => r.kind), ['full_pallet', 'half_pallet', 'single'])
})

test('with the real seed data, reprice at −5% reproduces seed-prices-2026-10-25.sql', () => {
  const demo = JSON.parse(readFileSync(new URL('../src/data/demo-catalog.json', import.meta.url), 'utf8'))
  const seeded = [...readFileSync(new URL('../supabase/seed-prices-2026-10-25.sql', import.meta.url), 'utf8').matchAll(/xpose_sku = '([^']+)'/g)].map((m) => m[1])
  assert.ok(seeded.length > 20)
  const products = demo.products.filter((p) => seeded.includes(p.xpose_sku))
  assert.equal(products.length, seeded.length)
  const rows = repriceRows(products, demo.market_observations, 5, TTW_SOURCE)
  for (const r of rows) {
    assert.equal(r.new_retail_cents, r.old_retail_cents, `${r.sku}: ${r.old_retail_cents} → ${r.new_retail_cents} (${r.market_sku})`)
    assert.equal(r.status, 'unchanged')
  }
})
