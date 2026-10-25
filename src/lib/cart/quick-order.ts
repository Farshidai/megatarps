// Quick-order helpers: catalog search and "SKU, qty" list parsing. Client-safe, pure.
import type { CatalogEntry } from './catalog-types'
import { MAX_LINE_QUANTITY } from './constants'

const norm = (s: string) => s.toLowerCase().replace(/[\s_]+/g, '')

interface Parsed {
  w?: number
  l?: number
  mil?: number
  words: string[]
}

function parseQuery(q: string): Parsed {
  const out: Parsed = { words: [] }
  let rest = q.toLowerCase()
  const size = rest.match(/(\d+(?:\.\d+)?)\s*(?:'|ft)?\s*[x×*]\s*(\d+(?:\.\d+)?)/)
  if (size) {
    out.w = Number(size[1])
    out.l = Number(size[2])
    rest = rest.replace(size[0], ' ')
  }
  const mil = rest.match(/(\d+(?:\.\d+)?)\s*-?\s*mil/)
  if (mil) {
    out.mil = Number(mil[1])
    rest = rest.replace(mil[0], ' ')
  }
  out.words = rest.split(/[\s,/-]+/).filter((w) => w.length > 1)
  return out
}

/** Ranked catalog matches for a SKU fragment, size ("10x12 16 mil") or name words. */
export function searchCatalog(catalog: CatalogEntry[], query: string, limit = 8): CatalogEntry[] {
  const q = query.trim()
  if (!q) return []
  const nq = norm(q)
  const parsed = parseQuery(q)
  const scored: Array<[number, CatalogEntry]> = []
  for (const p of catalog) {
    const sku = norm(p.sku)
    let score = 0
    if (sku === nq) score += 1000
    else if (sku.startsWith(nq)) score += 400
    else if (nq.length >= 3 && sku.includes(nq)) score += 200

    if (parsed.w != null && parsed.l != null) {
      const sizeMatch = (p.width_ft === parsed.w && p.length_ft === parsed.l) || (p.width_ft === parsed.l && p.length_ft === parsed.w)
      if (sizeMatch) score += 300
      else if (score < 200) continue
    }
    if (parsed.mil != null) {
      if (p.thickness_mil === parsed.mil) score += 100
      else if (score < 200) continue
    }
    const hay = `${p.name} ${p.color} ${p.tarp_type}`.toLowerCase()
    const words = parsed.words.filter((w) => !norm(p.sku).includes(w))
    if (words.length) {
      const hits = words.filter((w) => hay.includes(w)).length
      if (hits === words.length) score += 50 * hits
      else if (score < 200) continue
    }
    if (score > 0) scored.push([score + (p.in_stock ? 1 : 0), p])
  }
  return scored.sort((a, b) => b[0] - a[0] || a[1].name.localeCompare(b[1].name)).slice(0, limit).map(([, p]) => p)
}

/** Exact SKU (case/space-insensitive) or a single unambiguous size/name match. */
export function resolveEntry(catalog: CatalogEntry[], query: string): CatalogEntry | null {
  const nq = norm(query)
  if (!nq) return null
  const exact = catalog.find((p) => norm(p.sku) === nq)
  if (exact) return exact
  const hits = searchCatalog(catalog, query, 2)
  return hits.length === 1 ? hits[0] : null
}

export interface PastedLine {
  line: number
  raw: string
  query: string
  quantity: number
  error?: string
}

/**
 * Parses pasted text: one "SKU, qty" per line. Separators: comma, tab, semicolon, or
 * spaces before a trailing number ("MT-10X12 25"). "qty x SKU" ("25 x MT-10X12") works too.
 * Header rows like "sku,qty" are skipped.
 */
export function parsePastedList(text: string): PastedLine[] {
  const out: PastedLine[] = []
  text.split(/\r?\n/).forEach((rawLine, idx) => {
    const raw = rawLine.trim()
    if (!raw) return
    if (/^(sku|item|part)\b.*\b(qty|quantity)\b/i.test(raw)) return
    let query = raw
    let qtyStr = ''
    const parts = raw.split(/[,\t;]+/).map((s) => s.trim()).filter(Boolean)
    if (parts.length >= 2) {
      const numIdx = parts.findIndex((p, i) => i > 0 && /^-?\d+(\.\d+)?$/.test(p))
      if (numIdx > 0) {
        qtyStr = parts[numIdx]
        query = parts.slice(0, numIdx).join(' ')
      } else if (/^\d+$/.test(parts[0])) {
        qtyStr = parts[0]
        query = parts.slice(1).join(' ')
      } else {
        query = parts.join(' ')
      }
    } else {
      // don't read a size like "12 x 16" as quantity × item
      const lead = /^\d+(?:\.\d+)?\s*[x×*]\s*\d/i.test(raw) ? null : raw.match(/^(\d+)\s*(?:x|×|ea|pcs?)?\s+(.+)$/i)
      const trail = /\d\s*[x×*]\s*\d+$/i.test(raw) ? null : raw.match(/^(.+?)\s+(?:x|×|qty:?)?\s*(\d+)$/i)
      if (trail) {
        query = trail[1]
        qtyStr = trail[2]
      } else if (lead && !/^mil\b/i.test(lead[2])) {
        qtyStr = lead[1]
        query = lead[2]
      }
    }
    const quantity = qtyStr ? Number(qtyStr) : 1
    const line: PastedLine = { line: idx + 1, raw, query: query.trim(), quantity }
    if (!line.query) line.error = 'Missing SKU'
    else if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) line.error = `Quantity must be 1–${MAX_LINE_QUANTITY}`
    out.push(line)
  })
  return out
}
