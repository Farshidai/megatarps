// Single source of truth for wholesale tier pricing.
// Used by: product pages (tier table), product cards, cart, checkout API (server-side
// re-pricing — never trust client prices), quotes.
//
// Two kinds of rules live in `pricing_rules`:
//  • unit = 'each' (default): piece-volume tiers, "% off retail for qty min–max" (unchanged behaviour).
//  • unit = 'pallet': "N full pallets of THIS product" (qty ≥ N × units_per_full_pallet) →
//    unit price = retail × price_multiplier. Usually requires_account = true, so they apply only
//    when opts.accountApproved is true (getAccountPricing().status === 'approved').
// A product that has pallet pricing (units_per_full_pallet set AND at least one pallet rule
// applies) is priced pallet-first: 'each' volume tiers are NOT applied to it, so a guest
// buying 100 pieces can't undercut an approved account's pallet price.
// Every price is clamped to the product's min_unit_price_cents (cost floor) when set,
// and never above retail.
import type { Product } from '@/types'

export type RuleUnit = 'each' | 'pallet'

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
  /** 'each' (default) = pieces; 'pallet' = min/max_quantity count FULL pallets of the product */
  unit?: RuleUnit | null
  /** Pallet rules: unit price = retail × price_multiplier (e.g. 0.90 / 0.95). */
  price_multiplier?: number | string | null
  /** Only for approved wholesale accounts. */
  requires_account?: boolean | null
  label?: string | null
}

export interface PriceTier {
  min_quantity: number
  max_quantity: number | null
  discount_percent: number
  unit_price_cents: number
  label: string // e.g. "5–9", "100+"
}

export interface PalletTier {
  pallets: number // N+ full pallets
  min_quantity: number // N × units_per_full_pallet
  units_per_pallet: number
  unit_price_cents: number
  pallet_total_cents: number // one full pallet at this tier's unit price
  discount_percent: number // vs guest/retail price
  requires_account: boolean
  label: string // "1 pallet", "2+ pallets"
}

export interface PriceOptions {
  /** Extra % off for approved wholesale accounts, applied on top of the tier. */
  wholesaleDiscountPercent?: number
  /** Approved wholesale account: unlocks rules with requires_account = true (pallet tiers). */
  accountApproved?: boolean
}

/** Fields the engine reads. Pallet/floor fields are optional so existing callers keep working. */
export type PricedProduct = Pick<Product, 'retail_price_cents' | 'tarp_type' | 'thickness_mil'> & {
  units_per_full_pallet?: number | null
  /** Hard floor per unit (e.g. cost × 1.15). Ignored when null/0. */
  min_unit_price_cents?: number | null
}

/** A product with no retail price can only be quoted, never bought online. */
export function isQuoteOnly(product: Pick<Product, 'retail_price_cents'>): boolean {
  return !product.retail_price_cents || product.retail_price_cents <= 0
}

const unitOf = (r: PricingRule): RuleUnit => (r.unit === 'pallet' ? 'pallet' : 'each')

function ruleApplies(rule: PricingRule, product: Pick<Product, 'tarp_type' | 'thickness_mil'>) {
  if (rule.active === false) return false
  if (rule.tarp_type && rule.tarp_type !== product.tarp_type) return false
  if (rule.thickness_mil && rule.thickness_mil !== product.thickness_mil) return false
  return true
}

function dedupe(rules: PricingRule[]): PricingRule[] {
  const byMin = new Map<number, PricingRule>()
  const score = (r: PricingRule) => (r.priority ?? 0) * 10 + (r.tarp_type ? 2 : 0) + (r.thickness_mil ? 1 : 0)
  for (const r of rules) {
    const cur = byMin.get(r.min_quantity)
    if (!cur || score(r) > score(cur)) byMin.set(r.min_quantity, r)
  }
  return [...byMin.values()].sort((a, b) => a.min_quantity - b.min_quantity)
}

/** 'each' (piece-volume) rules that apply to this product, de-duplicated per min_quantity (highest priority / most specific wins). */
export function applicableRules(product: Pick<Product, 'tarp_type' | 'thickness_mil'>, rules: PricingRule[]): PricingRule[] {
  return dedupe(rules.filter((r) => unitOf(r) === 'each' && ruleApplies(r, product)))
}

/** Pallet rules that apply to this product (empty unless it has units_per_full_pallet). */
export function applicablePalletRules(product: PricedProduct, rules: PricingRule[]): PricingRule[] {
  if (!product.units_per_full_pallet || product.units_per_full_pallet <= 0) return []
  return dedupe(rules.filter((r) => unitOf(r) === 'pallet' && ruleApplies(r, product)))
}

/** True when the product is priced pallet-first (piece-volume tiers switched off). */
export function hasPalletPricing(product: PricedProduct, rules: PricingRule[]): boolean {
  return applicablePalletRules(product, rules).length > 0
}

export function discountForQuantity(product: PricedProduct, qty: number, rules: PricingRule[]): number {
  if (hasPalletPricing(product, rules)) return 0
  let d = 0
  for (const r of applicableRules(product, rules)) {
    if (qty >= r.min_quantity && (r.max_quantity == null || qty <= r.max_quantity)) d = Number(r.discount_from_retail_percent ?? 0)
  }
  return d
}

function multiplierOf(r: PricingRule): number {
  const m = r.price_multiplier != null ? Number(r.price_multiplier) : 1 - Number(r.discount_from_retail_percent ?? 0) / 100
  return Number.isFinite(m) && m > 0 && m <= 1 ? m : 1
}

function palletMultiplier(product: PricedProduct, qty: number, rules: PricingRule[], opts: PriceOptions): number {
  const per = product.units_per_full_pallet ?? 0
  if (per <= 0) return 1
  const pallets = Math.floor(qty / per)
  let m = 1
  for (const r of applicablePalletRules(product, rules)) {
    if (r.requires_account !== false && !opts.accountApproved) continue
    if (pallets >= r.min_quantity && (r.max_quantity == null || pallets <= r.max_quantity)) m = multiplierOf(r)
  }
  return m
}

function clamp(product: PricedProduct, cents: number): number {
  const floor = product.min_unit_price_cents ?? 0
  const out = floor > 0 ? Math.max(cents, floor) : cents
  return Math.min(out, product.retail_price_cents)
}

/** Unit price in cents for a quantity. Returns 0 for quote-only products. */
export function unitPriceCents(product: PricedProduct, qty: number, rules: PricingRule[], opts: PriceOptions = {}): number {
  if (isQuoteOnly(product)) return 0
  const volume = discountForQuantity(product, qty, rules)
  const pallet = palletMultiplier(product, qty, rules, opts)
  const wholesale = opts.wholesaleDiscountPercent ?? 0
  const price = product.retail_price_cents * (1 - volume / 100) * pallet * (1 - wholesale / 100)
  return clamp(product, Math.round(price))
}

export function lineTotalCents(product: PricedProduct, qty: number, rules: PricingRule[], opts: PriceOptions = {}): number {
  return unitPriceCents(product, qty, rules, opts) * qty
}

/** Piece-volume tier table for display: 1-unit row plus one row per 'each' rule (single row for pallet-priced products). */
export function priceTiers(product: PricedProduct, rules: PricingRule[], opts: PriceOptions = {}): PriceTier[] {
  if (isQuoteOnly(product)) return []
  const rs = hasPalletPricing(product, rules) ? [] : applicableRules(product, rules)
  const firstMin = rs[0]?.min_quantity ?? Infinity
  const tiers: PriceTier[] = []
  const guest = { ...opts, accountApproved: false } // piece tiers never include account-only pallet pricing
  if (firstMin > 1) {
    tiers.push({
      min_quantity: 1,
      max_quantity: Number.isFinite(firstMin) ? firstMin - 1 : null,
      discount_percent: 0,
      unit_price_cents: unitPriceCents(product, 1, rules, guest),
      label: Number.isFinite(firstMin) ? (firstMin - 1 === 1 ? '1' : `1–${firstMin - 1}`) : '1+',
    })
  }
  for (const r of rs) {
    tiers.push({
      min_quantity: r.min_quantity,
      max_quantity: r.max_quantity,
      discount_percent: Number(r.discount_from_retail_percent ?? 0),
      unit_price_cents: unitPriceCents(product, r.min_quantity, rules, guest),
      label: r.max_quantity == null ? `${r.min_quantity}+` : `${r.min_quantity}–${r.max_quantity}`,
    })
  }
  return tiers
}

/** Pallet tiers as an approved account would pay them (for display; guests see them locked). */
export function palletTiers(product: PricedProduct, rules: PricingRule[], opts: PriceOptions = {}): PalletTier[] {
  if (isQuoteOnly(product)) return []
  const per = product.units_per_full_pallet ?? 0
  return applicablePalletRules(product, rules).map((r) => {
    const min = r.min_quantity * per
    const unit = unitPriceCents(product, min, rules, { ...opts, accountApproved: true })
    return {
      pallets: r.min_quantity,
      min_quantity: min,
      units_per_pallet: per,
      unit_price_cents: unit,
      pallet_total_cents: unit * per,
      discount_percent: Math.round((1 - unit / product.retail_price_cents) * 1000) / 10,
      requires_account: r.requires_account !== false,
      label: r.label ?? (r.min_quantity === 1 ? '1 pallet' : `${r.min_quantity}+ pallets`),
    }
  })
}

/** Lowest unit price a guest can get (best piece tier) — for "as low as $X" on cards. */
export function lowestUnitPriceCents(product: PricedProduct, rules: PricingRule[], opts: PriceOptions = {}): number {
  const t = priceTiers(product, rules, opts)
  return t.length ? Math.min(...t.map((x) => x.unit_price_cents)) : 0
}
