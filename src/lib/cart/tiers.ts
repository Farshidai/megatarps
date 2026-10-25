// Display helpers built on the shared pricing engine (src/lib/pricing.ts). Client-safe.
import { priceTiers, discountForQuantity, type PricingRule, type PriceOptions } from '@/lib/pricing'

type Priceable = { retail_price_cents: number; tarp_type: string; thickness_mil: number | null }

export interface NextTierNudge {
  addQty: number
  atQty: number
  discountPercent: number
}

/** The next volume tier above `qty` that gives a deeper discount, if any. */
export function nextTier(product: Priceable, qty: number, rules: PricingRule[], opts: PriceOptions = {}): NextTierNudge | null {
  const current = discountForQuantity(product, qty, rules)
  const next = priceTiers(product, rules, opts).find((t) => t.min_quantity > qty && t.discount_percent > current)
  if (!next) return null
  return { addQty: next.min_quantity - qty, atQty: next.min_quantity, discountPercent: next.discount_percent }
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
    for (const t of priceTiers(product, rules)) {
      if (t.min_quantity > 1 && t.discount_percent > 0) presets.push({ label: `${t.min_quantity} · −${t.discount_percent}%`, qty: t.min_quantity })
    }
  }
  return presets.slice(0, 5)
}
