// Unit tests for src/lib/pricing.ts (the only pricing engine).
// Run: npm run test:pricing   (node --experimental-strip-types --test scripts/test-pricing.test.mjs)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  unitPriceCents, lineTotalCents, priceTiers, palletTiers, hasPalletPricing, lowestUnitPriceCents,
} from '../src/lib/pricing.ts'

const EACH = [
  { tarp_type: null, thickness_mil: null, min_quantity: 5, max_quantity: 9, discount_from_retail_percent: 8 },
  { tarp_type: null, thickness_mil: null, min_quantity: 10, max_quantity: 24, discount_from_retail_percent: 12 },
  { tarp_type: null, thickness_mil: null, min_quantity: 25, max_quantity: 49, discount_from_retail_percent: 16 },
  { tarp_type: null, thickness_mil: null, min_quantity: 50, max_quantity: 99, discount_from_retail_percent: 20 },
  { tarp_type: null, thickness_mil: null, min_quantity: 100, max_quantity: null, discount_from_retail_percent: 25 },
]
const PALLET = [
  { unit: 'pallet', requires_account: true, tarp_type: null, thickness_mil: null, min_quantity: 1, max_quantity: null, price_multiplier: 0.9 / 0.95, discount_from_retail_percent: null },
  { unit: 'pallet', requires_account: true, tarp_type: null, thickness_mil: null, min_quantity: 2, max_quantity: null, price_multiplier: 0.85 / 0.95, discount_from_retail_percent: null },
  { unit: 'pallet', requires_account: true, tarp_type: null, thickness_mil: null, min_quantity: 3, max_quantity: null, price_multiplier: 0.81 / 0.95, discount_from_retail_percent: null },
]
const RULES = [...EACH, ...PALLET]

// 30' x 40' 10-mil: competitor $91.67/tarp → guest $87.09; cost $62.40 → floor $71.76; 42 per pallet
const tarp = { retail_price_cents: 8709, tarp_type: 'poly', thickness_mil: 10, units_per_full_pallet: 42, min_unit_price_cents: 7176 }
// A product without pallet data keeps the old piece-volume behaviour
const plain = { retail_price_cents: 10000, tarp_type: 'poly', thickness_mil: 12 }

test('legacy each-volume tiers unchanged for products without pallet data', () => {
  assert.equal(unitPriceCents(plain, 1, RULES), 10000)
  assert.equal(unitPriceCents(plain, 5, RULES), 9200)
  assert.equal(unitPriceCents(plain, 100, RULES), 7500)
  assert.equal(unitPriceCents(plain, 100, RULES, { accountApproved: true }), 7500, 'pallet rules ignored without units_per_full_pallet')
  assert.equal(unitPriceCents(plain, 10, RULES, { wholesaleDiscountPercent: 10 }), Math.round(10000 * 0.88 * 0.9))
  assert.equal(priceTiers(plain, RULES).length, 6)
  assert.equal(hasPalletPricing(plain, RULES), false)
})

test('quote-only products price at 0', () => {
  assert.equal(unitPriceCents({ ...tarp, retail_price_cents: 0 }, 42, RULES, { accountApproved: true }), 0)
  assert.deepEqual(palletTiers({ ...tarp, retail_price_cents: 0 }, RULES), [])
})

test('guest pays the guest (retail) price at any quantity — no piece discounts on pallet-priced products', () => {
  assert.equal(unitPriceCents(tarp, 1, RULES), 8709)
  assert.equal(unitPriceCents(tarp, 42, RULES), 8709)
  assert.equal(unitPriceCents(tarp, 500, RULES), 8709)
  assert.equal(lowestUnitPriceCents(tarp, RULES), 8709)
})

test('approved account: 1 / 2 / 3+ full pallets', () => {
  const a = { accountApproved: true }
  assert.equal(unitPriceCents(tarp, 42, RULES, a), 8251) // $82.50 in the plan (±1¢ rounding)
  assert.equal(unitPriceCents(tarp, 84, RULES, a), 7792) // $77.92
  assert.equal(unitPriceCents(tarp, 126, RULES, a), 7426) // $74.25 plan; 74.26 after rounding
  assert.equal(unitPriceCents(tarp, 420, RULES, a), 7426)
  assert.equal(lineTotalCents(tarp, 42, RULES, a), 8251 * 42)
})

test('approved account below one full pallet pays guest price', () => {
  assert.equal(unitPriceCents(tarp, 41, RULES, { accountApproved: true }), 8709)
  assert.equal(unitPriceCents(tarp, 83, RULES, { accountApproved: true }), 8251) // 1 full pallet + 41
})

test('floor: never below min_unit_price_cents (cost × 1.15), even with an extra wholesale %', () => {
  const thin = { ...tarp, retail_price_cents: 3101, min_unit_price_cents: 2691 } // 15x30 10-mil: cost 23.40
  assert.equal(unitPriceCents(thin, 126, RULES, { accountApproved: true }), 2691) // 3101×0.81/0.95 = 2644 → clamped
  assert.equal(unitPriceCents(tarp, 126, RULES, { accountApproved: true, wholesaleDiscountPercent: 20 }), 7176)
})

test('ceiling: never above retail', () => {
  const odd = { ...tarp, min_unit_price_cents: 99999 }
  assert.equal(unitPriceCents(odd, 1, RULES), 8709)
})

test('palletTiers shows what an approved account pays', () => {
  const t = palletTiers(tarp, RULES)
  assert.deepEqual(t.map((x) => [x.label, x.min_quantity, x.unit_price_cents, x.pallet_total_cents]), [
    ['1 pallet', 42, 8251, 8251 * 42],
    ['2+ pallets', 84, 7792, 7792 * 42],
    ['3+ pallets', 126, 7426, 7426 * 42],
  ])
  assert.ok(t.every((x) => x.requires_account))
})

test('pallet rules scoped by mil only hit that mil', () => {
  const scoped = [...EACH, ...PALLET.map((r) => ({ ...r, thickness_mil: 7 }))]
  assert.equal(hasPalletPricing(tarp, scoped), false)
  assert.equal(unitPriceCents(tarp, 100, scoped, { accountApproved: true }), Math.round(8709 * 0.75) < 7176 ? 7176 : Math.round(8709 * 0.75))
})
