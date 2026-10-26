// Unit tests for client contract prices in src/lib/pricing.ts.
// Run: npm run test:pricing   (runs this file together with test-pricing.test.mjs)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  unitPriceCents, contractUnitPriceCents, isContractPriced, contractPricesFor, priceTiers, palletTiers, lineTotalCents,
} from '../src/lib/pricing.ts'

const EACH = [
  { tarp_type: null, thickness_mil: null, min_quantity: 5, max_quantity: 9, discount_from_retail_percent: 8 },
  { tarp_type: null, thickness_mil: null, min_quantity: 10, max_quantity: 24, discount_from_retail_percent: 12 },
  { tarp_type: null, thickness_mil: null, min_quantity: 100, max_quantity: null, discount_from_retail_percent: 25 },
]
const PALLET = [
  { unit: 'pallet', requires_account: true, tarp_type: null, thickness_mil: null, min_quantity: 1, max_quantity: null, price_multiplier: 0.9 / 0.95, discount_from_retail_percent: null },
  { unit: 'pallet', requires_account: true, tarp_type: null, thickness_mil: null, min_quantity: 2, max_quantity: null, price_multiplier: 0.85 / 0.95, discount_from_retail_percent: null },
]
const RULES = [...EACH, ...PALLET]
const TODAY = '2026-10-25'

// floor $71.76, 42/pallet
const tarp = { id: 'p-tarp', xpose_sku: 'MT-30X40-10MIL', retail_price_cents: 8709, tarp_type: 'poly', thickness_mil: 10, units_per_full_pallet: 42, min_unit_price_cents: 7176 }
const plain = { id: 'p-plain', sku: 'MT-12X16-10MIL', retail_price_cents: 10000, tarp_type: 'poly', thickness_mil: 10 }
const cp = (o) => ({ product_id: null, sku: '', unit_price_cents: 1, min_quantity: 1, valid_until: null, ...o })
const approved = (contractPrices, extra = {}) => ({ accountApproved: true, contractPrices, today: TODAY, ...extra })

test('contract price below tier price wins for approved accounts', () => {
  const c = [cp({ product_id: 'p-plain', sku: 'MT-12X16-10MIL', unit_price_cents: 8000 })]
  assert.equal(unitPriceCents(plain, 1, RULES, approved(c)), 8000)
  assert.equal(isContractPriced(plain, 1, RULES, approved(c)), true)
  assert.equal(lineTotalCents(plain, 3, RULES, approved(c)), 24000)
})

test('the LOWER of contract and tier price applies', () => {
  const c = [cp({ product_id: 'p-plain', unit_price_cents: 8000 })]
  // 100+ tier = $75.00 < $80.00 contract → tier wins
  assert.equal(unitPriceCents(plain, 100, RULES, approved(c)), 7500)
  assert.equal(isContractPriced(plain, 100, RULES, approved(c)), false)
  // wholesale % is part of the normal price: 10 units, 12% tier + 10% account = $79.20 < $80
  assert.equal(unitPriceCents(plain, 10, RULES, approved(c, { wholesaleDiscountPercent: 10 })), 7920)
})

test('best matching min_quantity ≤ qty is used', () => {
  const c = [
    cp({ product_id: 'p-plain', unit_price_cents: 9000, min_quantity: 1 }),
    cp({ product_id: 'p-plain', unit_price_cents: 8000, min_quantity: 10 }),
    cp({ product_id: 'p-plain', unit_price_cents: 6000, min_quantity: 50 }),
  ]
  assert.equal(contractUnitPriceCents(plain, 1, c, TODAY), 9000)
  assert.equal(contractUnitPriceCents(plain, 9, c, TODAY), 9000)
  assert.equal(contractUnitPriceCents(plain, 10, c, TODAY), 8000)
  assert.equal(contractUnitPriceCents(plain, 49, c, TODAY), 8000)
  assert.equal(contractUnitPriceCents(plain, 50, c, TODAY), 6000)
  assert.equal(unitPriceCents(plain, 5, RULES, approved(c)), 9000) // tier $92 vs contract $90
  // only a min_quantity 10 row → no contract below 10
  const only10 = [cp({ product_id: 'p-plain', unit_price_cents: 8000, min_quantity: 10 })]
  assert.equal(contractUnitPriceCents(plain, 9, only10, TODAY), null)
  assert.equal(unitPriceCents(plain, 9, RULES, approved(only10)), 9200)
})

test('contract price ignores the cost floor (min_unit_price_cents)', () => {
  const c = [cp({ sku: 'mt-30x40-10mil', unit_price_cents: 6900 })] // matched by SKU, case-insensitive
  assert.equal(unitPriceCents(tarp, 1, RULES, { accountApproved: true }), 8709)
  // the normal (pallet-tier) price is clamped to the floor...
  assert.equal(unitPriceCents({ ...tarp, retail_price_cents: 7300 }, 126, RULES, { accountApproved: true }), 7176)
  assert.equal(unitPriceCents(tarp, 1, RULES, approved(c)), 6900)
  assert.equal(unitPriceCents(tarp, 84, RULES, approved(c)), 6900, 'below the $71.76 floor on purpose')
})

test('guests and non-approved accounts never get contract prices', () => {
  const c = [cp({ product_id: 'p-plain', unit_price_cents: 5000 })]
  assert.equal(unitPriceCents(plain, 1, RULES, { contractPrices: c, today: TODAY }), 10000)
  assert.equal(unitPriceCents(plain, 1, RULES, { accountApproved: false, contractPrices: c, today: TODAY }), 10000)
  assert.equal(isContractPriced(plain, 1, RULES, { contractPrices: c, today: TODAY }), false)
})

test('expired contract prices are ignored; valid through the end of valid_until', () => {
  const expired = [cp({ product_id: 'p-plain', unit_price_cents: 5000, valid_until: '2026-10-24' })]
  const lastDay = [cp({ product_id: 'p-plain', unit_price_cents: 5000, valid_until: '2026-10-25' })]
  assert.equal(unitPriceCents(plain, 1, RULES, approved(expired)), 10000)
  assert.equal(unitPriceCents(plain, 1, RULES, approved(lastDay)), 5000)
  assert.equal(contractPricesFor(plain, expired, TODAY).length, 0)
})

test('zero / negative / non-integer contract prices never apply', () => {
  for (const bad of [0, -100, 12.5, NaN]) {
    assert.equal(unitPriceCents(plain, 1, RULES, approved([cp({ product_id: 'p-plain', unit_price_cents: bad })])), 10000, String(bad))
  }
})

test("another product's contract price does not leak", () => {
  const c = [cp({ product_id: 'p-tarp', sku: 'MT-30X40-10MIL', unit_price_cents: 100 })]
  assert.equal(unitPriceCents(plain, 1, RULES, approved(c)), 10000)
})

test('quote-only products stay quote-only even with a contract price', () => {
  const qo = { ...plain, retail_price_cents: 0 }
  const c = [cp({ product_id: 'p-plain', unit_price_cents: 5000 })]
  assert.equal(unitPriceCents(qo, 1, RULES, approved(c)), 0)
  assert.equal(contractUnitPriceCents(qo, 1, c, TODAY), null)
})

test('tier tables keep showing normal prices (contract is shown separately)', () => {
  const c = [cp({ product_id: 'p-plain', unit_price_cents: 5000 }), cp({ product_id: 'p-tarp', unit_price_cents: 5000 })]
  assert.deepEqual(priceTiers(plain, RULES, approved(c)), priceTiers(plain, RULES))
  assert.deepEqual(palletTiers(tarp, RULES, approved(c)), palletTiers(tarp, RULES))
})
