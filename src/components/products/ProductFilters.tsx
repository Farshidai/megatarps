import Link from 'next/link'
import { Search } from 'lucide-react'
import { catalogHref, facets as buildFacets, type CatalogQuery, type Facet } from '@/lib/catalog'
import { cn } from '@/lib/utils'

type Facets = ReturnType<typeof buildFacets>

interface ProductFiltersProps {
  basePath: string
  query: CatalogQuery
  facets: Facets
  /** Hide the category group (e.g. on /products/[category]) */
  hideCategory?: boolean
  /** id prefix so two instances (desktop + mobile) don't collide */
  idPrefix?: string
}

/**
 * Faceted filters rendered as plain links (works without JS, crawlable, instant).
 * Counts reflect all other active filters so buyers never click into an empty page.
 */
export function ProductFilters({ basePath, query, facets, hideCategory, idPrefix = 'f' }: ProductFiltersProps) {
  return (
    <div className="space-y-6">
      <form action={basePath} method="get" role="search" className="relative">
        {Object.entries(query).map(([k, v]) =>
          k === 'q' || k === 'page' || !v ? null : <input key={k} type="hidden" name={k} value={v} />,
        )}
        <label htmlFor={`${idPrefix}-q`} className="sr-only">Search products</label>
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
        <input
          id={`${idPrefix}-q`}
          name="q"
          defaultValue={query.q}
          placeholder="Size, SKU, color…"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        />
      </form>

      <Group title="Shop by job" k="job" options={facets.job} basePath={basePath} query={query} />
      {!hideCategory && <Group title="Category" k="category" options={facets.category} basePath={basePath} query={query} />}
      <Group title="Type" k="type" options={facets.type} basePath={basePath} query={query} />
      <Group title="Thickness" k="thickness" options={facets.thickness} basePath={basePath} query={query} />
      <Group title="Size" k="size" options={facets.size} basePath={basePath} query={query} />

      <fieldset>
        <legend className="font-bold text-slate-900 mb-2.5 text-xs uppercase tracking-wider">Color</legend>
        <div className="flex flex-wrap gap-1.5">
          {facets.color.map((o) => {
            const active = query.color?.toLowerCase() === o.value
            const disabled = o.count === 0 && !active
            return (
              <FilterLink
                key={o.value}
                href={catalogHref(basePath, query, { color: active ? null : o.value })}
                active={active}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full ring-1"
                activeClass="ring-orange-400 bg-orange-50 text-orange-800 font-semibold"
                idleClass="ring-slate-200 text-slate-700 hover:ring-slate-400"
              >
                <span className="w-3 h-3 rounded-full ring-1 ring-slate-300" style={{ backgroundColor: facets.colorHex[o.value] }} aria-hidden />
                {o.label}
                <span className="text-slate-400 tabular-nums">{o.count}</span>
              </FilterLink>
            )
          })}
        </div>
      </fieldset>

      <Group title="Pricing" k="price" options={facets.price} basePath={basePath} query={query} />

      <div>
        <FilterLink
          href={catalogHref(basePath, query, { stock: query.stock === 'in' ? null : 'in' })}
          active={query.stock === 'in'}
          className="flex items-center gap-2 text-sm"
          activeClass="text-orange-700 font-semibold"
          idleClass="text-slate-600 hover:text-slate-900"
        >
          <span className={cn('w-4 h-4 rounded border flex items-center justify-center text-[10px]', query.stock === 'in' ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300')} aria-hidden>
            {query.stock === 'in' ? '✓' : ''}
          </span>
          In stock only
        </FilterLink>
      </div>
    </div>
  )
}

function Group({ title, k, options, basePath, query }: { title: string; k: keyof CatalogQuery; options: Facet[]; basePath: string; query: CatalogQuery }) {
  const current = query[k]
  return (
    <fieldset>
      <legend className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider">{title}</legend>
      <ul className="space-y-0.5">
        {options.map((o) => {
          const active = current === o.value
          const disabled = o.count === 0 && !active
          return (
            <li key={o.value}>
              <FilterLink
                href={catalogHref(basePath, query, { [k]: active ? null : o.value })}
                active={active}
                disabled={disabled}
                className="w-full flex items-center justify-between gap-2 text-sm px-2.5 py-1.5 rounded-lg"
                activeClass="bg-orange-100 text-orange-800 font-semibold"
                idleClass="text-slate-600 hover:bg-slate-100"
              >
                <span className="truncate">{o.label}</span>
                <span className={cn('text-xs tabular-nums', active ? 'text-orange-700' : 'text-slate-400')}>{active ? '×' : o.count}</span>
              </FilterLink>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}

function FilterLink({
  href, active, disabled, className, activeClass, idleClass, children,
}: {
  href: string; active: boolean; disabled?: boolean; className: string; activeClass: string; idleClass: string; children: React.ReactNode
}) {
  if (disabled) {
    return (
      <span className={cn(className, 'text-slate-300 cursor-not-allowed ring-slate-100')} aria-disabled="true">
        {children}
      </span>
    )
  }
  return (
    <Link
      href={href}
      prefetch={false}
      scroll={false}
      aria-current={active ? 'true' : undefined}
      rel="nofollow"
      className={cn(className, 'transition-colors focus-visible:outline-2 focus-visible:outline-orange-500', active ? activeClass : idleClass)}
    >
      {children}
    </Link>
  )
}
