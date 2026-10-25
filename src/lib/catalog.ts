// Catalog browsing helpers (Team A): display labels, filtering, sorting, faceting
// and job-to-category mapping for the ~250-SKU catalog. Pricing math is NOT here;
// it lives only in src/lib/pricing.ts.
import type { Product } from '@/types'
import { isQuoteOnly, lowestUnitPriceCents, type PricingRule } from '@/lib/pricing'
import { CATEGORY_LABELS } from '@/lib/utils'

/** Product plus the pack columns added by migrations/0002_catalog.sql. */
export type CatalogProduct = Product & {
  units_per_case?: number | null
  pack_quantity?: number | null
  accessory_type?: string | null
  size_label?: string | null
  material?: string | null
}

/** Remove admin-only fields before a product is passed to a client component or JSON-LD. */
export function toPublicProduct<T extends Product>(p: T): T {
  const { cost_price_cents: _cost, ...rest } = p
  void _cost
  return rest as T
}

export const isAccessory = (p: Pick<Product, 'tarp_type'>) => p.tarp_type === 'accessory'
export const isFireRetardant = (p: Product) => Boolean(p.product_line?.fire_retardant)

const GRADES: Record<number, string> = {
  5: 'Multipurpose',
  7: 'Standard Duty',
  10: 'Heavy Duty',
  12: 'Extreme Duty',
  16: 'Super Heavy Duty',
  20: 'Ultra Heavy Duty',
  30: 'Super Heavy Duty',
}

/** "Heavy Duty Tarp", "Canvas Tarp", "Fire Retardant Clear Vinyl Tarp" … */
export function gradeLabel(p: Product): string {
  if (isAccessory(p)) return 'Tarp Accessory'
  const fr = isFireRetardant(p) ? 'Fire Retardant ' : ''
  if (p.tarp_type === 'canvas') return 'Canvas Tarp'
  if (p.tarp_type === 'mesh') return 'Mesh Tarp'
  if (p.tarp_type === 'clear-vinyl') return `${fr}Clear Vinyl Tarp`
  if (fr) return 'Fire Retardant Poly Tarp'
  const g = p.thickness_mil ? GRADES[p.thickness_mil] : null
  return `${g ?? 'Poly'} Tarp`
}

export function dimsLabel(p: Product): string | null {
  if (!p.width_ft || !p.length_ft) return null
  return `${p.width_ft}' x ${p.length_ft}'`
}

/** Spec chip for thickness / weight: "10 Mil", "10 oz", null */
export function gaugeLabel(p: CatalogProduct): string | null {
  if (p.thickness_mil) return `${p.thickness_mil} Mil`
  const w = p.product_line?.weight_oz_per_sqyd
  if (p.tarp_type === 'canvas' && w) return `${Number(w)} oz`
  if (p.tarp_type === 'mesh') return '60% Shade'
  return null
}

/** SEO title, e.g. "30' x 40' Heavy Duty Tarp | 10 Mil | Bulk & Single Units" */
export function seoTitle(p: CatalogProduct): string {
  const quote = isQuoteOnly(p)
  const tail = quote ? 'Wholesale Pricing' : 'Bulk & Single Units'
  if (isAccessory(p)) return `${p.name} | ${tail}`
  const parts = [[dimsLabel(p), gradeLabel(p)].filter(Boolean).join(' '), gaugeLabel(p), tail].filter(Boolean)
  return parts.join(' | ')
}

export function seoDescription(p: CatalogProduct): string {
  const bits: string[] = []
  if (dimsLabel(p)) bits.push(`${dimsLabel(p)} (${p.coverage_sqft.toLocaleString('en-US')} sq ft)`)
  if (gaugeLabel(p)) bits.push(gaugeLabel(p)!)
  if (p.color && p.color !== 'Standard') bits.push(p.color.toLowerCase())
  const head = isAccessory(p) ? p.name : `${gradeLabel(p)}${bits.length ? `, ${bits.join(', ')}` : ''}`
  const price = isQuoteOnly(p)
    ? 'Wholesale pricing by quote for contractors, farms and warehouses.'
    : 'Volume pricing from 5 units, pallet quantities available.'
  return `${head}. ${price} Ships from Kansas City. SKU ${p.xpose_sku}.`
}

// ─── Jobs ("Shop by job") ────────────────────────────────────────────────────
export interface JobDef {
  label: string
  blurb: string
  match: (p: Product) => boolean
}

const inCat = (p: Product, c: string) => p.categories?.includes(c)

/** /products?job=… — Team E's homepage tiles link here. */
export const JOBS: Record<string, JobDef> = {
  roofing: {
    label: 'Roofing',
    blurb: 'Heavy-duty 10–20 mil poly for roof dry-in, leak cover and storm response.',
    match: (p) =>
      (p.tarp_type === 'poly' && (p.thickness_mil ?? 0) >= 10 && inCat(p, 'construction-roofing')) ||
      (isAccessory(p) && inCat(p, 'construction-roofing')),
  },
  construction: {
    label: 'Construction',
    blurb: 'Jobsite covers, enclosures, debris and material protection.',
    match: (p) => inCat(p, 'construction-roofing'),
  },
  agriculture: {
    label: 'Agriculture',
    blurb: 'Hay, grain, equipment and livestock covers that last the season.',
    match: (p) => inCat(p, 'agriculture-farming'),
  },
  warehouse: {
    label: 'Warehouse & Industrial',
    blurb: 'Pallet, inventory and equipment covers; straps and ties for loads.',
    match: (p) => inCat(p, 'industrial-warehouse'),
  },
  scaffolding: {
    label: 'Scaffolding & Enclosures',
    blurb: 'Mesh debris screens, clear vinyl and fire-retardant tarps for scaffold wraps.',
    match: (p) => p.tarp_type === 'mesh' || p.tarp_type === 'clear-vinyl' || isFireRetardant(p),
  },
}

// ─── Filters ────────────────────────────────────────────────────────────────
export const SIZE_RANGES: Record<string, { label: string; min: number; max: number }> = {
  small: { label: 'Small (under 100 sq ft)', min: 1, max: 99 },
  medium: { label: 'Medium (100–399 sq ft)', min: 100, max: 399 },
  large: { label: 'Large (400–1,199 sq ft)', min: 400, max: 1199 },
  xl: { label: 'XL (1,200+ sq ft)', min: 1200, max: Infinity },
}

export const TYPE_OPTIONS: Record<string, string> = {
  poly: 'Poly',
  canvas: 'Canvas',
  mesh: 'Mesh',
  'clear-vinyl': 'Clear Vinyl',
  'fire-retardant': 'Fire Retardant',
  accessory: 'Accessories',
}

export const SORTS: Record<string, string> = {
  featured: 'Featured',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  'size-asc': 'Size: small to large',
  'size-desc': 'Size: large to small',
  'mil-desc': 'Thickest first',
}

export interface CatalogQuery {
  q?: string
  category?: string
  job?: string
  type?: string
  thickness?: string
  size?: string
  color?: string
  price?: string // 'priced' | 'quote'
  stock?: string // 'in'
  sort?: string
  page?: string
}

export const FILTER_KEYS = ['q', 'category', 'job', 'type', 'thickness', 'size', 'color', 'price', 'stock'] as const

function matchesType(p: Product, type: string) {
  if (type === 'fire-retardant') return isFireRetardant(p)
  return p.tarp_type === type
}

/** Apply every filter except `skip` (used to compute facet counts). */
export function filterProducts(products: Product[], f: CatalogQuery, skip?: keyof CatalogQuery): Product[] {
  const q = f.q?.trim().toLowerCase()
  const job = f.job ? JOBS[f.job] : undefined
  const size = f.size ? SIZE_RANGES[f.size] : undefined
  const mil = f.thickness ? Number(f.thickness) : undefined
  return products.filter((p) => {
    if (skip !== 'q' && q && !`${p.name} ${p.xpose_sku} ${p.color}`.toLowerCase().includes(q)) return false
    if (skip !== 'category' && f.category && !p.categories?.includes(f.category)) return false
    if (skip !== 'job' && job && !job.match(p)) return false
    if (skip !== 'type' && f.type && !matchesType(p, f.type)) return false
    if (skip !== 'thickness' && mil && p.thickness_mil !== mil) return false
    if (skip !== 'size' && size && (p.coverage_sqft < size.min || p.coverage_sqft > size.max)) return false
    if (skip !== 'color' && f.color && p.color.toLowerCase() !== f.color.toLowerCase()) return false
    if (skip !== 'price' && f.price === 'priced' && isQuoteOnly(p)) return false
    if (skip !== 'price' && f.price === 'quote' && !isQuoteOnly(p)) return false
    if (skip !== 'stock' && f.stock === 'in' && !p.in_stock) return false
    return true
  })
}

export function sortProducts(products: Product[], sort: string | undefined, rules: PricingRule[]): Product[] {
  const price = (p: Product) => (isQuoteOnly(p) ? null : lowestUnitPriceCents(p, rules))
  const byPrice = (dir: 1 | -1) => (a: Product, b: Product) => {
    const pa = price(a), pb = price(b)
    if (pa == null && pb == null) return a.coverage_sqft - b.coverage_sqft
    if (pa == null) return 1 // quote-only always last
    if (pb == null) return -1
    return (pa - pb) * dir
  }
  const list = [...products]
  switch (sort) {
    case 'price-asc': return list.sort(byPrice(1))
    case 'price-desc': return list.sort(byPrice(-1))
    case 'size-asc': return list.sort((a, b) => a.coverage_sqft - b.coverage_sqft || (a.thickness_mil ?? 0) - (b.thickness_mil ?? 0))
    case 'size-desc': return list.sort((a, b) => b.coverage_sqft - a.coverage_sqft || (b.thickness_mil ?? 0) - (a.thickness_mil ?? 0))
    case 'mil-desc': return list.sort((a, b) => (b.thickness_mil ?? 0) - (a.thickness_mil ?? 0) || a.coverage_sqft - b.coverage_sqft)
    default: {
      // Featured: buyable items with photos first, then photos, then the rest; tarps before accessories.
      const rank = (p: Product) =>
        (isQuoteOnly(p) ? 2 : 0) + (p.image_urls?.length ? 0 : 1) + (isAccessory(p) ? 4 : 0)
      return list.sort((a, b) => rank(a) - rank(b) || (a.thickness_mil ?? 0) - (b.thickness_mil ?? 0) || a.coverage_sqft - b.coverage_sqft)
    }
  }
}

export interface Facet { value: string; label: string; count: number }

export function facets(all: Product[], f: CatalogQuery) {
  const count = (key: keyof CatalogQuery, values: Array<[string, string]>, pred: (p: Product, v: string) => boolean): Facet[] => {
    const base = filterProducts(all, f, key)
    return values.map(([value, label]) => ({ value, label, count: base.filter((p) => pred(p, value)).length }))
  }
  const mils = [...new Set(all.map((p) => p.thickness_mil).filter((m): m is number => !!m))].sort((a, b) => a - b)
  const colors = [...new Map(all.filter((p) => p.color && p.color !== 'Standard').map((p) => [p.color.toLowerCase(), p])).values()]
    .sort((a, b) => a.color.localeCompare(b.color))
  return {
    category: count('category', Object.entries(CATEGORY_LABELS), (p, v) => p.categories?.includes(v)),
    job: count('job', Object.entries(JOBS).map(([k, j]) => [k, j.label]), (p, v) => JOBS[v].match(p)),
    type: count('type', Object.entries(TYPE_OPTIONS), matchesType),
    thickness: count('thickness', mils.map((m) => [String(m), `${m} Mil${GRADES[m] ? ` · ${GRADES[m]}` : ''}`]), (p, v) => p.thickness_mil === Number(v)),
    size: count('size', Object.entries(SIZE_RANGES).map(([k, s]) => [k, s.label]), (p, v) => p.coverage_sqft >= SIZE_RANGES[v].min && p.coverage_sqft <= SIZE_RANGES[v].max),
    color: count('color', colors.map((p) => [p.color.toLowerCase(), p.color]), (p, v) => p.color.toLowerCase() === v),
    price: count('price', [['priced', 'Priced online'], ['quote', 'Quote only']], (p, v) => (v === 'quote') === isQuoteOnly(p)),
    colorHex: Object.fromEntries(colors.map((p) => [p.color.toLowerCase(), p.color_hex ?? '#94a3b8'])) as Record<string, string>,
  }
}

/** Build a listing URL from the current query plus a patch (null removes a key). Resets paging unless `page` is patched. */
export function catalogHref(basePath: string, current: CatalogQuery, patch: Partial<Record<keyof CatalogQuery, string | null>>): string {
  const params = new URLSearchParams()
  const merged: Record<string, string | null | undefined> = { ...current, page: undefined, ...patch }
  for (const [k, v] of Object.entries(merged)) {
    if (v == null || v === '') continue
    if (k === 'sort' && v === 'featured') continue
    if (k === 'page' && v === '1') continue
    params.set(k, v)
  }
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

/** Keep only known, string-valued query params. */
export function parseCatalogQuery(sp: Record<string, string | string[] | undefined>): CatalogQuery {
  const out: CatalogQuery = {}
  for (const k of [...FILTER_KEYS, 'sort', 'page'] as const) {
    const v = sp[k]
    const s = Array.isArray(v) ? v[0] : v
    if (s) out[k] = s.slice(0, 80)
  }
  if (out.job && !JOBS[out.job]) delete out.job
  if (out.category && !CATEGORY_LABELS[out.category]) delete out.category
  if (out.size && !SIZE_RANGES[out.size]) delete out.size
  if (out.type && !TYPE_OPTIONS[out.type]) delete out.type
  if (out.sort && !SORTS[out.sort]) delete out.sort
  return out
}
