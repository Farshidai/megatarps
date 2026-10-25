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

// Independent re-implementation of the expected price (global volume tiers, guest buyer).
function expectedUnit(product, qty) {
  let d = 0
  for (const r of catalog.pricing_rules) {
    if (r.active === false) continue
    if (r.tarp_type && r.tarp_type !== product.tarp_type) continue
    if (r.thickness_mil && Number(r.thickness_mil) !== product.thickness_mil) continue
    if (qty >= r.min_quantity && (r.max_quantity == null || qty <= r.max_quantity)) d = Number(r.discount_from_retail_percent)
  }
  return Math.round(product.retail_price_cents * (1 - d / 100))
}

const priced = catalog.products.filter((p) => p.active && p.in_stock && p.retail_price_cents > 0)
const cheap = [...priced].sort((a, b) => a.retail_price_cents - b.retail_price_cents)[0]
const target = [...priced].sort((a, b) => b.retail_price_cents - a.retail_price_cents)[0]
const quoteOnly = catalog.products.find((p) => p.active && !(p.retail_price_cents > 0))
const QTY = 12
const expected = expectedUnit(target, QTY)
console.log(`Target ${target.xpose_sku}: retail ${target.retail_price_cents}¢, expected unit @${QTY} = ${expected}¢\n`)

// 1. Baseline
const base = await checkout({ items: [{ sku: target.xpose_sku, quantity: QTY }] })
ok(base.status === 200, `baseline checkout succeeds (status ${base.status})`)
const baseLine = base.json.stripe_line_items?.[0]
ok(baseLine?.unit_amount === expected, `baseline Stripe unit_amount = server tier price (${baseLine?.unit_amount} === ${expected})`)
ok(base.json.subtotal_cents === expected * QTY, `baseline subtotal = ${expected * QTY}`)

// 2. Every price-ish field the attacker could add, per line and top level
const tampered = await checkout({
  items: [{
    sku: target.xpose_sku,
    product_id: cheap.id, // try to price as another product
    quantity: QTY,
    unit_price_cents: 1, price: 1, unit_amount: 1, retail_price_cents: 1, price_cents: 1,
    line_total_cents: 1, discount_percent: 99, discount_from_retail_percent: 99,
    wholesaleDiscountPercent: 99, quote_only: false, name: 'FREE TARP',
  }],
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
ok(tampered.json.stripe_line_items?.length === 1, 'tampered: injected line_items ignored')

// 3. Splitting a line can't game tiers (merged per SKU before pricing)
const split = await checkout({ items: [{ sku: target.xpose_sku, quantity: 6 }, { sku: target.xpose_sku, quantity: 6 }] })
ok(split.json.stripe_line_items?.length === 1 && split.json.stripe_line_items[0].quantity === 12 && split.json.stripe_line_items[0].unit_amount === expected,
  'duplicate SKU lines are merged and priced at the merged tier')

// 4. Rejections
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
