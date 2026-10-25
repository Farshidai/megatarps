// Slim product shape sent to the browser for cart / quick-order pricing display.
// Safe to import from client components (no cost data).
import type { Product } from '@/types'
import type { CartItem } from './types'
import { productWeightLb } from '@/lib/freight'

export interface CatalogEntry {
  id: string
  sku: string
  slug: string
  name: string
  image?: string
  retail_price_cents: number
  tarp_type: string
  thickness_mil: number | null
  width_ft: number
  length_ft: number
  color: string
  in_stock: boolean
  quote_only: boolean
  units_per_case: number | null
  units_per_half_pallet: number | null
  units_per_full_pallet: number | null
  /** ship weight per unit in lb (null = unknown → freight quote) */
  unit_weight_lb: number | null
}

export function toCatalogEntry(p: Product): CatalogEntry {
  const extra = p as Product & { units_per_case?: number | null }
  return {
    id: p.id,
    sku: p.xpose_sku,
    slug: p.slug,
    name: p.name,
    image: p.image_urls?.[0],
    retail_price_cents: p.retail_price_cents ?? 0,
    tarp_type: p.tarp_type,
    thickness_mil: p.thickness_mil,
    width_ft: p.width_ft,
    length_ft: p.length_ft,
    color: p.color,
    in_stock: p.in_stock,
    quote_only: !p.retail_price_cents || p.retail_price_cents <= 0,
    units_per_case: extra.units_per_case ?? null,
    units_per_half_pallet: p.units_per_half_pallet ?? null,
    units_per_full_pallet: p.units_per_full_pallet ?? null,
    unit_weight_lb: productWeightLb(p as Parameters<typeof productWeightLb>[0]),
  }
}

export function cartItemFromEntry(e: CatalogEntry, quantity: number): CartItem {
  return {
    sku: e.sku,
    product_id: e.id,
    slug: e.slug,
    name: e.name,
    image: e.image,
    quantity,
    quote_only: e.quote_only,
  }
}
