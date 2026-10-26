import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/types'
import type { PricingRule } from '@/lib/pricing'
import { isDemoMode, demoProducts as demoRows, demoPricingRules } from '@/lib/demo'
import { toPublicProduct } from '@/lib/catalog'
import { withPriceFloors } from '@/lib/price-floors'

// Public (anon/authenticated) roles may only read these columns — cost, market data and the
// price floor (min_unit_price_cents ≈ cost × 1.15) are revoked at the database level
// (supabase/migrations/0099_column_privileges.sql). Keep this list in sync with that migration.
//
// Products returned by the getters below carry min_unit_price_cents loaded with the
// SERVICE ROLE (src/lib/price-floors.ts) so server code prices correctly. Never pass them to
// a client component as-is: use toPublicProduct() (strips the floor) or a price schedule.
export const PUBLIC_PRODUCT_COLUMNS = [
  'id', 'xpose_sku', 'mega_sku', 'name', 'slug', 'product_line_id', 'categories', 'tarp_type',
  'thickness_mil', 'width_ft', 'length_ft', 'coverage_sqft', 'color', 'color_hex',
  'retail_price_cents', 'units_per_half_pallet', 'units_per_full_pallet', 'units_per_case',
  'pack_quantity', 'accessory_type', 'size_label', 'material', 'image_urls', 'active',
  'in_stock', 'created_at', 'updated_at', 'shipping_weight_lb',
].join(', ')
const PRODUCT_SELECT = `${PUBLIC_PRODUCT_COLUMNS}, product_line:product_lines(*)`
// Demo rows hold every column (cost, floor, market); expose only the public shape, as the DB would.
const demoProducts: Product[] = demoRows.map((p) => toPublicProduct(p))

export const PUBLIC_RULE_COLUMNS =
  'id, tarp_type, thickness_mil, min_quantity, max_quantity, discount_from_retail_percent, priority, active, unit, price_multiplier, requires_account, label'

/** Active volume pricing rules (tier table source). */
export async function getPricingRules(): Promise<PricingRule[]> {
  if (isDemoMode()) return demoPricingRules
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pricing_rules')
    .select(PUBLIC_RULE_COLUMNS)
    .eq('active', true)
    .order('min_quantity', { ascending: true })
  if (error) {
    console.error('getPricingRules error:', error)
    return []
  }
  return (data as PricingRule[]) ?? []
}

export async function getProducts(filters?: {
  category?: string
  tarp_type?: string
  thickness_mil?: number
  width_ft?: number
  length_ft?: number
  active?: boolean
}): Promise<Product[]> {
  if (isDemoMode()) {
    return withPriceFloors(demoProducts.filter((p) =>
      p.active === (filters?.active ?? true) &&
      (!filters?.category || p.categories.includes(filters.category)) &&
      (!filters?.tarp_type || p.tarp_type === filters.tarp_type) &&
      (!filters?.thickness_mil || p.thickness_mil === filters.thickness_mil) &&
      (!filters?.width_ft || p.width_ft === filters.width_ft) &&
      (!filters?.length_ft || p.length_ft === filters.length_ft)))
  }
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('active', filters?.active ?? true)
    .order('width_ft', { ascending: true })
    .order('length_ft', { ascending: true })

  if (filters?.category) {
    query = query.contains('categories', [filters.category])
  }
  if (filters?.tarp_type) {
    query = query.eq('tarp_type', filters.tarp_type)
  }
  if (filters?.thickness_mil) {
    query = query.eq('thickness_mil', filters.thickness_mil)
  }
  if (filters?.width_ft) {
    query = query.eq('width_ft', filters.width_ft)
  }
  if (filters?.length_ft) {
    query = query.eq('length_ft', filters.length_ft)
  }

  const { data, error } = await query

  if (error) {
    console.error('getProducts error:', error)
    return []
  }

  return withPriceFloors((data as unknown as Product[]) ?? [])
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isDemoMode()) {
    const p = demoProducts.find((x) => x.slug === slug && x.active)
    return p ? (await withPriceFloors([p]))[0] : null
  }
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (error || !data) return null
  return (await withPriceFloors([data as unknown as Product]))[0]
}

export async function getProductBySku(sku: string): Promise<Product | null> {
  if (isDemoMode()) {
    const p = demoProducts.find((x) => x.xpose_sku === sku)
    return p ? (await withPriceFloors([p]))[0] : null
  }
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('xpose_sku', sku)
    .single()

  if (error || !data) return null
  return (await withPriceFloors([data as unknown as Product]))[0]
}

// Contractor best sellers (CONFIRM with real sales data): most-ordered sizes first.
const FEATURED_SIZES = ['20x30', '30x40', '20x20', '16x20', '30x50', '40x60', '15x30', '12x16', '10x12', '20x40']

/**
 * Home "featured": products a visitor can actually BUY online — priced, active, in stock —
 * preferring pallet-priced 7- and 10-mil best-selling sizes, one per size + mil, single
 * tarps before pallet-pack SKUs. Never the big quote-only listings.
 */
export function rankFeatured(products: Product[], limit = 8): Product[] {
  const size = (p: Product) => `${Math.min(p.width_ft, p.length_ft)}x${Math.max(p.width_ft, p.length_ft)}`
  const pack = (p: Product) => Number((p as Product & { pack_quantity?: number | null }).pack_quantity ?? 1) > 1
  const score = (p: Product) => {
    const s = FEATURED_SIZES.indexOf(size(p))
    return (p.units_per_full_pallet ? 0 : 1000) + ([7, 10].includes(p.thickness_mil ?? 0) ? 0 : 500) + (pack(p) ? 200 : 0) + (p.image_urls?.length ? 0 : 50) + (s >= 0 ? s : 100)
  }
  const out: Product[] = []
  const seen = new Set<string>()
  for (const p of products.filter((x) => x.active && x.in_stock && x.retail_price_cents > 0).sort((a, b) => score(a) - score(b) || a.retail_price_cents - b.retail_price_cents)) {
    const key = `${size(p)}-${p.thickness_mil}-${pack(p)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(p)
    if (out.length === limit) break
  }
  return out
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  if (isDemoMode()) return withPriceFloors(rankFeatured(demoProducts, limit))
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('active', true)
    .eq('in_stock', true)
    .gt('retail_price_cents', 0)
    .limit(500)

  return withPriceFloors(rankFeatured((data as unknown as Product[]) ?? [], limit))
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  if (isDemoMode()) {
    return withPriceFloors(demoProducts.filter((p) => p.active && p.product_line_id === product.product_line_id && p.id !== product.id).slice(0, limit))
  }
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('active', true)
    .eq('product_line_id', product.product_line_id)
    .neq('id', product.id)
    .limit(limit)

  return withPriceFloors((data as unknown as Product[]) ?? [])
}

// For AI agent — returns lightweight product data
export async function getProductsForAI(): Promise<object[]> {
  if (isDemoMode()) return demoProducts.filter((p) => p.active) // already public (no cost / floor / market)
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select(`
      xpose_sku, name, tarp_type, thickness_mil,
      width_ft, length_ft, coverage_sqft,
      color, retail_price_cents, in_stock,
      categories,
      product_line:product_lines(
        name, material, grommet_type, grommet_spacing_inches,
        uv_resistant, waterproof, mildew_resistant, fire_retardant,
        reinforced_corners, description
      )
    `)
    .eq('active', true)
    .order('thickness_mil', { ascending: true })
    .order('coverage_sqft', { ascending: true })

  return data ?? []
}
