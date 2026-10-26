'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, FileText, Check, TrendingDown, Package, Scale, Truck } from 'lucide-react'
import { productWeightLb, formatLb } from '@/lib/freight'
import { formatPrice, cn } from '@/lib/utils'
import { unitPriceCents, lineTotalCents, isQuoteOnly, type PricingRule } from '@/lib/pricing'
import { useCart } from '@/lib/cart/useCart'
import { usePricingData } from '@/lib/cart/usePricingData'
import { nextTier, packPresets } from '@/lib/cart/tiers'
import { QuantityStepper } from '@/components/cart/QuantityStepper'
import type { Product } from '@/types'

interface Props {
  product: Product
  /** Active volume pricing rules (Team A passes these from the product page). */
  rules?: PricingRule[]
}

export function AddToCartOrRFQ({ product, rules: rulesProp }: Props) {
  const cart = useCart()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  // Rules come from the page; the wholesale % (approved accounts) comes from the server.
  const { data } = usePricingData([], true)
  const rules = rulesProp ?? data?.rules ?? []
  const opts = { wholesaleDiscountPercent: data?.wholesaleDiscountPercent ?? 0, accountApproved: data?.accountApproved === true }

  const quoteOnly = isQuoteOnly(product)
  const unit = unitPriceCents(product, qty, rules, opts)
  const total = lineTotalCents(product, qty, rules, opts)
  const retailTotal = product.retail_price_cents * qty
  const savings = retailTotal - total
  const nudge = quoteOnly ? null : nextTier(product, qty, rules, opts)
  const presets = packPresets(product, rules)
  const inCart = cart.items.find((i) => i.sku === product.xpose_sku)
  const unitWeight = productWeightLb(product as Parameters<typeof productWeightLb>[0])
  const parcelMax = data?.freight?.settings.parcel_max_order_lb ?? 150
  const truckFreight = unitWeight != null && (unitWeight > parcelMax || unitWeight * qty > parcelMax)

  const addToCart = () => {
    cart.addItem({
      sku: product.xpose_sku,
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image_urls?.[0],
      quantity: qty,
      quote_only: quoteOnly,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
    cart.openDrawer()
  }

  const quoteHref = `/bulk-quote?${new URLSearchParams({ sku: product.xpose_sku, name: product.name, qty: String(qty) })}`

  return (
    <div className="space-y-4" data-testid="buy-box">
      {/* Quantity */}
      <div>
        <label htmlFor="buybox-qty" className="block text-sm font-semibold text-slate-700 mb-2">Quantity</label>
        <QuantityStepper id="buybox-qty" value={qty} onChange={setQty} label="Quantity" />
        <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Quick quantities">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setQty(p.qty)}
              aria-pressed={qty === p.qty}
              className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400',
                qty === p.qty ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 text-slate-600 hover:border-orange-400 hover:text-orange-600',
              )}
            >
              {p.label.includes('allet') || p.label.startsWith('Case') ? <Package className="w-3 h-3" aria-hidden /> : null}
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      {quoteOnly ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="font-bold text-slate-900">Pallet / project pricing by quote</p>
          <p className="text-sm text-slate-500 mt-1">
            This item is priced per order. Add it to your cart and request a quote, or ask for one now.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 p-4" aria-live="polite">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm text-slate-500">Line total ({qty.toLocaleString()} unit{qty > 1 ? 's' : ''})</p>
              <p className="text-3xl font-black text-slate-900" data-testid="line-total">{formatPrice(total)}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-slate-900" data-testid="unit-price">{formatPrice(unit)} <span className="text-sm font-medium text-slate-400">/ unit</span></p>
              {savings > 0 && (
                <p className="text-sm text-green-700 font-semibold">
                  You save {formatPrice(savings)}
                  <span className="text-slate-400 line-through font-normal ml-1">{formatPrice(product.retail_price_cents)}</span>
                </p>
              )}
            </div>
          </div>
          {nudge && (
            <button
              type="button"
              onClick={() => setQty(nudge.atQty)}
              className="mt-3 w-full flex items-center gap-2 text-left text-sm bg-orange-50 border border-orange-200 text-orange-800 rounded-lg px-3 py-2 hover:bg-orange-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <TrendingDown className="w-4 h-4 flex-shrink-0" aria-hidden />
              <span>
                Add <strong>{nudge.addQty}</strong> more to save <strong>{nudge.discountPercent}%</strong>
                <span className="text-orange-600"> · {formatPrice(unitPriceCents(product, nudge.atQty, rules, opts))}/unit at {nudge.atQty}+</span>
              </span>
            </button>
          )}
          {opts.wholesaleDiscountPercent > 0 && (
            <p className="mt-2 text-xs text-slate-500">Includes your {opts.wholesaleDiscountPercent}% wholesale account discount.</p>
          )}
        </div>
      )}

      {/* Ship weight / freight method */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600" data-testid="ship-weight-info">
        <span className="inline-flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-slate-400" aria-hidden />
          <span>{unitWeight != null ? <>Ship weight ≈ <strong className="text-slate-900">{formatLb(unitWeight)} lb</strong> each</> : 'Ship weight not listed, freight quoted'}</span>
        </span>
        {unitWeight != null && qty > 1 && <span className="text-slate-400">{formatLb(unitWeight * qty)} lb for {qty.toLocaleString()}</span>}
        {truckFreight && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-orange-700" data-testid="ltl-notice">
            <Truck className="w-4 h-4" aria-hidden /> Ships by truck freight (LTL)
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={addToCart}
          disabled={!quoteOnly && !product.in_stock}
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors text-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300"
        >
          {added ? <Check className="w-5 h-5" aria-hidden /> : <ShoppingCart className="w-5 h-5" aria-hidden />}
          {added
            ? 'Added to cart'
            : quoteOnly
              ? 'Add to cart for quote'
              : product.in_stock
                ? 'Add to Cart'
                : 'Out of Stock'}
        </button>

        <Link
          href={quoteHref}
          className="w-full border-2 border-orange-400 text-orange-600 hover:bg-orange-50 font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
        >
          <FileText className="w-4 h-4" aria-hidden />
          {quoteOnly ? 'Request a quote now' : 'Need a pallet or a job quote?'}
        </Link>
      </div>

      {inCart && cart.hydrated && (
        <p className="text-sm text-slate-500 text-center">
          {inCart.quantity.toLocaleString()} already in your cart ·{' '}
          <Link href="/cart" className="text-orange-600 font-semibold hover:underline">View cart</Link>
        </p>
      )}

      <p className="text-xs text-slate-400 text-center">
        Secure checkout via Stripe · Card or ACH · Freight calculated by weight
      </p>
    </div>
  )
}
