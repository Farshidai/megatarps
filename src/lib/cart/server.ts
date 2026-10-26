// Server-only data helpers for cart, quick order and checkout. Never import from client components.
import { createClient } from '@/lib/supabase/server'
import { isDemoMode, demoProducts } from '@/lib/demo'
import { getProducts, getPricingRules, PUBLIC_PRODUCT_COLUMNS } from '@/lib/products'
import { toPublicProduct } from '@/lib/catalog'
import { withPriceFloors } from '@/lib/price-floors'
import { priceSchedule, type PriceOptions, type PricingRule } from '@/lib/pricing'
import type { AccountPricing } from '@/lib/accounts'
import type { Product } from '@/types'
import { toCatalogEntry, type CatalogEntry } from './catalog-types'

/**
 * Active products for the given SKUs, loaded server-side (demo-mode safe). Public columns via
 * the session client; the price floor is merged in with the service role (price-floors.ts),
 * so the result is for server-side pricing only.
 */
export async function getProductsBySkus(skus: string[]): Promise<Product[]> {
  const unique = [...new Set(skus)].slice(0, 200)
  if (!unique.length) return []
  if (isDemoMode()) return withPriceFloors(demoProducts.filter((p) => p.active && unique.includes(p.xpose_sku)).map((p) => toPublicProduct(p)))
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`${PUBLIC_PRODUCT_COLUMNS}, product_line:product_lines(weight_oz_per_sqyd)`)
    .in('xpose_sku', unique)
    .eq('active', true)
  if (error) {
    console.error('getProductsBySkus error:', error)
    throw new Error('Could not load products')
  }
  return withPriceFloors((data as unknown as Product[]) ?? [])
}

/** Engine options for a buyer (only approved accounts get account pricing). */
export function priceOptionsFor(account: Pick<AccountPricing, 'status' | 'wholesaleDiscountPercent' | 'contractPrices'> | null | undefined): PriceOptions {
  if (!account || account.status !== 'approved') return {}
  return { accountApproved: true, wholesaleDiscountPercent: account.wholesaleDiscountPercent, contractPrices: account.contractPrices ?? [] }
}

/**
 * Slim catalog for the browser (quick order, cart, pricing API): no cost, no floor. Each
 * entry carries the server-computed price schedule for this buyer.
 */
export async function getCartCatalog(
  skus?: string[],
  account?: Pick<AccountPricing, 'status' | 'wholesaleDiscountPercent' | 'contractPrices'> | null,
  rules?: PricingRule[],
): Promise<CatalogEntry[]> {
  const [products, r] = await Promise.all([skus ? getProductsBySkus(skus) : getProducts(), rules ? Promise.resolve(rules) : getPricingRules()])
  const opts = priceOptionsFor(account)
  return products.map((p) => toCatalogEntry(p, priceSchedule(p, r, opts)))
}

/** Does Stripe have a real key? (placeholder keys → demo checkout) */
export function stripeConfigured(): boolean {
  const k = process.env.STRIPE_SECRET_KEY ?? ''
  return /^sk_(test|live)_/.test(k) && !k.includes('placeholder')
}
