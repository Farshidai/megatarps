#!/usr/bin/env node
// Unit tests for src/lib/freight.ts (ship weights + freight brackets). No server needed.
// Usage: node scripts/test-freight.mjs
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const src = readFileSync(new URL('../src/lib/freight.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const F = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))
const catalog = JSON.parse(readFileSync(new URL('../src/data/demo-catalog.json', import.meta.url), 'utf8'))
const lines = new Map(catalog.product_lines.map((l) => [l.id, l]))
const withLine = (p) => ({ ...p, product_line: p.product_line_id ? lines.get(p.product_line_id) : null })

let failures = 0
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) failures++ }
const near = (a, b, tol) => a != null && Math.abs(a - b) <= tol

// --- weights
const w4050 = F.productWeightLb({ tarp_type: 'poly', thickness_mil: 10, width_ft: 40, length_ft: 50, product_line: { weight_oz_per_sqyd: 2.5 } })
ok(near(w4050, 59, 0.5), `40'x50' 10-mil ≈ 59 lb (Webstaurant listing) → ${w4050} lb, wrong seed line weight 2.5 oz ignored`)
ok(F.productWeightLb({ tarp_type: 'poly', thickness_mil: 20, width_ft: 20, length_ft: 30, product_line: { weight_oz_per_sqyd: 5 } }) === 45.83, "20'x30' 20-mil uses 11 oz spec → 45.83 lb")
ok(F.productWeightLb({ tarp_type: 'poly', thickness_mil: 10, width_ft: 10, length_ft: 10, shipping_weight_lb: 3.2 }) === 3.2, 'manual shipping_weight_lb override wins')
ok(F.productWeightLb({ tarp_type: 'poly', thickness_mil: 12, width_ft: 10, length_ft: 9, product_line: { weight_oz_per_sqyd: 9 } }) === 5.63, 'heavier line weight beats spec (9 oz > 6 oz)')
ok(F.productWeightLb({ tarp_type: 'canvas', thickness_mil: null, width_ft: 9, length_ft: 9, product_line: { weight_oz_per_sqyd: 18 } }) === 10.13, 'canvas uses its line weight (18 oz)')
ok(F.productWeightLb({ tarp_type: 'mesh', thickness_mil: null, width_ft: 10, length_ft: 10, product_line: null }) === null, 'mesh without line weight → unknown')
ok(F.productWeightLb({ xpose_sku: 'BB-9B-10', tarp_type: 'accessory', thickness_mil: null, width_ft: 0, length_ft: 0 }) === null, 'accessory without override → unknown')
ok(F.productWeightLb({ xpose_sku: '15X30-10MIL-HP72', tarp_type: 'poly', thickness_mil: 10, width_ft: 15, length_ft: 30 }) === 956.25, 'half-pallet SKU HP72 = 72 × 13.28 lb')

// --- freight brackets (placeholder config)
const cfg = F.PLACEHOLDER_FREIGHT_CONFIG
let r = F.calculateFreight([{ sku: 'A', quantity: 1, unitWeightLb: 10 }], cfg)
ok(r.method === 'parcel' && r.freightCents === 1200 + 40 * 10, `10 lb → parcel $12 + 10×$0.40 = ${r.freightCents}`)
r = F.calculateFreight([{ sku: 'A', quantity: 2, unitWeightLb: 10.2 }], cfg)
ok(r.billableWeightLb === 21 && r.freightCents === 1500 + 45 * 21, `20.4 lb bills 21 lb in 20–70 bracket → ${r.freightCents}`)
r = F.calculateFreight([{ sku: 'A', quantity: 1, unitWeightLb: 150 }], cfg)
ok(r.method === 'parcel' && r.freightCents === 2500 + 50 * 150, `exactly 150 lb is still parcel → ${r.freightCents}`)
r = F.calculateFreight([{ sku: 'A', quantity: 3, unitWeightLb: 59 }], cfg)
ok(r.method === 'quote' && r.freightCents === null, `177 lb > 150 lb with LTL checkout off → quote (${r.reason})`)
r = F.calculateFreight([{ sku: 'A', quantity: 3, unitWeightLb: 59 }], { ...cfg, settings: { ...cfg.settings, ltl_checkout_enabled: true } })
ok(r.method === 'ltl' && r.freightCents === 17500 + 20 * 177, `LTL enabled → LTL bracket ${r.freightCents}`)
r = F.calculateFreight([{ sku: 'A', quantity: 1, unitWeightLb: 5 }, { sku: 'BB', quantity: 1, unitWeightLb: null }], cfg)
ok(r.method === 'quote' && r.unknownWeightSkus[0] === 'BB', 'any unknown-weight line → quote')
r = F.calculateFreight([{ sku: 'A', quantity: 1, unitWeightLb: 5 }], { ...cfg, settings: { ...cfg.settings, free_freight_threshold_cents: 10000 } }, 12000)
ok(r.free && r.freightCents === 0, 'free threshold set + parcel + subtotal over → free')
r = F.calculateFreight([{ sku: 'A', quantity: 3, unitWeightLb: 59 }], { ...cfg, settings: { ...cfg.settings, free_freight_threshold_cents: 100 } }, 999999)
ok(r.method === 'quote', 'free threshold never applies to truck freight')
r = F.calculateFreight([{ sku: 'A', quantity: 1, unitWeightLb: 10 }], { ...cfg, settings: { ...cfg.settings, handling_cents: 300 } })
ok(r.freightCents === 1600 + 300, 'handling is added')
r = F.calculateFreight([{ sku: 'A', quantity: 1, unitWeightLb: 10 }], { rates: [], settings: cfg.settings })
ok(r.method === 'quote', 'no rates configured → quote (fail safe)')

// --- example SKUs from the demo catalog
console.log('\nExample ship weights:')
for (const sku of ['MT-10X12-7MIL', 'MT-12X16-10MIL', 'MT-20X30-10MIL', 'MT-30X40-12MIL', 'MT-40X60-10MIL', 'MT-20X30-20MIL', 'BB-9B-10']) {
  const p = catalog.products.find((x) => x.xpose_sku === sku)
  if (p) console.log(`  ${sku.padEnd(16)} ${p.width_ft}x${p.length_ft} ${p.thickness_mil ?? '-'} mil  → ${F.productWeightLb(withLine(p)) ?? 'unknown'} lb`)
}
console.log(`  40x50 10 mil (Xpose, not in demo catalog) → ${w4050} lb`)

console.log(failures ? `\n${failures} FAILED` : '\nAll freight unit tests passed.')
process.exit(failures ? 1 : 0)
