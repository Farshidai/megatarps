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
//
// Client contract prices (table contract_prices, migration 0008): for an APPROVED account,
// the unit price is the LOWER of the normal tier price and the contract price whose
// min_quantity is the highest one ≤ qty. The contract price deliberately ignores
// min_unit_price_cents (Farshid negotiated it), but is never ≤ 0 and never applies to
// quote-only products. Pass them via opts.contractPrices (server: getAccountPricing()).
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

/** A client's negotiated unit price for one product (row of contract_prices, storefront columns only). */
export interface ContractPrice {
  id?: string
  product_id: string | null
  sku: string
  unit_price_cents: number
  /** applies when qty ≥ min_quantity (default 1) */
  min_quantity: number
  /** YYYY-MM-DD, valid through the end of that day; null = no end date */
  valid_until: string | null
  source_quote_id?: string | null
}

export interface PriceOptions {
  /** Extra % off for approved wholesale accounts, applied on top of the tier. */
  wholesaleDiscountPercent?: number
  /** Approved wholesale account: unlocks rules with requires_account = true (pallet tiers). */
  accountApproved?: boolean
  /** The signed-in approved account's contract prices. Ignored unless accountApproved. */
  contractPrices?: ContractPrice[] | null
  /** "Today" as YYYY-MM-DD for contract expiry (tests); defaults to the current UTC date. */
  today?: string
}

/** Fields the engine reads. Pallet/floor fields are optional so existing callers keep working. */
export type PricedProduct = Pick<Product, 'retail_price_cents' | 'tarp_type' | 'thickness_mil'> & {
  units_per_full_pallet?: number | null
  /** Hard floor per unit (e.g. cost × 1.15). Ignored when null/0. */
  min_unit_price_cents?: number | null
  /** Identity, used only to match contract prices (Product: id + xpose_sku; cart entries: id + sku). */
  id?: string | null
  xpose_sku?: string | null
  sku?: string | null
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

/** Normal (non-contract) unit price: tiers + pallet + wholesale %, clamped to floor and retail. */
function tierUnitPriceCents(product: PricedProduct, qty: number, rules: PricingRule[], opts: PriceOptions): number {
  const volume = discountForQuantity(product, qty, rules)
  const pallet = palletMultiplier(product, qty, rules, opts)
  const wholesale = opts.wholesaleDiscountPercent ?? 0
  const price = product.retail_price_cents * (1 - volume / 100) * pallet * (1 - wholesale / 100)
  return clamp(product, Math.round(price))
}

const todayUtc = () => new Date().toISOString().slice(0, 10)

/** True when the contract row has not expired (valid through the end of valid_until). */
export function isContractActive(c: Pick<ContractPrice, 'valid_until'>, today = todayUtc()): boolean {
  return !c.valid_until || String(c.valid_until).slice(0, 10) >= today
}

function matchesProduct(c: ContractPrice, product: PricedProduct): boolean {
  if (c.product_id && product.id && c.product_id === product.id) return true
  const sku = (product.xpose_sku ?? product.sku ?? '').toLowerCase()
  return !!sku && !!c.sku && c.sku.toLowerCase() === sku
}

/** Active contract rows for this product, sorted by min_quantity. */
export function contractPricesFor(product: PricedProduct, contractPrices: ContractPrice[] | null | undefined, today = todayUtc()): ContractPrice[] {
  if (!contractPrices?.length) return []
  return contractPrices
    .filter((c) => matchesProduct(c, product) && isContractActive(c, today) && Number.isInteger(c.unit_price_cents) && c.unit_price_cents > 0)
    .sort((a, b) => (a.min_quantity || 1) - (b.min_quantity || 1))
}

/**
 * The contract unit price for qty: the row with the highest min_quantity ≤ qty.
 * Null when there is none (or the product is quote-only). Never returns ≤ 0.
 * Does NOT compare with the tier price; unitPriceCents() takes the lower of the two.
 */
export function contractUnitPriceCents(product: PricedProduct, qty: number, contractPrices: ContractPrice[] | null | undefined, today = todayUtc()): number | null {
  if (isQuoteOnly(product)) return null
  let best: ContractPrice | null = null
  for (const c of contractPricesFor(product, contractPrices, today)) if (qty >= (c.min_quantity || 1)) best = c
  return best ? best.unit_price_cents : null
}

/** Unit price in cents for a quantity. Returns 0 for quote-only products. */
export function unitPriceCents(product: PricedProduct, qty: number, rules: PricingRule[], opts: PriceOptions = {}): number {
  if (isQuoteOnly(product)) return 0
  const normal = tierUnitPriceCents(product, qty, rules, opts)
  if (!opts.accountApproved || !opts.contractPrices?.length) return normal
  const contract = contractUnitPriceCents(product, qty, opts.contractPrices, opts.today)
  return contract != null && contract > 0 && contract < normal ? contract : normal
}

/** True when unitPriceCents() for this qty comes from the account's contract price. */
export function isContractPriced(product: PricedProduct, qty: number, rules: PricingRule[], opts: PriceOptions = {}): boolean {
  if (isQuoteOnly(product) || !opts.accountApproved || !opts.contractPrices?.length) return false
  const contract = contractUnitPriceCents(product, qty, opts.contractPrices, opts.today)
  return contract != null && contract < tierUnitPriceCents(product, qty, rules, opts)
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
    const unit = unitPriceCents(product, min, rules, { ...opts, accountApproved: true, contractPrices: null })
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

// ---------------------------------------------------------------- price schedules
// The browser never receives min_unit_price_cents (it would reveal cost ≈ floor ÷ 1.15).
// Instead the SERVER runs this engine and sends, per SKU, the unit price at every quantity
// where the price can change ("breakpoints"). Between breakpoints the price is constant, so
// the browser can show the exact server price for any quantity with a table lookup
// (src/lib/price-schedule.ts) — no floor, no engine on the client.

/** Unit price from `min_quantity` up to the next point's min_quantity − 1. */
export interface PricePoint {
  min_quantity: number
  unit_price_cents: number
  /** the price at this quantity is the account's contract price */
  contract?: boolean
}

/** Every quantity at which unitPriceCents() can change for this product + account. */
export function priceBreakpoints(product: PricedProduct, rules: PricingRule[], opts: PriceOptions = {}): number[] {
  const qs = new Set<number>([1])
  const add = (n: number | null | undefined) => {
    if (n != null && Number.isFinite(n) && n >= 1) qs.add(Math.floor(n))
  }
  if (!hasPalletPricing(product, rules)) {
    for (const r of applicableRules(product, rules)) {
      add(r.min_quantity)
      if (r.max_quantity != null) add(r.max_quantity + 1)
    }
  }
  const per = product.units_per_full_pallet ?? 0
  if (per > 0) {
    for (const r of applicablePalletRules(product, rules)) {
      add(r.min_quantity * per)
      if (r.max_quantity != null) add((r.max_quantity + 1) * per)
    }
  }
  if (opts.accountApproved) for (const c of contractPricesFor(product, opts.contractPrices, opts.today)) add(c.min_quantity || 1)
  return [...qs].sort((a, b) => a - b)
}

/**
 * Server-side: the exact unit price at each breakpoint for this buyer (rules + account +
 * contract prices + floor). Consecutive identical points are merged. Empty for quote-only.
 */
export function priceSchedule(product: PricedProduct, rules: PricingRule[], opts: PriceOptions = {}): PricePoint[] {
  if (isQuoteOnly(product)) return []
  const out: PricePoint[] = []
  for (const q of priceBreakpoints(product, rules, opts)) {
    const unit = unitPriceCents(product, q, rules, opts)
    const contract = isContractPriced(product, q, rules, opts)
    const prev = out[out.length - 1]
    if (prev && prev.unit_price_cents === unit && !!prev.contract === contract) continue
    out.push(contract ? { min_quantity: q, unit_price_cents: unit, contract: true } : { min_quantity: q, unit_price_cents: unit })
  }
  return out
}
