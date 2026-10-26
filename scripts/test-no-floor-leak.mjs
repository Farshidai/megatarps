#!/usr/bin/env node
// QA blocker: cost must not be derivable from data sent to the browser.
// Needs a running server (DEMO MODE). Usage: BASE_URL=http://localhost:3107 node scripts/test-no-floor-leak.mjs
//
// 1. No browser-facing response — API JSON, HTML, or the RSC (flight) payload of product,
//    listing, cart, quick-order and quote pages — contains min_unit_price_cents,
//    cost_price_cents or market_price*, for a guest or an approved account.
// 2. The server-computed price schedules in /api/pricing-rules give EXACTLY the unit price
//    /api/checkout charges, at every breakpoint and in between (guest + approved account).
import { readFileSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:3107'
const catalog = JSON.parse(readFileSync(new URL('../src/data/demo-catalog.json', import.meta.url), 'utf8'))
const FORBIDDEN = ['min_unit_price_cents', 'cost_price_cents', 'market_price']

let failures = 0
const ok = (cond, msg, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}${cond ? '' : ` ${extra}`}`)
  if (!cond) failures++
}

const priced = catalog.products.filter((p) => p.active && p.in_stock && p.retail_price_cents > 0)
// floor binds (retail == floor) and pallet-priced products are the interesting ones
const pick = [
  ...priced.filter((p) => p.units_per_full_pallet > 0).slice(0, 4),
  ...priced.filter((p) => p.pack_quantity > 1).slice(0, 2),
  ...priced.filter((p) => !p.units_per_full_pallet && !(p.pack_quantity > 1)).slice(0, 3),
  ...priced.filter((p) => ['MT-30X40-10MIL', 'MT-20X30-10MIL', 'MT-16X20-12MIL'].includes(p.xpose_sku)),
]
const skus = [...new Set(pick.map((p) => p.xpose_sku))]

const ACCOUNTS = [['guest', ''], ['approved', 'demo_account=approved']]

async function get(path, cookie, rsc = false) {
  const headers = { ...(cookie ? { Cookie: cookie } : {}), ...(rsc ? { RSC: '1' } : {}) }
  const res = await fetch(`${BASE}${path}`, { headers })
  return { status: res.status, text: await res.text() }
}

// ---- 1. no private fields anywhere -----------------------------------------------------
const pages = [
  '/', '/products', '/products/heavy-duty', '/quick-order', '/cart', '/bulk-quote', '/account',
  ...pick.slice(0, 6).map((p) => `/product/${p.slug}`),
]
for (const [who, cookie] of ACCOUNTS) {
  const api = await get(`/api/pricing-rules?skus=${encodeURIComponent(skus.join(','))}`, cookie)
  ok(api.status === 200, `[${who}] /api/pricing-rules responds`)
  for (const f of FORBIDDEN) ok(!api.text.includes(f), `[${who}] /api/pricing-rules has no "${f}"`)
  const j = JSON.parse(api.text)
  ok(j.products.every((e) => Array.isArray(e.prices)), `[${who}] every catalog entry carries a server price schedule`)
  for (const path of pages) {
    for (const rsc of [false, true]) {
      const r = await get(path, cookie, rsc)
      const bad = FORBIDDEN.filter((f) => r.text.includes(f))
      ok(r.status < 500 && bad.length === 0, `[${who}] ${path} ${rsc ? 'RSC payload' : 'HTML'} has no private fields`, `status ${r.status} found: ${bad.join(',')}`)
    }
  }
}

// ---- 2. schedule == checkout -----------------------------------------------------------
const unitAt = (points, q) => {
  let u = 0
  for (const p of points) if (p.min_quantity <= q) u = p.unit_price_cents
  return u
}
for (const [who, cookie] of ACCOUNTS) {
  const j = JSON.parse((await get(`/api/pricing-rules?skus=${encodeURIComponent(skus.join(','))}`, cookie)).text)
  let compared = 0
  let mismatch = []
  for (const e of j.products) {
    if (e.quote_only || !e.in_stock) continue
    const qs = new Set([1, 2])
    for (const p of e.prices) for (const d of [-1, 0, 1]) if (p.min_quantity + d >= 1) qs.add(p.min_quantity + d)
    for (const q of [...qs].filter((q) => q <= 5000).slice(0, 12)) {
      const res = await fetch(`${BASE}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
        body: JSON.stringify({ items: [{ sku: e.sku, quantity: q }] }),
      })
      const c = await res.json().catch(() => ({}))
      const line = c.lines?.find((l) => l.sku === e.sku)
      if (!line) continue // e.g. freight needs a quote at this weight; the price itself is still checked elsewhere
      compared++
      if (line.unit_price_cents !== unitAt(e.prices, q)) mismatch.push(`${e.sku}×${q}: schedule ${unitAt(e.prices, q)} vs checkout ${line.unit_price_cents}`)
    }
  }
  ok(compared > 10, `[${who}] compared ${compared} schedule prices with checkout`)
  ok(mismatch.length === 0, `[${who}] schedule price === checkout price at every tested quantity`, mismatch.slice(0, 5).join('; '))
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
