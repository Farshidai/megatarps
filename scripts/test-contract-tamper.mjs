#!/usr/bin/env node
// Contract-price tamper test (Team F). Needs a running server in DEMO MODE.
// Usage:  BASE_URL=http://localhost:3106 node scripts/test-contract-tamper.mjs
//
// Proves: only the signed-in APPROVED account gets its own contract prices (checkout and
// /api/pricing-rules); guests, pending / rejected accounts and forged cookies don't; and
// contract prices sent by the browser are ignored. Demo samples live in
// src/lib/contract-prices-demo.ts (approved demo account = demo_account=approved).
import { readFileSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:3106'
const catalog = JSON.parse(readFileSync(new URL('../src/data/demo-catalog.json', import.meta.url), 'utf8'))
const bySku = (s) => catalog.products.find((p) => p.xpose_sku === s)

// demo samples (keep in sync with contract-prices-demo.ts)
const C1 = { sku: 'MT-30X40-10MIL', cents: 6990, min: 1 }
const C2 = { sku: 'MT-20X30-10MIL', cents: 3450, min: 5 }
const OTHER = 'MT-16X20-12MIL' // no contract price
const WHOLESALE_PCT = 0 // approved demo account (extra % no longer stacks on pallet pricing; demo uses 0%)

let failures = 0
const ok = (cond, msg, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}${cond ? '' : ` ${extra}`}`)
  if (!cond) failures++
}

async function checkout(items, cookie = '', extra = {}) {
  const res = await fetch(`${BASE}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify({ items, ...extra }),
  })
  let json = {}
  try { json = await res.json() } catch {}
  return { status: res.status, json }
}
async function rules(cookie = '', skus = C1.sku) {
  const res = await fetch(`${BASE}/api/pricing-rules?skus=${encodeURIComponent(skus)}`, { headers: cookie ? { Cookie: cookie } : {} })
  return { status: res.status, text: await res.text() }
}
const unitOf = (r, sku) => r.json?.stripe_line_items?.find((l) => l.sku === sku)?.unit_amount
const lineOf = (r, sku) => r.json?.lines?.find((l) => l.sku === sku)

// independent "normal" price for small quantities (below one pallet: no piece tiers on pallet-priced
// products; account % then the cost floor, never above retail)
function normal(p, pct) {
  let c = Math.round(p.retail_price_cents * (1 - pct / 100))
  if (p.min_unit_price_cents > 0) c = Math.max(c, p.min_unit_price_cents)
  return Math.min(c, p.retail_price_cents)
}
const p1 = bySku(C1.sku), p2 = bySku(C2.sku), po = bySku(OTHER)
ok(!!p1 && !!p2 && !!po, 'demo catalog has the sample products')
ok(C1.cents < normal(p1, WHOLESALE_PCT) && C2.cents < normal(p2, WHOLESALE_PCT), 'sample contract prices are below the normal account price (test is meaningful)')

const APPROVED = 'demo_account=approved'

// ---- the approved account gets its own contract prices ----
let r = await checkout([{ sku: C1.sku, quantity: 1 }], APPROVED)
ok(r.status === 200 && unitOf(r, C1.sku) === C1.cents, `approved: ${C1.sku} ×1 charged the contract price ${C1.cents}`, JSON.stringify(r.json).slice(0, 200))
ok(lineOf(r, C1.sku)?.contract_price === true, 'approved: line flagged contract_price')
ok(p1.min_unit_price_cents > 0 && C1.cents < p1.min_unit_price_cents, 'contract price is below the cost floor (floor ignored on purpose)')

r = await checkout([{ sku: C2.sku, quantity: C2.min - 1 }], APPROVED)
ok(unitOf(r, C2.sku) === normal(p2, WHOLESALE_PCT), `approved: ${C2.sku} ×${C2.min - 1} (below contract min qty) pays the normal price`, JSON.stringify(r.json).slice(0, 200))
r = await checkout([{ sku: C2.sku, quantity: C2.min }], APPROVED)
ok(unitOf(r, C2.sku) === C2.cents, `approved: ${C2.sku} ×${C2.min} pays the ${C2.min}+ contract price`, JSON.stringify(r.json).slice(0, 200))

r = await checkout([{ sku: OTHER, quantity: 1 }], APPROVED)
ok(unitOf(r, OTHER) === normal(po, WHOLESALE_PCT) && lineOf(r, OTHER)?.contract_price === false, 'approved: product without a contract keeps the normal price', JSON.stringify(r.json).slice(0, 200))

// ---- the browser can't send its own contract prices ----
const forged = { contractPrices: [{ sku: OTHER, product_id: po.id, unit_price_cents: 1, min_quantity: 1, valid_until: null }], contract_prices: [{ sku: OTHER, unit_price_cents: 1 }] }
r = await checkout([{ sku: OTHER, quantity: 1, unit_price_cents: 1, contract_price: 1 }], APPROVED, forged)
ok(unitOf(r, OTHER) === normal(po, WHOLESALE_PCT), 'approved: forged contractPrices / line prices in the body are ignored', JSON.stringify(r.json).slice(0, 200))
r = await checkout([{ sku: C1.sku, quantity: 1 }], '', { contractPrices: [{ sku: C1.sku, product_id: p1.id, unit_price_cents: C1.cents, min_quantity: 1, valid_until: null }], accountApproved: true })
ok(unitOf(r, C1.sku) === p1.retail_price_cents, 'guest: forged contractPrices + accountApproved in the body are ignored', JSON.stringify(r.json).slice(0, 200))

// ---- guests and other accounts never get someone's contract price ----
for (const [label, cookie] of [['guest', ''], ['pending account', 'demo_account=pending'], ['rejected account', 'demo_account=rejected'],
  ['forged cookie (account id)', 'demo_account=demo-0000-0000-0000-000000000002'], ['forged cookie (junk)', 'demo_account=approved%00x']]) {
  r = await checkout([{ sku: C1.sku, quantity: 1 }, { sku: C2.sku, quantity: C2.min }], cookie)
  ok(r.status === 200 && unitOf(r, C1.sku) === p1.retail_price_cents && unitOf(r, C2.sku) === p2.retail_price_cents,
    `${label}: checkout charges guest prices, not the contract`, JSON.stringify(r.json).slice(0, 200))
  ok((r.json.lines ?? []).every((l) => l.contract_price === false), `${label}: no line flagged contract_price`)
  const pr = await rules(cookie, `${C1.sku},${C2.sku}`)
  const j = JSON.parse(pr.text)
  ok(pr.status === 200 && Array.isArray(j.contractPrices) && j.contractPrices.length === 0, `${label}: /api/pricing-rules returns no contract prices`)
  ok(!pr.text.includes(String(C1.cents)) && !pr.text.includes(String(C2.cents)), `${label}: response never contains the contract amounts`)
}

// ---- /api/pricing-rules for the approved account: own rows, storefront fields only ----
const pr = await rules(APPROVED)
const j = JSON.parse(pr.text)
ok(j.accountApproved === true && j.contractPrices.length === 2, 'approved: /api/pricing-rules returns its 2 contract prices')
ok(j.contractPrices.every((c) => Object.keys(c).sort().join(',') === 'min_quantity,product_id,sku,unit_price_cents,valid_until'),
  'approved: contract rows expose only storefront fields (no note / created_by / contractor_id)', JSON.stringify(j.contractPrices))
ok(pr.text.indexOf('Matched spring') === -1 && pr.text.indexOf('demo-admin') === -1, 'approved: internal notes never reach the browser')

// ---- /account: list shown only for the approved account ----
const acc = async (cookie) => (await fetch(`${BASE}/account`, { headers: cookie ? { Cookie: cookie } : {} })).text()
ok((await acc(APPROVED)).includes('Your contract prices'), '/account shows "Your contract prices" for the approved account')
ok(!(await acc('demo_account=pending')).includes('Your contract prices'), '/account hides contract prices for a pending account')

console.log(failures ? `\n${failures} FAILURE(S)` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
