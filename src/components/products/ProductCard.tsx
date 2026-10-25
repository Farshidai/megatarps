import Link from 'next/link'
import { cache } from 'react'
import { ArrowUpRight, Flame } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { getPricingRules } from '@/lib/products'
import { isQuoteOnly, lowestUnitPriceCents, priceTiers, type PricingRule } from '@/lib/pricing'
import { gaugeLabel, isAccessory, type CatalogProduct } from '@/lib/catalog'
import { ProductImage } from '@/components/products/ProductImage'
import type { Product } from '@/types'

// One rules fetch per request even when a page renders many cards without passing `rules`.
const rulesForRequest = cache(getPricingRules)

interface ProductCardProps {
  product: Product
  /** Volume pricing rules. Pass them from the page when rendering a grid; fetched (once per request) if omitted. */
  rules?: PricingRule[]
}

export async function ProductCard({ product: base, rules }: ProductCardProps) {
  const product = base as CatalogProduct
  const r = rules ?? (await rulesForRequest())
  const quoteOnly = isQuoteOnly(product)
  const tiers = quoteOnly ? [] : priceTiers(product, r)
  const low = quoteOnly ? 0 : lowestUnitPriceCents(product, r)
  const best = tiers.find((t) => t.unit_price_cents === low) ?? null
  const hasVolume = best != null && best.min_quantity > 1
  const fr = product.product_line?.fire_retardant
  const gauge = gaugeLabel(product)
  const acc = isAccessory(product)

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative bg-white rounded-2xl ring-1 ring-slate-200/70 hover:ring-orange-300 hover:shadow-[0_8px_30px_-10px_rgb(249_115_22_/_0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 transition-all duration-300 overflow-hidden flex flex-col"
    >
      <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
        <ProductImage product={product} imgClassName="group-hover:scale-[1.04] transition-transform duration-700 ease-out" />

        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          {fr && (
            <span className="inline-flex items-center gap-1 bg-red-600/95 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-sm">
              <Flame className="w-3 h-3" aria-hidden /> Fire Retardant
            </span>
          )}
        </div>
        {quoteOnly && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-sm">
            Quote
          </span>
        )}
        {!quoteOnly && (
          <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm" aria-hidden>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        )}

        {!product.in_stock && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
        {product.product_line?.name && (
          <p className="text-[10px] text-orange-600 font-bold uppercase tracking-[0.12em] mb-1.5 truncate">{product.product_line.name}</p>
        )}
        <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 leading-snug group-hover:text-orange-600 transition-colors line-clamp-2 mb-2.5 min-h-[2.6rem]">
          {product.name}
        </h3>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {gauge && <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">{gauge}</span>}
          {!acc && product.coverage_sqft > 0 && (
            <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
              {product.coverage_sqft.toLocaleString('en-US')} sq ft
            </span>
          )}
          {acc && product.pack_quantity && product.pack_quantity > 1 && (
            <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">{product.pack_quantity}-pack</span>
          )}
          {product.color && product.color !== 'Standard' && (
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full ring-1 ring-slate-300" style={{ backgroundColor: product.color_hex ?? '#94a3b8' }} aria-hidden />
              {product.color}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-slate-100">
          {quoteOnly ? (
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Wholesale</p>
                <p className="text-sm font-bold text-orange-600">Pricing by quote</p>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 group-hover:text-orange-600 transition-colors">Get quote →</span>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-lg sm:text-xl font-black text-slate-900 leading-none tabular-nums">
                  {formatPrice(product.retail_price_cents)}
                  <span className="text-xs font-semibold text-slate-400">/ea</span>
                </p>
                {!product.in_stock ? null : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden /> In stock
                  </span>
                )}
              </div>
              {hasVolume && best && (
                <p className="mt-1.5 text-xs text-slate-600">
                  As low as <span className="font-bold text-green-700 tabular-nums">{formatPrice(best.unit_price_cents)}/ea</span> at {best.min_quantity}+
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
