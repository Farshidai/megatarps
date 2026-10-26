import Link from 'next/link'
import { SlidersHorizontal, ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react'
import { getPricingRules, getProducts } from '@/lib/products'
import { isQuoteOnly } from '@/lib/pricing'
import {
  catalogHref, facets as buildFacets, filterProducts, sortProducts, JOBS, SIZE_RANGES, TYPE_OPTIONS, SORTS,
  type CatalogQuery,
} from '@/lib/catalog'
import { CATEGORY_LABELS } from '@/lib/utils'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductFilters } from '@/components/products/ProductFilters'
import { SortSelect } from '@/components/products/SortSelect'
import { MobileFilterDrawer } from '@/components/products/MobileFilterDrawer'

export const PAGE_SIZE = 24

interface Props {
  basePath: string
  query: CatalogQuery
  /** Locks the listing to one category (/products/[category]) */
  fixedCategory?: string
  title: string
  subtitle?: string
  breadcrumb: Array<{ href?: string; label: string }>
}

export async function ProductListing({ basePath, query, fixedCategory, title, subtitle, breadcrumb }: Props) {
  const [all, rules] = await Promise.all([getProducts(fixedCategory ? { category: fixedCategory } : undefined), getPricingRules()])

  const filtered = filterProducts(all, query)
  const sorted = sortProducts(filtered, query.sort, rules)
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const page = Math.min(pages, Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1))
  const visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const facets = buildFacets(all, query)
  const pricedCount = filtered.filter((p) => !isQuoteOnly(p)).length

  const chips: Array<{ label: string; href: string }> = []
  const chip = (k: keyof CatalogQuery, label: string | undefined) => {
    if (query[k] && label) chips.push({ label, href: catalogHref(basePath, query, { [k]: null }) })
  }
  chip('q', query.q ? `“${query.q}”` : undefined)
  chip('job', query.job ? JOBS[query.job]?.label : undefined)
  chip('category', query.category ? CATEGORY_LABELS[query.category] : undefined)
  chip('type', query.type ? TYPE_OPTIONS[query.type] : undefined)
  chip('thickness', query.thickness ? `${query.thickness} Mil` : undefined)
  chip('size', query.size ? SIZE_RANGES[query.size]?.label : undefined)
  chip('color', facets.color.find((c) => c.value === query.color?.toLowerCase())?.label)
  chip('price', query.price === 'priced' ? 'Priced online' : query.price === 'quote' ? 'Quote only' : undefined)
  chip('stock', query.stock === 'in' ? 'In stock' : undefined)

  const sortHrefs = Object.fromEntries(Object.keys(SORTS).map((s) => [s, catalogHref(basePath, query, { sort: s })]))
  const job = query.job ? JOBS[query.job] : undefined
  const from = sorted.length ? (page - 1) * PAGE_SIZE + 1 : 0
  const to = Math.min(sorted.length, page * PAGE_SIZE)

  return (
    <div className="bg-white min-h-screen">
      <div className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgb(249_115_22_/_0.12),_transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-400 mb-4 flex items-center gap-2 flex-wrap">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-slate-600" aria-hidden>/</span>}
                {b.href ? <Link href={b.href} className="hover:text-white transition-colors">{b.label}</Link> : <span className="text-slate-200 font-medium" aria-current="page">{b.label}</span>}
              </span>
            ))}
          </nav>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{job ? `Tarps for ${job.label}` : title}</h1>
          <p className="text-slate-400 mt-2 text-sm max-w-2xl">{job?.blurb ?? subtitle}</p>
          <p className="mt-3 text-sm flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-white/5 ring-1 ring-white/10 rounded-full px-2.5 py-0.5 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden />
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            </span>
            <span className="text-slate-500">{pricedCount} priced online · {filtered.length - pricedCount} by quote · pallet pricing for approved accounts</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-60 flex-shrink-0" aria-label="Product filters">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" aria-hidden />
                <h2 className="font-bold text-slate-900">Filter</h2>
              </div>
              <ProductFilters basePath={basePath} query={query} facets={facets} hideCategory={!!fixedCategory} idPrefix="d" />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <p className="text-sm text-slate-500" aria-live="polite">
                {sorted.length ? <>Showing <strong className="text-slate-800">{from}–{to}</strong> of {sorted.length}</> : 'No matches'}
              </p>
              <div className="flex items-center gap-2">
                <MobileFilterDrawer key={catalogHref(basePath, query, {})} count={chips.length} resultCount={sorted.length}>
                  <ProductFilters basePath={basePath} query={query} facets={facets} hideCategory={!!fixedCategory} idPrefix="m" />
                </MobileFilterDrawer>
                <SortSelect value={query.sort ?? 'featured'} hrefFor={sortHrefs} />
              </div>
            </div>

            {chips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {chips.map((c) => (
                  <Link key={c.label} href={c.href} scroll={false} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-orange-50 text-orange-800 ring-1 ring-orange-200 rounded-full px-2.5 py-1 hover:bg-orange-100">
                    {c.label} <span aria-hidden>×</span><span className="sr-only">remove filter</span>
                  </Link>
                ))}
                <Link href={basePath} className="text-xs font-semibold text-slate-500 hover:text-slate-900 underline-offset-2 hover:underline">Clear all</Link>
              </div>
            )}

            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-slate-50">
                <PackageSearch className="w-12 h-12 text-slate-300 mb-3" aria-hidden />
                <h2 className="text-lg font-bold text-slate-900 mb-1">No products match these filters</h2>
                <p className="text-slate-500 mb-5 text-sm">Remove a filter, or tell us what you need and we&apos;ll source it.</p>
                <div className="flex gap-3">
                  <Link href={basePath} className="bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 text-sm">Clear filters</Link>
                  <Link href="/bulk-quote" className="bg-orange-500 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-orange-600 text-sm">Request a quote</Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {visible.map((p) => <ProductCard key={p.id} product={p} rules={rules} />)}
              </div>
            )}

            {pages > 1 && (
              <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5 flex-wrap">
                <PageLink href={catalogHref(basePath, query, { page: String(page - 1) })} disabled={page <= 1} label="Previous page"><ChevronLeft className="w-4 h-4" /></PageLink>
                {pageList(page, pages).map((n, i) =>
                  n === 0 ? <span key={`gap${i}`} className="px-1 text-slate-400">…</span> : (
                    <PageLink key={n} href={catalogHref(basePath, query, { page: String(n) })} active={n === page} label={`Page ${n}`}>{n}</PageLink>
                  ),
                )}
                <PageLink href={catalogHref(basePath, query, { page: String(page + 1) })} disabled={page >= pages} label="Next page"><ChevronRight className="w-4 h-4" /></PageLink>
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function pageList(page: number, pages: number): number[] {
  const set = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages))
  const sorted = [...set].sort((a, b) => a - b)
  const out: number[] = []
  sorted.forEach((n, i) => {
    if (i && n - sorted[i - 1] > 1) out.push(0)
    out.push(n)
  })
  return out
}

function PageLink({ href, children, active, disabled, label }: { href: string; children: React.ReactNode; active?: boolean; disabled?: boolean; label: string }) {
  const cls = 'min-w-9 h-9 px-2 inline-flex items-center justify-center rounded-lg text-sm font-semibold'
  if (disabled) return <span className={`${cls} text-slate-300`} aria-disabled="true" aria-label={label}>{children}</span>
  return (
    <Link href={href} aria-label={label} aria-current={active ? 'page' : undefined}
      className={`${cls} ${active ? 'bg-slate-900 text-white' : 'text-slate-700 ring-1 ring-slate-200 hover:ring-orange-300'} focus-visible:outline-2 focus-visible:outline-orange-500`}>
      {children}
    </Link>
  )
}
