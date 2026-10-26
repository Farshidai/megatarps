// Display helpers for the buy box, cart and quick order. Client-safe: they read the
// server-computed price schedule (src/lib/price-schedule.ts), never the pricing engine.
import { scheduleNextTier, scheduleUnitPrice, type PricePoint, type NextTierNudge } from '@/lib/price-schedule'

export type { NextTierNudge } from '@/lib/price-schedule'

/**
 * The next quantity whose ACTUAL unit price (after floor, account and contract pricing, all
 * applied by the server) is at least 1% lower than today's. Null otherwise.
 */
export function nextTier(points: PricePoint[] | null | undefined, qty: number): NextTierNudge | null {
  return scheduleNextTier(points, qty)
}

export interface PackPreset {
  label: string
  qty: number
}

/** Quick quantity buttons: 1, case, half pallet, full pallet (when known), else real price breaks. */
export function packPresets(
  product: {
    units_per_case?: number | null
    units_per_half_pallet?: number | null
    units_per_full_pallet?: number | null
  },
  points: PricePoint[] | null | undefined,
): PackPreset[] {
  const presets: PackPreset[] = [{ label: '1 unit', qty: 1 }]
  if (product.units_per_case && product.units_per_case > 1) presets.push({ label: `Case (${product.units_per_case})`, qty: product.units_per_case })
  if (product.units_per_half_pallet) presets.push({ label: `½ pallet (${product.units_per_half_pallet})`, qty: product.units_per_half_pallet })
  if (product.units_per_full_pallet) presets.push({ label: `Pallet (${product.units_per_full_pallet})`, qty: product.units_per_full_pallet })
  if (presets.length === 1) {
    const base = scheduleUnitPrice(points, 1)
    for (const p of points ?? []) {
      const pct = base ? Math.round(((base - p.unit_price_cents) / base) * 100) : 0
      if (p.min_quantity > 1 && pct >= 1) presets.push({ label: `${p.min_quantity} · −${pct}%`, qty: p.min_quantity })
    }
  }
  return presets.slice(0, 5)
}
