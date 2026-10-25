// Server-only data helpers for cart, quick order and checkout. Never import from client components.
import { createClient } from '@/lib/supabase/server'
import { isDemoMode, demoProducts } from '@/lib/demo'
import { getProducts, PUBLIC_PRODUCT_COLUMNS } from '@/lib/products'
import type { Product } from '@/types'
import { toCatalogEntry, type CatalogEntry } from './catalog-types'

/** Active products for the given SKUs, loaded server-side (demo-mode safe). */
export async function getProductsBySkus(skus: string[]): Promise<Product[]> {
  const unique = [...new Set(skus)].slice(0, 200)
  if (!unique.length) return []
  if (isDemoMode()) return demoProducts.filter((p) => p.active && unique.includes(p.xpose_sku))
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
  return (data as unknown as Product[]) ?? []
}

/** Slim catalog for quick order autocomplete and client-side price display. */
export async function getCartCatalog(skus?: string[]): Promise<CatalogEntry[]> {
  const products = skus ? await getProductsBySkus(skus) : await getProducts()
  return products.map(toCatalogEntry)
}

/** Does Stripe have a real key? (placeholder keys → demo checkout) */
export function stripeConfigured(): boolean {
  const k = process.env.STRIPE_SECRET_KEY ?? ''
  return /^sk_(test|live)_/.test(k) && !k.includes('placeholder')
}
