// Weight-based freight. Pure and client-safe: used by the buy box, cart, drawer, quick order
// and admin calculator for display, and by /api/checkout as the ONLY source of the freight charge.
//
// Ship weight per unit (lb) = manual override (products.shipping_weight_lb), otherwise
//   area_sqft / 9 (→ sq yd) × fabric oz per sq yd / 16 (→ lb)
// Poly tarps use the official Xpose spec weight by mil (supplier catalog v24.2) unless the
// product line lists a heavier fabric. Other types (mesh, canvas, vinyl) use the product
// line weight when known. Anything else (e.g. accessories without an override) has an
// UNKNOWN weight, and any order containing it must go to a freight quote.

/** Xpose "Tarp features and specifications" table: WEIGHT SQ/YD by mil (oz). */
export const XPOSE_OZ_PER_SQYD_BY_MIL: Record<number, number> = {
  5: 3.6,
  7: 3.65,
  10: 4.25,
  12: 6,
  16: 8,
  20: 11,
}

/** tarp types whose fabric is the Xpose poly spec (fire-retardant tarps are coated poly). */
const POLY_TYPES = new Set(['poly', 'fire-retardant'])

export interface WeighableProduct {
  xpose_sku?: string
  tarp_type: string
  thickness_mil: number | null
  width_ft: number
  length_ft: number
  shipping_weight_lb?: number | string | null
  product_line?: { weight_oz_per_sqyd?: number | string | null } | null
}

/** Units per sellable item for pallet SKUs like "15X30-10MIL-HP72" (half pallet of 72). */
export function packCountFromSku(sku?: string): number {
  const m = sku?.match(/-(?:HP|FP)(\d+)$/i)
  return m ? Math.max(1, parseInt(m[1], 10)) : 1
}

/** Fabric weight (oz / sq yd) used for the calculation, or null when unknown. */
export function fabricOzPerSqYd(p: WeighableProduct): number | null {
  const lineOz = Number(p.product_line?.weight_oz_per_sqyd ?? 0) || 0
  if (POLY_TYPES.has(p.tarp_type) && p.thickness_mil && XPOSE_OZ_PER_SQYD_BY_MIL[p.thickness_mil]) {
    // the seed has wrong (too low) line weights, e.g. 2.5 oz for 10 mil; never go below spec
    return Math.max(XPOSE_OZ_PER_SQYD_BY_MIL[p.thickness_mil], lineOz)
  }
  return lineOz > 0 ? lineOz : null
}

/** Shipping weight in lb for ONE sellable unit, or null when unknown (→ freight quote). */
export function productWeightLb(p: WeighableProduct): number | null {
  const override = Number(p.shipping_weight_lb ?? 0)
  if (Number.isFinite(override) && override > 0) return override
  const area = (p.width_ft || 0) * (p.length_ft || 0)
  const oz = fabricOzPerSqYd(p)
  if (!area || !oz) return null
  const each = ((area / 9) * oz) / 16
  return Math.round(each * packCountFromSku(p.xpose_sku) * 100) / 100
}

// ---------------------------------------------------------------------------------------

export type FreightMethod = 'parcel' | 'ltl'

export interface FreightRate {
  id?: string
  method: FreightMethod
  min_lb: number
  max_lb: number | null
  base_cents: number
  per_lb_cents: number
  active: boolean
  sort: number
}

export interface FreightSettings {
  parcel_max_order_lb: number
  free_freight_threshold_cents: number | null
  ltl_checkout_enabled: boolean
  handling_cents: number
}

export interface FreightConfig {
  rates: FreightRate[]
  settings: FreightSettings
  /** true when these are the built-in placeholder defaults (demo mode / not configured) */
  placeholder?: boolean
}

export const DEFAULT_FREIGHT_SETTINGS: FreightSettings = {
  parcel_max_order_lb: 150,
  free_freight_threshold_cents: null,
  ltl_checkout_enabled: false,
  handling_cents: 0,
}

// PLACEHOLDER: Farshid must set real carrier rates (same values as supabase/migrations/0006_freight.sql)
export const PLACEHOLDER_FREIGHT_RATES: FreightRate[] = [
  { method: 'parcel', min_lb: 0, max_lb: 20, base_cents: 1200, per_lb_cents: 40, active: true, sort: 10 },
  { method: 'parcel', min_lb: 20, max_lb: 70, base_cents: 1500, per_lb_cents: 45, active: true, sort: 20 },
  { method: 'parcel', min_lb: 70, max_lb: 150, base_cents: 2500, per_lb_cents: 50, active: true, sort: 30 },
  { method: 'ltl', min_lb: 150, max_lb: 1000, base_cents: 17500, per_lb_cents: 20, active: true, sort: 40 },
  { method: 'ltl', min_lb: 1000, max_lb: null, base_cents: 25000, per_lb_cents: 15, active: true, sort: 50 },
]

export const PLACEHOLDER_FREIGHT_CONFIG: FreightConfig = {
  rates: PLACEHOLDER_FREIGHT_RATES,
  settings: DEFAULT_FREIGHT_SETTINGS,
  placeholder: true,
}

export interface FreightLine {
  sku?: string
  quantity: number
  /** per-unit ship weight in lb; null = unknown */
  unitWeightLb: number | null
}

export interface FreightResult {
  totalWeightLb: number
  /** weight used for billing (rounded up to whole lb) */
  billableWeightLb: number
  method: FreightMethod | 'quote'
  freightCents: number | null
  reason: string
  free: boolean
  unknownWeightSkus: string[]
}

export function findBracket(rates: FreightRate[], method: FreightMethod, weightLb: number): FreightRate | null {
  return (
    rates
      .filter((r) => r.active && r.method === method)
      .sort((a, b) => a.min_lb - b.min_lb || a.sort - b.sort)
      .find((r) => (r.min_lb === 0 ? weightLb >= 0 : weightLb > r.min_lb) && (r.max_lb == null || weightLb <= r.max_lb)) ?? null
  )
}

export const formatLb = (lb: number) => (lb >= 100 ? Math.round(lb).toLocaleString() : (Math.round(lb * 10) / 10).toString())

/**
 * Freight for the priced lines of an order.
 * @param subtotalCents merchandise subtotal (server-priced), used only for the optional free-freight threshold
 */
export function calculateFreight(lines: FreightLine[], config: FreightConfig, subtotalCents = 0): FreightResult {
  const s = config.settings
  const unknown = lines.filter((l) => l.unitWeightLb == null || !(l.unitWeightLb > 0)).map((l) => l.sku ?? '?')
  const total = lines.reduce((sum, l) => sum + (l.unitWeightLb && l.unitWeightLb > 0 ? l.unitWeightLb * l.quantity : 0), 0)
  const totalWeightLb = Math.round(total * 100) / 100
  const billableWeightLb = Math.ceil(totalWeightLb)
  const base = { totalWeightLb, billableWeightLb, free: false, unknownWeightSkus: unknown }

  if (!lines.length) return { ...base, method: 'parcel', freightCents: 0, reason: 'No items' }
  if (unknown.length) {
    return { ...base, method: 'quote', freightCents: null, reason: `Ship weight unknown for ${unknown.join(', ')}; freight must be quoted.` }
  }

  if (totalWeightLb <= s.parcel_max_order_lb) {
    const bracket = findBracket(config.rates, 'parcel', totalWeightLb)
    if (!bracket) return { ...base, method: 'quote', freightCents: null, reason: 'No parcel rate configured for this weight.' }
    const threshold = s.free_freight_threshold_cents
    if (threshold != null && threshold > 0 && subtotalCents >= threshold) {
      return { ...base, method: 'parcel', freightCents: 0, free: true, reason: 'Free parcel freight' }
    }
    return {
      ...base,
      method: 'parcel',
      freightCents: bracket.base_cents + bracket.per_lb_cents * billableWeightLb + (s.handling_cents || 0),
      reason: `Parcel, ${formatLb(totalWeightLb)} lb`,
    }
  }

  // over the parcel limit → truck freight (LTL)
  const ltl = findBracket(config.rates, 'ltl', totalWeightLb)
  if (s.ltl_checkout_enabled && ltl) {
    return {
      ...base,
      method: 'ltl',
      freightCents: ltl.base_cents + ltl.per_lb_cents * billableWeightLb + (s.handling_cents || 0),
      reason: `LTL truck freight, ${formatLb(totalWeightLb)} lb`,
    }
  }
  return {
    ...base,
    method: 'quote',
    freightCents: null,
    reason: `${formatLb(totalWeightLb)} lb ships by truck (LTL); freight quote required.`,
  }
}

export function freightMethodLabel(m: FreightResult['method']): string {
  return m === 'parcel' ? 'Parcel' : m === 'ltl' ? 'LTL truck freight' : 'Freight quote'
}

/** Normalise DB rows (numerics arrive as strings from PostgREST). */
export function normalizeFreightConfig(rates: unknown[] | null, settings: Record<string, unknown> | null): FreightConfig {
  const n = (v: unknown, d = 0) => (v == null || v === '' ? d : Number(v))
  return {
    rates: (rates ?? []).map((r) => {
      const x = r as Record<string, unknown>
      return {
        id: x.id as string | undefined,
        method: x.method === 'ltl' ? 'ltl' : 'parcel',
        min_lb: n(x.min_lb),
        max_lb: x.max_lb == null ? null : n(x.max_lb),
        base_cents: n(x.base_cents),
        per_lb_cents: n(x.per_lb_cents),
        active: x.active !== false,
        sort: n(x.sort),
      } satisfies FreightRate
    }),
    settings: {
      parcel_max_order_lb: n(settings?.parcel_max_order_lb, DEFAULT_FREIGHT_SETTINGS.parcel_max_order_lb),
      free_freight_threshold_cents: settings?.free_freight_threshold_cents == null ? null : n(settings.free_freight_threshold_cents),
      ltl_checkout_enabled: settings?.ltl_checkout_enabled === true,
      handling_cents: n(settings?.handling_cents),
    },
  }
}
