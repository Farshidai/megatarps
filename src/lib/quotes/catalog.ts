// Server-side: catalog → picker list, and SKU resolution for incoming requests.
import { getProducts, getPricingRules } from '@/lib/products'
import { isQuoteOnly } from '@/lib/pricing'
import type { Product } from '@/types'
import type { PickerProduct } from './types'

export function toPicker(p: Product): PickerProduct {
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
    min_unit_price_cents: (p as Product & { min_unit_price_cents?: number | null }).min_unit_price_cents ?? null,
    quote_only: isQuoteOnly(p),
  }
}

export async function getPickerCatalog() {
  const [products, rules] = await Promise.all([getProducts(), getPricingRules()])
  return { products: products.map(toPicker), rules, raw: products }
}
