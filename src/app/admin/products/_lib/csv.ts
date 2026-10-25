// CSV helpers for the bulk price editor. Pure functions (used in the browser).
// Format: sku,cost,retail,in_stock[,name]  — cost/retail in dollars, blank = leave unchanged.

export interface PriceRow {
  sku: string
  name: string
  market_cents?: number | null
  cost_cents: number
  retail_cents: number
  in_stock: boolean
}

export interface CsvUpdate {
  sku: string
  cost_cents?: number
  retail_cents?: number
  in_stock?: boolean
}

export interface CsvParseResult {
  updates: CsvUpdate[]
  errors: string[]
  /** Which of cost / retail / in_stock the file contains. Missing columns leave those fields unchanged. */
  columns: Array<'cost' | 'retail' | 'in_stock'>
}

/** RFC 4180-ish parser: quoted fields, escaped quotes, CRLF, BOM. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const s = text.replace(/^﻿/, '')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some((f) => f.trim() !== '')) rows.push(row)
      row = []
    } else field += c
  }
  row.push(field)
  if (row.some((f) => f.trim() !== '')) rows.push(row)
  return rows
}

/** "$1,234.50" -> 123450 cents; '' -> undefined; invalid -> NaN */
export function dollarsToCents(raw: string): number | undefined {
  const t = raw.trim().replace(/[$,\s]/g, '')
  if (t === '') return undefined
  if (!/^\d+(\.\d{0,2})?$/.test(t)) return NaN
  return Math.round(Number(t) * 100)
}

export function parseBool(raw: string): boolean | undefined | null {
  const t = raw.trim().toLowerCase()
  if (t === '') return undefined
  if (['true', 'yes', 'y', '1', 'in', 'in stock'].includes(t)) return true
  if (['false', 'no', 'n', '0', 'out', 'out of stock'].includes(t)) return false
  return null
}

export function parsePriceCsv(text: string): CsvParseResult {
  const rows = parseCsv(text)
  const errors: string[] = []
  if (!rows.length) return { updates: [], errors: ['The file is empty.'], columns: [] }
  // Header names are matched loosely ("Item #", "MFR #", "Unit Cost", "Wholesale Price" …).
  // A bare "price" column is deliberately NOT accepted: on a supplier sheet it means cost,
  // on a store export it means retail — guessing wrong would mis-price the site.
  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ''))
  const col = (names: string[]) => header.findIndex((h) => names.includes(h))
  const iSku = col(['sku', 'xpose_sku', 'item', 'itemno', 'item_no', 'itemnumber', 'mfr', 'mfrno', 'model', 'partnumber', 'part_no'])
  const iCost = col(['cost', 'cost_price', 'cost_usd', 'unitcost', 'unit_cost', 'yourcost', 'wholesale', 'wholesaleprice', 'wholesale_price', 'dealercost', 'dealerprice'])
  const iRetail = col(['retail', 'retail_price', 'retail_usd', 'retailprice', 'sell_price', 'sellprice'])
  const iStock = col(['in_stock', 'instock', 'stock'])
  const columns = [iCost >= 0 && 'cost', iRetail >= 0 && 'retail', iStock >= 0 && 'in_stock'].filter(Boolean) as CsvParseResult['columns']
  if (iSku < 0) return { updates: [], errors: ['Missing a "sku" column in the header row (expected: sku,cost,retail,in_stock — any subset of the last three).'], columns }
  if (!columns.length) return { updates: [], errors: ['No cost, retail or in_stock column found. (A column named just "price" is ambiguous — rename it to "cost" or "retail".)'], columns }

  const seen = new Set<string>()
  const updates: CsvUpdate[] = []
  rows.slice(1).forEach((r, idx) => {
    const line = idx + 2
    const sku = (r[iSku] ?? '').trim().toUpperCase()
    if (!sku) { errors.push(`Line ${line}: missing SKU`); return }
    if (seen.has(sku)) { errors.push(`Line ${line}: duplicate SKU ${sku} (later row ignored)`); return }
    seen.add(sku)
    const u: CsvUpdate = { sku }
    if (iCost >= 0) {
      const v = dollarsToCents(r[iCost] ?? '')
      if (Number.isNaN(v)) errors.push(`Line ${line} (${sku}): cost "${r[iCost]}" is not a dollar amount`)
      else if (v !== undefined) u.cost_cents = v
    }
    if (iRetail >= 0) {
      const v = dollarsToCents(r[iRetail] ?? '')
      if (Number.isNaN(v)) errors.push(`Line ${line} (${sku}): retail "${r[iRetail]}" is not a dollar amount`)
      else if (v !== undefined) u.retail_cents = v
    }
    if (iStock >= 0) {
      const v = parseBool(r[iStock] ?? '')
      if (v === null) errors.push(`Line ${line} (${sku}): in_stock "${r[iStock]}" should be true/false`)
      else if (v !== undefined) u.in_stock = v
    }
    if (u.cost_cents !== undefined || u.retail_cents !== undefined || u.in_stock !== undefined) updates.push(u)
  })
  return { updates, errors, columns }
}

/** Match a CSV SKU to a catalog SKU: exact, then with/without the marketplace "-X" suffix. */
export function resolveSku(sku: string, known: Set<string>): string | null {
  const s = sku.trim().toUpperCase()
  if (known.has(s)) return s
  if (s.endsWith('-X') && known.has(s.slice(0, -2))) return s.slice(0, -2)
  if (known.has(`${s}-X`)) return `${s}-X`
  return null
}

const esc = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
const money = (c: number) => (c / 100).toFixed(2)

export function toPriceCsv(rows: PriceRow[]): string {
  // name and market are for reference in a spreadsheet; import ignores them
  const lines = ['sku,cost,retail,in_stock,name,market']
  for (const r of rows) {
    lines.push([esc(r.sku), r.cost_cents ? money(r.cost_cents) : '', r.retail_cents ? money(r.retail_cents) : '', r.in_stock ? 'true' : 'false', esc(r.name), r.market_cents ? money(r.market_cents) : ''].join(','))
  }
  return lines.join('\r\n') + '\r\n'
}
