#!/usr/bin/env node
// Price-tampering test for POST /api/checkout.
// Proves that the browser cannot change what Stripe charges: every price comes from the
// server (product rows + pricing rules + account), and bad input is rejected.
//
// Usage:  BASE_URL=http://localhost:3102 node scripts/test-checkout-tamper.mjs
// Needs a running server. In demo mode the route returns `stripe_line_items`, exactly the
// line items it would send to Stripe, so we can assert on them without real Stripe keys.
import { readFileSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:3102'
const catalog = JSON.parse(readFileSync(new URL('../src/data/demo-catalog.json', import.meta.url), 'utf8'))

let failures = 0
const ok = (cond, msg) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`)
  if (!cond) failures++
}

async function checkout(body, raw = false) {
  const res = await fetch(`${BASE}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw ? body : JSON.stringify(body),
  })
  let json = {}
  try { json = await res.json() } catch {}
  return { status: res.status, json }
}

// Independent re-implementation of the expected GUEST price:
// - products with pallet pricing (units_per_full_pallet + pallet rules) get no piece-tier discount for guests
// - otherwise global piece tiers apply
// - result is clamped to [min_unit_price_cents, retail]
const hasPalletRules = catalog.pricing_rules.some((r) => r.unit === 'pallet' && r.active !== false)
function expectedUnit(product, qty) {
  let d = 0
  const palletPriced = (hasPalletRules && product.units_per_full_pallet > 0) || product.pack_quantity > 1 // pack / pallet SKUs: no piece tiers
  if (!palletPriced) for (const r of catalog.pricing_rules) {
    if (r.active === false || (r.unit && r.unit !== 'each')) continue
    if (r.tarp_type && r.tarp_type !== product.tarp_type) continue
    if (r.thickness_mil && Number(r.thickness_mil) !== product.thickness_mil) continue
    if (qty >= r.min_quantity && (r.max_quantity == null || qty <= r.max_quantity)) d = Number(r.discount_from_retail_percent)
  }
  const raw = Math.round(product.retail_price_cents * (1 - d / 100))
  const floor = product.min_unit_price_cents ?? 0
  return Math.min(product.retail_price_cents, Math.max(raw, floor))
}

// Independent ship-weight + freight expectation (Xpose spec oz/sq yd by mil, placeholder parcel brackets).
const SPEC = { 5: 3.6, 7: 3.65, 10: 4.25, 12: 6, 16: 8, 20: 11 }
const weightLb = (p) => (Number(p.shipping_weight_lb) > 0 ? Number(p.shipping_weight_lb) /* per sellable unit, like productWeightLb */ : SPEC[p.thickness_mil] && p.width_ft ? (p.width_ft * p.length_ft) / 9 * SPEC[p.thickness_mil] / 16 * (p.pack_quantity || 1) : null)
function expectedFreight(totalLb) {
  const lb = Math.ceil(Math.round(totalLb * 100) / 100)
  if (totalLb <= 20) return 1200 + 40 * lb
  if (totalLb <= 70) return 1500 + 45 * lb
  if (totalLb <= 150) return 2500 + 50 * lb
  return null
}

const priced = catalog.products.filter((p) => p.active && p.in_stock && p.retail_price_cents > 0)
// single-unit products priced only by the piece tiers (no pallet pricing, not a pallet SKU)
const simple = priced.filter((p) => !(p.pack_quantity > 1))
const QTY = 5
// most expensive tarp whose QTY units still ship parcel (≤ 150 lb)
const target = [...simple].filter((p) => weightLb(p) && weightLb(p) * QTY <= 150).sort((a, b) => b.retail_price_cents - a.retail_price_cents)[0]
const cheap = [...priced].sort((a, b) => a.retail_price_cents - b.retail_price_cents)[0]
const heavy = [...priced].filter((p) => weightLb(p)).sort((a, b) => weightLb(b) - weightLb(a))[0]
const noWeight = priced.find((p) => !weightLb(p))
const quoteOnly = catalog.products.find((p) => p.active && !(p.retail_price_cents > 0))
const expected = expectedUnit(target, QTY)
const expWeight = weightLb(target) * QTY
const expFreight = expectedFreight(expWeight)
console.log(`Target ${target.xpose_sku}: retail ${target.retail_price_cents}¢, expected unit @${QTY} = ${expected}¢, ${expWeight.toFixed(2)} lb → freight ${expFreight}¢\n`)

// 1. Baseline
const base = await checkout({ items: [{ sku: target.xpose_sku, quantity: QTY }] })
ok(base.status === 200, `baseline checkout succeeds (status ${base.status})`)
const baseLine = base.json.stripe_line_items?.[0]
ok(baseLine?.unit_amount === expected, `baseline Stripe unit_amount = server tier price (${baseLine?.unit_amount} === ${expected})`)
ok(base.json.subtotal_cents === expected * QTY, `baseline subtotal = ${expected * QTY}`)
const baseFreight = base.json.stripe_line_items?.find((l) => l.sku === 'FREIGHT')
ok(baseFreight?.unit_amount === expFreight && base.json.freight?.method === 'parcel', `baseline has server freight line item (${baseFreight?.unit_amount} === ${expFreight}, parcel)`)
ok(base.json.total_cents === expected * QTY + expFreight, `baseline total = items + freight (${base.json.total_cents})`)

// 2. Every price-ish field the attacker could add, per line and top level
const tampered = await checkout({
  items: [{
    sku: target.xpose_sku,
    product_id: cheap.id, // try to price as another product
    quantity: QTY,
    unit_price_cents: 1, price: 1, unit_amount: 1, retail_price_cents: 1, price_cents: 1,
    line_total_cents: 1, discount_percent: 99, discount_from_retail_percent: 99,
    wholesaleDiscountPercent: 99, quote_only: false, name: 'FREE TARP',
    shipping_weight_lb: 0.01, unit_weight_lb: 0.01, weight: 0,
  }],
  freight_cents: 0, freight: { method: 'parcel', freightCents: 0 }, skip_freight: true, free_freight: true, shipping_method: 'pickup',
  subtotal_cents: 1, total_cents: 1, shipping_cents: 0,
  wholesaleDiscountPercent: 99, opts: { wholesaleDiscountPercent: 99 },
  rules: [{ tarp_type: null, thickness_mil: null, min_quantity: 1, max_quantity: null, discount_from_retail_percent: 100 }],
  line_items: [{ price_data: { unit_amount: 1 }, quantity: QTY }],
})
ok(tampered.status === 200, `tampered request is processed (status ${tampered.status})`)
const tl = tampered.json.stripe_line_items?.[0]
ok(tl?.unit_amount === expected, `tampered: Stripe unit_amount unchanged (${tl?.unit_amount} === ${expected})`)
ok(tl?.sku === target.xpose_sku, `tampered: priced by SKU, product_id spoof ignored (${tl?.sku})`)
ok(tampered.json.subtotal_cents === base.json.subtotal_cents, `tampered: subtotal unchanged (${tampered.json.subtotal_cents})`)
ok(tampered.json.total_cents === base.json.total_cents, `tampered: total unchanged (${tampered.json.total_cents})`)
ok(tampered.json.stripe_line_items?.length === 2, 'tampered: injected line_items ignored (1 product + 1 freight)')
const tf = tampered.json.stripe_line_items?.find((l) => l.sku === 'FREIGHT')
ok(tf?.unit_amount === expFreight, `tampered: freight can't be zeroed or skipped (${tf?.unit_amount} === ${expFreight})`)
ok(tampered.json.shipping_cents === expFreight, `tampered: shipping_cents from server (${tampered.json.shipping_cents})`)

// 3. Splitting a line can't game tiers (merged per SKU before pricing)
const split = await checkout({ items: [{ sku: target.xpose_sku, quantity: 3 }, { sku: target.xpose_sku, quantity: 2 }] })
ok(split.json.stripe_line_items?.length === 2 && split.json.stripe_line_items[0].quantity === QTY && split.json.stripe_line_items[0].unit_amount === expected,
  'duplicate SKU lines are merged and priced at the merged tier')

// 4. Freight that can't be priced online → rejected, no Stripe URL
const heavyQty = Math.ceil(151 / weightLb(heavy))
const h = await checkout({ items: [{ sku: heavy.xpose_sku, quantity: heavyQty }], freight_cents: 100, shipping_method: 'parcel' })
ok(h.status === 409 && h.json.details?.code === 'freight_quote_required' && !h.json.url, `${heavyQty}× ${heavy.xpose_sku} (${(weightLb(heavy) * heavyQty).toFixed(0)} lb, over parcel limit) → freight quote required (${h.status})`)
if (noWeight) {
  const u = await checkout({ items: [{ sku: target.xpose_sku, quantity: 1 }, { sku: noWeight.xpose_sku, quantity: 1, shipping_weight_lb: 1 }] })
  ok(u.status === 409 && u.json.details?.unknown_weight?.includes(noWeight.xpose_sku) && !u.json.url, `unknown ship weight (${noWeight.xpose_sku}) even with a spoofed weight → freight quote required (${u.status})`)
}

// 5. Rejections
const reject = async (label, body, raw) => {
  const r = await checkout(body, raw)
  ok(r.status >= 400 && r.status < 500 && !r.json.url, `${label} → rejected (${r.status}: ${r.json.error ?? ''})`)
}
await reject('quote-only SKU', { items: [{ sku: quoteOnly.xpose_sku, quantity: 1 }] })
await reject('quote-only SKU flagged quote_only:false', { items: [{ sku: quoteOnly.xpose_sku, quantity: 1, quote_only: false, unit_price_cents: 100 }] })
await reject('priced + quote-only mixed', { items: [{ sku: target.xpose_sku, quantity: 1 }, { sku: quoteOnly.xpose_sku, quantity: 1 }] })
await reject('unknown SKU', { items: [{ sku: 'NOT-A-REAL-SKU', quantity: 1 }] })
await reject('SQL-ish SKU', { items: [{ sku: "x' OR '1'='1", quantity: 1 }] })
await reject('quantity 0', { items: [{ sku: target.xpose_sku, quantity: 0 }] })
await reject('negative quantity', { items: [{ sku: target.xpose_sku, quantity: -5 }] })
await reject('fractional quantity', { items: [{ sku: target.xpose_sku, quantity: 2.5 }] })
await reject('string quantity', { items: [{ sku: target.xpose_sku, quantity: '12' }] })
await reject('huge quantity', { items: [{ sku: target.xpose_sku, quantity: 1e9 }] })
await reject('merged quantity over the cap', { items: [{ sku: target.xpose_sku, quantity: 6000 }, { sku: target.xpose_sku, quantity: 6000 }] })
await reject('missing quantity', { items: [{ sku: target.xpose_sku }] })
await reject('empty cart', { items: [] })
await reject('no items field', { sku: target.xpose_sku, quantity: 1 })
await reject('too many lines', { items: Array.from({ length: 101 }, (_, i) => ({ sku: `X${i}`, quantity: 1 })) })
await reject('malformed JSON', '{"items": [', true)

console.log(`\n${failures ? `${failures} check(s) FAILED` : 'All checks passed: client input cannot change the price.'}`)
process.exit(failures ? 1 : 0)
