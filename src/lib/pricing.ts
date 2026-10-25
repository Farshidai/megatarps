// Single source of truth for wholesale tier pricing.
// Used by: product pages (tier table), product cards, cart, checkout API (server-side
// re-pricing — never trust client prices), quotes.
import type { Product } from '@/types'

export interface PricingRule {
  id?: string
  tarp_type: string | null
  thickness_mil: number | null
  min_quantity: number
  max_quantity: number | null
  margin_percent?: number | null
  discount_from_retail_percent: number | null
  flat_markup_cents?: number | null
  priority?: number | null
  active?: boolean
}

export interface PriceTier {
  min_quantity: number
  max_quantity: number | null
  discount_percent: number
  unit_price_cents: number
  label: string // e.g. "5–9", "100+"
}

export interface PriceOptions {
  /** Extra % off for approved wholesale accounts, applied on top of the volume tier. */
  wholesaleDiscountPercent?: number
}

/** A product with no retail price can only be quoted, never bought online. */
export function isQuoteOnly(product: Pick<Product, 'retail_price_cents'>): boolean {
  return !product.retail_price_cents || product.retail_price_cents <= 0
}

function ruleApplies(rule: PricingRule, product: Pick<Product, 'tarp_type' | 'thickness_mil'>) {
  if (rule.active === false) return false
  if (rule.tarp_type && rule.tarp_type !== product.tarp_type) return false
  if (rule.thickness_mil && rule.thickness_mil !== product.thickness_mil) return false
  return true
}

/** Rules that apply to this product, de-duplicated per min_quantity (highest priority / most specific wins). */
export function applicableRules(product: Pick<Product, 'tarp_type' | 'thickness_mil'>, rules: PricingRule[]): PricingRule[] {
  const byMin = new Map<number, PricingRule>()
  const score = (r: PricingRule) => (r.priority ?? 0) * 10 + (r.tarp_type ? 2 : 0) + (r.thickness_mil ? 1 : 0)
  for (const r of rules.filter((r) => ruleApplies(r, product))) {
    const cur = byMin.get(r.min_quantity)
    if (!cur || score(r) > score(cur)) byMin.set(r.min_quantity, r)
  }
  return [...byMin.values()].sort((a, b) => a.min_quantity - b.min_quantity)
}

export function discountForQuantity(product: Pick<Product, 'tarp_type' | 'thickness_mil'>, qty: number, rules: PricingRule[]): number {
  let d = 0
  for (const r of applicableRules(product, rules)) {
    if (qty >= r.min_quantity && (r.max_quantity == null || qty <= r.max_quantity)) d = Number(r.discount_from_retail_percent ?? 0)
  }
  return d
}

/** Unit price in cents for a quantity. Returns 0 for quote-only products. */
export function unitPriceCents(
  product: Pick<Product, 'retail_price_cents' | 'tarp_type' | 'thickness_mil'>,
  qty: number,
  rules: PricingRule[],
  opts: PriceOptions = {},
): number {
  if (isQuoteOnly(product)) return 0
  const volume = discountForQuantity(product, qty, rules)
  const wholesale = opts.wholesaleDiscountPercent ?? 0
  const price = product.retail_price_cents * (1 - volume / 100) * (1 - wholesale / 100)
  return Math.round(price)
}

export function lineTotalCents(
  product: Pick<Product, 'retail_price_cents' | 'tarp_type' | 'thickness_mil'>,
  qty: number,
  rules: PricingRule[],
  opts: PriceOptions = {},
): number {
  return unitPriceCents(product, qty, rules, opts) * qty
}

/** Full tier table for display: 1-unit row plus one row per volume rule. */
export function priceTiers(
  product: Pick<Product, 'retail_price_cents' | 'tarp_type' | 'thickness_mil'>,
  rules: PricingRule[],
  opts: PriceOptions = {},
): PriceTier[] {
  if (isQuoteOnly(product)) return []
  const rs = applicableRules(product, rules)
  const firstMin = rs[0]?.min_quantity ?? Infinity
  const tiers: PriceTier[] = []
  if (firstMin > 1) {
    tiers.push({
      min_quantity: 1,
      max_quantity: Number.isFinite(firstMin) ? firstMin - 1 : null,
      discount_percent: 0,
      unit_price_cents: unitPriceCents(product, 1, rules, opts),
      label: Number.isFinite(firstMin) ? (firstMin - 1 === 1 ? '1' : `1–${firstMin - 1}`) : '1+',
    })
  }
  for (const r of rs) {
    tiers.push({
      min_quantity: r.min_quantity,
      max_quantity: r.max_quantity,
      discount_percent: Number(r.discount_from_retail_percent ?? 0),
      unit_price_cents: unitPriceCents(product, r.min_quantity, rules, opts),
      label: r.max_quantity == null ? `${r.min_quantity}+` : `${r.min_quantity}–${r.max_quantity}`,
    })
  }
  return tiers
}

/** Lowest possible unit price (best tier) — for "as low as $X" on cards. */
export function lowestUnitPriceCents(
  product: Pick<Product, 'retail_price_cents' | 'tarp_type' | 'thickness_mil'>,
  rules: PricingRule[],
  opts: PriceOptions = {},
): number {
  const t = priceTiers(product, rules, opts)
  return t.length ? Math.min(...t.map((x) => x.unit_price_cents)) : 0
}
