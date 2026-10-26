// Server-side: catalog → picker list, and SKU resolution for incoming requests.
import { getProducts, getPricingRules } from '@/lib/products'
import { isQuoteOnly, priceSchedule, type PriceOptions, type PricingRule } from '@/lib/pricing'
import type { Product } from '@/types'
import type { PickerProduct } from './types'

/**
 * Picker row. Storefront (bulk-quote form): `prices` = server-computed schedule, NO floor.
 * Admin quote builder: pass { admin: true } to include min_unit_price_cents (admin-only page).
 */
export function toPicker(p: Product, opts: { admin?: boolean; rules?: PricingRule[]; price?: PriceOptions } = {}): PickerProduct {
  return {
    id: p.id,
    sku: p.xpose_sku,
    name: p.name,
    slug: p.slug,
    size: p.width_ft && p.length_ft ? `${p.width_ft}x${p.length_ft}` : '',
    tarp_type: p.tarp_type,
    thickness_mil: p.thickness_mil,
    retail_price_cents: p.retail_price_cents,
    units_per_full_pallet: p.units_per_full_pallet,
    ...(opts.admin ? { min_unit_price_cents: (p as Product & { min_unit_price_cents?: number | null }).min_unit_price_cents ?? null } : {}),
    ...(opts.rules ? { prices: priceSchedule(p, opts.rules, opts.price ?? {}) } : {}),
    quote_only: isQuoteOnly(p),
  }
}

/** Admin quote builder catalog (includes the floor; admin pages only). */
export async function getPickerCatalog() {
  const [products, rules] = await Promise.all([getProducts(), getPricingRules()])
  return { products: products.map((p) => toPicker(p, { admin: true })), rules, raw: products }
}

/** Storefront quote form catalog: price schedules for this buyer, no floor / cost. */
export async function getPublicPickerCatalog(price: PriceOptions = {}) {
  const [products, rules] = await Promise.all([getProducts(), getPricingRules()])
  return { products: products.map((p) => toPicker(p, { rules, price })) }
}
