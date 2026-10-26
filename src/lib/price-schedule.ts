// Client-safe lookups on server-computed price schedules (PricePoint[] from priceSchedule()
// in src/lib/pricing.ts). Pure table lookups: no rules, no floor, no engine. The server
// computed every point, so these return exactly what checkout will charge (checkout still
// re-prices everything server-side).
import type { PricePoint } from '@/lib/pricing'

export type { PricePoint } from '@/lib/pricing'

function pointFor(points: PricePoint[] | null | undefined, qty: number): PricePoint | null {
  if (!points?.length || !(qty >= 1)) return null
  let hit: PricePoint | null = null
  for (const p of points) {
    if (p.min_quantity <= qty) hit = p
    else break
  }
  return hit
}

/** Unit price for qty (0 when there is no schedule, e.g. quote-only). */
export function scheduleUnitPrice(points: PricePoint[] | null | undefined, qty: number): number {
  return pointFor(points, qty)?.unit_price_cents ?? 0
}

export function scheduleLineTotal(points: PricePoint[] | null | undefined, qty: number): number {
  return scheduleUnitPrice(points, qty) * qty
}

/** True when the price at qty is the account's contract price. */
export function scheduleIsContract(points: PricePoint[] | null | undefined, qty: number): boolean {
  return pointFor(points, qty)?.contract === true
}

/** Lowest unit price on the schedule (for "as low as"). */
export function scheduleLowest(points: PricePoint[] | null | undefined): number {
  return points?.length ? Math.min(...points.map((p) => p.unit_price_cents)) : 0
}

export interface NextTierNudge {
  addQty: number
  atQty: number
  discountPercent: number
  unitPriceCents: number
}

/** The next breakpoint above qty whose price is at least 1% lower than today's. */
export function scheduleNextTier(points: PricePoint[] | null | undefined, qty: number): NextTierNudge | null {
  const current = scheduleUnitPrice(points, qty)
  if (!current || !points) return null
  for (const p of points) {
    if (p.min_quantity <= qty || p.unit_price_cents >= current) continue
    const pct = Math.round(((current - p.unit_price_cents) / current) * 100)
    if (pct < 1) continue
    return { addQty: p.min_quantity - qty, atQty: p.min_quantity, discountPercent: pct, unitPriceCents: p.unit_price_cents }
  }
  return null
}
