'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trash2, TrendingDown, ImageOff } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import { unitPriceCents, isContractPriced, type PricingRule, type PriceOptions } from '@/lib/pricing'
import { ContractPriceBadge } from '@/components/pricing/ContractPriceBadge'
import type { CartItem } from '@/lib/cart/types'
import type { CatalogEntry } from '@/lib/cart/catalog-types'
import { nextTier } from '@/lib/cart/tiers'
import { QuantityStepper } from './QuantityStepper'

interface Props {
  item: CartItem
  product?: CatalogEntry
  rules: PricingRule[]
  opts: PriceOptions
  onQty: (qty: number) => void
  onRemove: () => void
  compact?: boolean
  loading?: boolean
}

export function CartLineRow({ item, product, rules, opts, onQty, onRemove, compact, loading }: Props) {
  const priced = product && !item.quote_only && !product.quote_only
  const unit = priced ? unitPriceCents(product, item.quantity, rules, opts) : 0
  const contract = priced ? isContractPriced(product, item.quantity, rules, opts) : false
  const tierNudge = priced ? nextTier(product, item.quantity, rules, opts) : null
  // never nudge toward a tier that is not actually cheaper than the price paid now (e.g. a contract price)
  const nudge = tierNudge && priced && unitPriceCents(product, tierNudge.atQty, rules, opts) < unit ? tierNudge : null
  const href = item.slug ? `/product/${item.slug}` : '#'
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <li className={cn('flex gap-3', compact ? 'py-3' : 'py-4')} data-sku={item.sku}>
      <Link href={href} className={cn('flex-shrink-0 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center', compact ? 'w-16 h-16' : 'w-20 h-20')}>
        {item.image && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" onError={() => setImgFailed(true)} />
        ) : (
          <ImageOff className="w-5 h-5 text-slate-300" aria-hidden />
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={href} className="font-semibold text-slate-900 text-sm leading-snug hover:text-orange-600 line-clamp-2">
              {item.name}
            </Link>
            <p className="text-xs text-slate-400 mt-0.5">SKU {item.sku}</p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${item.name}`}
            className="p-1.5 -m-1 text-slate-400 hover:text-red-600 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
          <QuantityStepper size="sm" value={item.quantity} onChange={onQty} label={`Quantity for ${item.name}`} />
          <div className="text-right">
            {priced ? (
              <>
                {contract && <ContractPriceBadge size="sm" className="mb-0.5" />}
                <p className="font-bold text-slate-900" data-testid="cart-line-total">{formatPrice(unit * item.quantity)}</p>
                <p className="text-xs text-slate-500">
                  {formatPrice(unit)}/unit
                  {unit < product.retail_price_cents && <span className="line-through text-slate-300 ml-1">{formatPrice(product.retail_price_cents)}</span>}
                </p>
              </>
            ) : item.quote_only || product?.quote_only ? (
              <p className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded-md">Price by quote</p>
            ) : loading ? (
              <p className="h-4 w-16 bg-slate-100 rounded animate-pulse" aria-label="Loading price" />
            ) : (
              <p className="text-xs text-red-600">No longer available</p>
            )}
          </div>
        </div>
        {nudge && !compact && (
          <button
            type="button"
            onClick={() => onQty(nudge.atQty)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-orange-700 hover:text-orange-800 font-medium"
          >
            <TrendingDown className="w-3.5 h-3.5" aria-hidden />
            Add {nudge.addQty} more to save {nudge.discountPercent}%
          </button>
        )}
      </div>
    </li>
  )
}
