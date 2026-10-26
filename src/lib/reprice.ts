// "Reprice from market": pure math, shared by the admin server actions and the unit test
// (scripts/test-reprice.test.mjs). No I/O, no server-only imports.
//
// Guest price = max(latest per-tarp PALLET price at the market × (1 − X%), floor)
//  • market: the most recent full_pallet observation for the Xpose SKU, else the most recent
//    half_pallet one. Per tarp = price_cents / units (exact; rounded once at the end).
//  • floor: cost × 1.15 rounded up (same as the DB trigger in 0009_hardening.sql), or the
//    stored min_unit_price_cents if an admin set it higher. No cost on file → the row is
//    left unchanged ("NO COST"): we can't prove the new price is above cost.
//  • pallet SKUs (pack_quantity > 1, e.g. 20X20-7MIL-HP72): per-tarp price × pack_quantity,
//    and their cost / floor are per pack.
// Shopify-style SKUs map to the Xpose SKU the same way supabase/seed-prices-2026-10-25.sql did:
// green/black → MTGB, 10-mil → STH, 7-mil → BTH, size = smaller side then larger side.

export type MarketKind = 'single' | 'case' | 'half_pallet' | 'full_pallet' | 'pack'

export interface MarketObservation {
  sku: string
  source: string
  kind: MarketKind | string
  units: number
  price_cents: number
  per_unit_cents?: number | null
  url?: string | null
  note?: string | null
  checked_at: string // YYYY-MM-DD
}

export interface RepriceProduct {
  xpose_sku: string
  name?: string
  tarp_type?: string | null
  thickness_mil?: number | null
  width_ft?: number | null
  length_ft?: number | null
  color?: string | null
  pack_quantity?: number | null
  retail_price_cents: number
  cost_price_cents?: number | null
  min_unit_price_cents?: number | null
}

export type RepriceStatus = 'ok' | 'floor' | 'no-market' | 'no-cost' | 'unchanged'

export interface RepriceRow {
  sku: string
  name: string
  market_sku: string | null
  /** chosen observation (for the tooltip / audit) */
  market_kind: string | null
  market_source: string | null
  market_checked_at: string | null
  /** market per tarp, cents */
  market_per_tarp_cents: number | null
  /** tarps priced by this row (pack_quantity for pallet SKUs, else 1) */
  pack: number
  floor_cents: number | null
  old_retail_cents: number
  new_retail_cents: number
  /** (new retail − cost) ÷ new retail, in %; null when no cost */
  margin_percent: number | null
  /** true when the floor beat market − X% */
  floor_wins: boolean
  status: RepriceStatus
}

export const PALLET_KINDS = ['full_pallet', 'half_pallet'] as const

const SIZE_FROM_SKU = /(\d+(?:\.\d+)?)\s*X\s*(\d+(?:\.\d+)?)/i
export const XPOSE_SKU = /^(STH|BTH|MTGB)-\d+$/i

/** Tarps per row: pack_quantity for pallet / multi-pack SKUs, else 1. */
export function packOf(p: Pick<RepriceProduct, 'pack_quantity'>): number {
  const n = Number(p.pack_quantity ?? 1)
  return Number.isInteger(n) && n > 1 ? n : 1
}

/**
 * The Xpose store SKU this product is priced against, or null.
 * STH-/BTH-/MTGB- SKUs map to themselves (without a marketplace "-X" suffix).
 */
export function marketSkuFor(p: RepriceProduct): string | null {
  const own = p.xpose_sku.trim().toUpperCase().replace(/-X$/, '')
  if (XPOSE_SKU.test(own)) return own
  if (p.tarp_type && p.tarp_type !== 'poly') return null
  let w = Number(p.width_ft ?? 0)
  let l = Number(p.length_ft ?? 0)
  if (!(w > 0 && l > 0)) {
    const m = own.match(SIZE_FROM_SKU)
    if (!m) return null
    w = Number(m[1])
    l = Number(m[2])
  }
  if (!Number.isInteger(w) || !Number.isInteger(l)) return null
  const size = `${Math.min(w, l)}${Math.max(w, l)}`
  const color = (p.color ?? '').toLowerCase().replace(/\s+/g, '')
  if (color.includes('green') && color.includes('black')) return `MTGB-${size}`
  if (p.thickness_mil === 10) return `STH-${size}`
  if (p.thickness_mil === 7) return `BTH-${size}`
  return null
}

/** Exact per-tarp price (fractional cents) — the math uses this, not the truncated DB column. */
function perUnitExact(o: MarketObservation): number {
  return Number(o.price_cents) / (Number(o.units) || 1)
}

function perUnit(o: MarketObservation): number {
  const units = Number(o.units) || 1
  return o.per_unit_cents != null && Number(o.per_unit_cents) > 0 ? Number(o.per_unit_cents) : Math.floor(Number(o.price_cents) / units)
}

/**
 * The observation to price from: latest full_pallet for the SKU, else latest half_pallet.
 * Same date → the cheaper per tarp. `source` filters by source name (null = any).
 */
export function pickPalletObservation(sku: string, obs: MarketObservation[], source: string | null = null): MarketObservation | null {
  const key = sku.toUpperCase()
  for (const kind of PALLET_KINDS) {
    const rows = obs.filter((o) => o.sku.toUpperCase() === key && o.kind === kind && (!source || o.source === source) && Number(o.price_cents) > 0)
    if (!rows.length) continue
    rows.sort((a, b) => String(b.checked_at).localeCompare(String(a.checked_at)) || perUnitExact(a) - perUnitExact(b))
    return rows[0]
  }
  return null
}

/** Floor in cents for the whole row (cost × 1.15 rounded up, or a higher stored floor). Null without a cost. */
export function floorCents(p: Pick<RepriceProduct, 'cost_price_cents' | 'min_unit_price_cents'>): number | null {
  const cost = Number(p.cost_price_cents ?? 0)
  if (!(cost > 0)) return null
  const fromCost = Math.ceil(cost * 1.15)
  return Math.max(fromCost, Number(p.min_unit_price_cents ?? 0) || 0)
}

export function marginPercent(cost: number | null | undefined, retail: number): number | null {
  if (!cost || cost <= 0 || !retail) return null
  return Math.round(((retail - cost) / retail) * 1000) / 10
}

/** One preview row. `percentBelow` is X in "market − X%" (0 ≤ X < 100). */
export function repriceRow(p: RepriceProduct, obs: MarketObservation[], percentBelow = 5, source: string | null = null): RepriceRow {
  const pct = Number(percentBelow)
  if (!Number.isFinite(pct) || pct < 0 || pct >= 100) throw new Error('Percent below market must be from 0 to 99.')
  const pack = packOf(p)
  const old = Number(p.retail_price_cents) || 0
  const floor = floorCents(p)
  // a product's own SKU wins if the market lists it directly; otherwise the mapped Xpose SKU
  const own = p.xpose_sku.trim().toUpperCase()
  const mapped = marketSkuFor(p)
  const chosen = pickPalletObservation(own, obs, source) ?? (mapped && mapped !== own ? pickPalletObservation(mapped, obs, source) : null)
  const base: RepriceRow = {
    sku: p.xpose_sku,
    name: p.name ?? p.xpose_sku,
    market_sku: chosen?.sku ?? mapped,
    market_kind: chosen?.kind ?? null,
    market_source: chosen?.source ?? null,
    market_checked_at: chosen ? String(chosen.checked_at).slice(0, 10) : null,
    market_per_tarp_cents: chosen ? perUnit(chosen) : null,
    pack,
    floor_cents: floor,
    old_retail_cents: old,
    new_retail_cents: old,
    margin_percent: marginPercent(p.cost_price_cents, old),
    floor_wins: false,
    status: 'no-market',
  }
  if (!chosen) return base
  if (floor == null) return { ...base, status: 'no-cost' }
  const perTarp = Math.round(perUnitExact(chosen) * (1 - pct / 100))
  const candidate = perTarp * pack
  const next = Math.max(candidate, floor)
  return {
    ...base,
    new_retail_cents: next,
    margin_percent: marginPercent(p.cost_price_cents, next),
    floor_wins: floor > candidate,
    status: next === old ? 'unchanged' : floor > candidate ? 'floor' : 'ok',
  }
}

export function repriceRows(products: RepriceProduct[], obs: MarketObservation[], percentBelow = 5, source: string | null = null): RepriceRow[] {
  return products.map((p) => repriceRow(p, obs, percentBelow, source))
}

/** Observations relevant to one product: its own SKU and the mapped Xpose SKU, newest first. */
export function observationsFor(p: RepriceProduct, obs: MarketObservation[]): MarketObservation[] {
  const keys = new Set([p.xpose_sku.trim().toUpperCase(), p.xpose_sku.trim().toUpperCase().replace(/-X$/, ''), marketSkuFor(p) ?? ''].filter(Boolean))
  const order: Record<string, number> = { full_pallet: 0, half_pallet: 1, case: 2, pack: 3, single: 4 }
  return obs
    .filter((o) => keys.has(o.sku.toUpperCase()))
    .sort((a, b) => String(b.checked_at).localeCompare(String(a.checked_at)) || (order[a.kind] ?? 9) - (order[b.kind] ?? 9) || a.source.localeCompare(b.source))
}

export const TTW_SOURCE = 'The Tarps Wholesaler (Xpose store)'
