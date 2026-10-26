// Parses the text export of the official Xpose Safety "Tarps Overview" catalog
// (the PDF itself is NOT stored in the repo) into supabase/pricing/xpose-catalog.csv:
//   sku,line_prefix,width_ft,length_ft,color,case_pack
// That CSV is the committed, reviewable input for scripts/build-seed-catalog.mjs.
//
// Usage: node scripts/parse-xpose-catalog.mjs [path/to/xpose-tarps-overview.txt]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const src = process.argv[2] ?? '/home/claude/sources/xpose-tarps-overview-v24.2.txt'
const lines = readFileSync(src, 'utf8').split('\n')

// prefix -> color (column order in each table matches the catalog's column headers)
const SECTIONS = [
  { start: /^\s*5 MIL\s*$/, end: /^\s*7 MIL\s*$/, cols: ['BT', 'GT', 'BRT'] },
  { start: /^\s*7 MIL\s*$/, end: /xposesafety\.com/, cols: ['BTH'] },
  { start: /^\s*10 MIL\s*$/, end: /^\s*12 MIL\s*$/, cols: ['STH', 'MTGB'] },
  { start: /^\s*12 MIL\s*$/, end: /^\s*16 MIL/, cols: ['WHD', 'STHD', 'THD'] },
  { start: /^\s*16 MIL/, end: /xposesafety\.com/, cols: ['BHD', 'UHD'] },
  { start: /^Canvas Tarps/, end: /xposesafety\.com/, cols: ['CTG10', 'CTT10', 'CTOD10', 'CTW10'] },
]
const COLORS = {
  BT: 'Blue', GT: 'Green', BRT: 'Brown', BTH: 'Blue', STH: 'Silver/Black', MTGB: 'Green/Black',
  WHD: 'White', STHD: 'Silver', THD: 'Tan', BHD: 'Brown', UHD: 'Brown/White',
  CTG10: 'Green', CTT10: 'Tan', CTOD10: 'Olive Drab', CTW10: 'White',
  CVT20: 'Clear', CVT30: 'Clear', CVTFR: 'Clear',
}
const SKU_RE = /^([A-Z]+\d{0,2})-(\d+)$/
const DASH = new Set(['—', '-', '–'])
const notes = []
const out = new Map() // sku -> row

function add(prefix, w, l, rawSku, casePack) {
  let sku = rawSku
  let [, p, digits] = sku.match(SKU_RE)
  if (p === 'MRGB') { // catalog typo for the green/black 10-mil line
    notes.push(`${sku}: printed as MRGB, normalized to MTGB`)
    p = 'MTGB'
  }
  if (p !== prefix) notes.push(`${sku}: prefix ${p} in the ${prefix} column`)
  if (digits !== `${w}${l}`) { // catalog typo (e.g. 15' x 40' printed as BHD-1240)
    notes.push(`${sku}: listed for ${w}x${l}, corrected to ${p}-${w}${l}`)
    digits = `${w}${l}`
  }
  sku = `${p}-${digits}`
  if (out.has(sku)) return
  out.set(sku, { sku, prefix: p, w, l, color: COLORS[p], case_pack: casePack })
}

for (const sec of SECTIONS) {
  let i = lines.findIndex((s) => sec.start.test(s))
  if (i < 0) throw new Error(`section not found: ${sec.start}`)
  const n = sec.cols.length
  let cur = null
  const flush = () => {
    if (!cur) return
    cur.skus.forEach((s, k) => s && add(sec.cols[k], cur.w, cur.l, s, cur.qty ?? null))
    cur = null
  }
  for (i = i + 1; i < lines.length && !sec.end.test(lines[i]); i++) {
    const text = lines[i].replace(/(\d+)\s*’?\s*[xX]\s*(\d+)\s*’?/g, ' SIZE:$1x$2 ')
    for (const tok of text.split(/\s+/).filter(Boolean)) {
      const size = tok.match(/^SIZE:(\d+)x(\d+)$/)
      if (size) { flush(); cur = { w: +size[1], l: +size[2], skus: [], qty: undefined }; continue }
      if (!cur) continue
      if (cur.skus.length < n) {
        if (SKU_RE.test(tok)) cur.skus.push(tok)
        else if (DASH.has(tok)) cur.skus.push(null)
        continue
      }
      if (cur.qty === undefined) {
        if (/^\d+$/.test(tok)) cur.qty = +tok
        else if (DASH.has(tok)) cur.qty = null
        if (cur.qty !== undefined) flush()
      }
    }
  }
  flush()
}

// Clear vinyl tables have no case pack and a broken text layout: take SKUs and decode
// the size from the SKU digits (width then length, width <= length).
function decode(digits) {
  const c = []
  for (let k = 1; k < digits.length; k++) {
    const a = digits.slice(0, k), b = digits.slice(k)
    if (a[0] === '0' || b[0] === '0') continue
    if (+a <= +b) c.push([+a, +b])
  }
  return c.length === 1 ? c[0] : null
}
for (const m of lines.join('\n').matchAll(/\b(CVT20|CVT30|CVTFR)-(\d+)\b/g)) {
  const sz = decode(m[2])
  if (!sz) { notes.push(`${m[0]}: size not decodable, skipped`); continue }
  add(m[1], sz[0], sz[1], m[0], null)
}

const rows = [...out.values()].sort((a, b) => a.prefix.localeCompare(b.prefix) || a.w * a.l - b.w * b.l || a.w - b.w)
mkdirSync('supabase/pricing', { recursive: true })
writeFileSync(
  'supabase/pricing/xpose-catalog.csv',
  ['sku,line_prefix,width_ft,length_ft,color,case_pack', ...rows.map((r) => [r.sku, r.prefix, r.w, r.l, r.color, r.case_pack ?? ''].join(','))].join('\n') + '\n',
)
console.log(`xpose-catalog.csv: ${rows.length} SKUs (${rows.filter((r) => r.case_pack).length} with case pack)`)
for (const n of notes) console.log('  note:', n)
