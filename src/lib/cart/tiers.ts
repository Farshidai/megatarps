// Display helpers built on the shared pricing engine (src/lib/pricing.ts). Client-safe.
import { priceTiers, unitPriceCents, type PricingRule, type PriceOptions } from '@/lib/pricing'

type Priceable = { retail_price_cents: number; tarp_type: string; thickness_mil: number | null } & Parameters<typeof unitPriceCents>[0]

export interface NextTierNudge {
  addQty: number
  atQty: number
  discountPercent: number
}

/**
 * The next volume tier above `qty` whose ACTUAL unit price (after the price floor and any
 * account pricing) is lower than today's. Never nudges when the floor makes the "discount" zero.
 */
export function nextTier(product: Priceable, qty: number, rules: PricingRule[], opts: PriceOptions = {}): NextTierNudge | null {
  const currentUnit = unitPriceCents(product, qty, rules, opts)
  if (!currentUnit) return null
  for (const t of priceTiers(product, rules, opts)) {
    if (t.min_quantity <= qty) continue
    const unit = unitPriceCents(product, t.min_quantity, rules, opts)
    if (unit < currentUnit) {
      const pct = Math.round(((currentUnit - unit) / currentUnit) * 100)
      if (pct < 1) continue
      return { addQty: t.min_quantity - qty, atQty: t.min_quantity, discountPercent: pct }
    }
  }
  return null
}

export interface PackPreset {
  label: string
  qty: number
}

/** Quick quantity buttons: 1, case, half pallet, full pallet (when known), else tier breaks. */
export function packPresets(
  product: Priceable & {
    units_per_case?: number | null
    units_per_half_pallet?: number | null
    units_per_full_pallet?: number | null
  },
  rules: PricingRule[],
): PackPreset[] {
  const presets: PackPreset[] = [{ label: '1 unit', qty: 1 }]
  if (product.units_per_case && product.units_per_case > 1) presets.push({ label: `Case (${product.units_per_case})`, qty: product.units_per_case })
  if (product.units_per_half_pallet) presets.push({ label: `½ pallet (${product.units_per_half_pallet})`, qty: product.units_per_half_pallet })
  if (product.units_per_full_pallet) presets.push({ label: `Pallet (${product.units_per_full_pallet})`, qty: product.units_per_full_pallet })
  if (presets.length === 1) {
    const base = unitPriceCents(product, 1, rules)
    for (const t of priceTiers(product, rules)) {
      const unit = unitPriceCents(product, t.min_quantity, rules)
      const pct = base ? Math.round(((base - unit) / base) * 100) : 0
      if (t.min_quantity > 1 && pct >= 1) presets.push({ label: `${t.min_quantity} · −${pct}%`, qty: t.min_quantity })
    }
  }
  return presets.slice(0, 5)
}
