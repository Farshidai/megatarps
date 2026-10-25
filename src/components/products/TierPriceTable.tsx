import Link from 'next/link'
import { FileText, Layers, Truck } from 'lucide-react'
import { isQuoteOnly, priceTiers, type PricingRule, type PriceOptions } from '@/lib/pricing'
import type { CatalogProduct } from '@/lib/catalog'
import { formatPrice, cn } from '@/lib/utils'

interface Props {
  product: CatalogProduct
  rules: PricingRule[]
  opts?: PriceOptions
  className?: string
}

/** Volume pricing table (Qty | Unit price | You save) — or a quote panel for quote-only SKUs. */
export function TierPriceTable({ product, rules, opts, className }: Props) {
  if (isQuoteOnly(product)) return <QuotePanel product={product} className={className} />

  const tiers = priceTiers(product, rules, opts)
  const best = tiers[tiers.length - 1]

  return (
    <section aria-labelledby="tier-heading" className={cn('rounded-2xl ring-1 ring-slate-200 overflow-hidden bg-white', className)}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-900 text-white">
        <h2 id="tier-heading" className="text-sm font-bold flex items-center gap-2">
          <Layers className="w-4 h-4 text-orange-400" aria-hidden />
          Volume pricing
        </h2>
        {tiers.length > 1 && best && (
          <span className="text-[11px] font-semibold text-orange-300">
            Save up to {Math.round(best.discount_percent)}% at {best.min_quantity}+
          </span>
        )}
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">Unit price by order quantity for {product.name}</caption>
        <thead>
          <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
            <th scope="col" className="text-left font-semibold px-4 py-2">Qty</th>
            <th scope="col" className="text-right font-semibold px-4 py-2">Unit price</th>
            <th scope="col" className="text-right font-semibold px-4 py-2">You save</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tiers.map((t) => {
            const isBest = t === best && tiers.length > 1
            return (
              <tr key={t.label} className={isBest ? 'bg-orange-50/70' : undefined}>
                <th scope="row" className="text-left px-4 py-2.5 font-semibold text-slate-800 whitespace-nowrap">
                  {t.label}
                  <span className="sr-only"> units</span>
                  {isBest && (
                    <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wider text-orange-700 bg-orange-100 rounded px-1.5 py-0.5">
                      Best
                    </span>
                  )}
                </th>
                <td className="text-right px-4 py-2.5 font-black text-slate-900 tabular-nums">
                  {formatPrice(t.unit_price_cents)}
                  <span className="text-slate-400 font-medium text-xs">/ea</span>
                </td>
                <td className="text-right px-4 py-2.5 tabular-nums">
                  {t.discount_percent > 0 ? (
                    <span className="font-bold text-green-700">{formatPct(t.discount_percent)}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <PackInfo product={product} />
    </section>
  )
}

function formatPct(n: number) {
  return `${Number.isInteger(n) ? n : n.toFixed(1)}%`
}

function PackInfo({ product }: { product: CatalogProduct }) {
  const bits = [
    product.pack_quantity && product.pack_quantity > 1 ? `${product.pack_quantity} pcs per pack` : null,
    product.units_per_case ? `${product.units_per_case} per case` : null,
    product.units_per_half_pallet ? `${product.units_per_half_pallet} per half pallet` : null,
    product.units_per_full_pallet ? `${product.units_per_full_pallet} per full pallet` : null,
  ].filter(Boolean)
  return (
    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 flex items-start gap-2">
      <Truck className="w-4 h-4 text-slate-400 shrink-0 mt-px" aria-hidden />
      <p>
        {bits.length > 0 && <span className="font-semibold text-slate-700">{bits.join(' · ')}. </span>}
        Pallet or mixed-SKU orders?{' '}
        <Link href={`/bulk-quote?sku=${encodeURIComponent(product.xpose_sku)}`} className="text-orange-600 font-semibold hover:underline focus-visible:underline">
          Get a pallet quote
        </Link>
      </p>
    </div>
  )
}

function QuotePanel({ product, className }: { product: CatalogProduct; className?: string }) {
  return (
    <section
      aria-labelledby="quote-heading"
      className={cn('rounded-2xl ring-1 ring-orange-200 bg-gradient-to-br from-orange-50 to-white overflow-hidden', className)}
    >
      <div className="p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-orange-600 mb-1">Contractor &amp; bulk buyers</p>
        <h2 id="quote-heading" className="text-lg font-black text-slate-900">Wholesale pricing by quote</h2>
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
          This SKU is priced per order based on quantity, mix and freight. Send your quantities and
          we&apos;ll reply with case and pallet pricing, usually within 4 business hours.
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
          <li>✓ Case &amp; pallet pricing</li>
          <li>✓ Mixed-SKU orders</li>
          <li>✓ Net terms for approved accounts</li>
          <li>✓ Midwest freight from KC</li>
        </ul>
        <Link
          href={`/bulk-quote?sku=${encodeURIComponent(product.xpose_sku)}&name=${encodeURIComponent(product.name)}`}
          className="mt-4 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <FileText className="w-4 h-4" aria-hidden />
          Request a quote
        </Link>
      </div>
      <PackInfo product={product} />
    </section>
  )
}
