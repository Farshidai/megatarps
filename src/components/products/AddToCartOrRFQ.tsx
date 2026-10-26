'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, FileText, Check, TrendingDown, Package, Scale, Truck } from 'lucide-react'
import { productWeightLb, formatLb } from '@/lib/freight'
import { formatPrice, cn } from '@/lib/utils'
import { isQuoteOnly, contractPricesFor, type ContractPrice, type PricePoint } from '@/lib/pricing'
import { scheduleUnitPrice, scheduleIsContract } from '@/lib/price-schedule'
import { ContractPriceBadge } from '@/components/pricing/ContractPriceBadge'
import { useCart } from '@/lib/cart/useCart'
import { usePricingData } from '@/lib/cart/usePricingData'
import { nextTier, packPresets } from '@/lib/cart/tiers'
import { QuantityStepper } from '@/components/cart/QuantityStepper'
import type { Product } from '@/types'

interface Props {
  /** Public product (no cost / floor: pass toPublicProduct(product)). */
  product: Product
  /**
   * Unit price by quantity for THIS buyer, computed on the server by priceSchedule()
   * (tiers, pallets, account + contract pricing and the floor already applied).
   */
  schedule: PricePoint[]
  /** Extra account % shown in the note (only applies to products without pallet pricing). */
  wholesaleDiscountPercent?: number
  /** The signed-in approved account's own contract prices (for the "applies at N+" hint). */
  contractPrices?: ContractPrice[]
}

export function AddToCartOrRFQ({ product, schedule, wholesaleDiscountPercent = 0, contractPrices = [] }: Props) {
  const cart = useCart()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  // Freight settings only (prices come from the server-computed schedule)
  const { data } = usePricingData([], true)

  const quoteOnly = isQuoteOnly(product)
  const unit = scheduleUnitPrice(schedule, qty)
  const total = unit * qty
  const retailTotal = product.retail_price_cents * qty
  const savings = retailTotal - total
  const contract = scheduleIsContract(schedule, qty)
  const myContracts = !quoteOnly ? contractPricesFor(product, contractPrices) : []
  const activeContract = contract ? [...myContracts].reverse().find((c) => qty >= (c.min_quantity || 1)) : undefined
  // a contract row this qty doesn't reach yet (e.g. "10+"), and that would beat today's price
  const upcomingContract = myContracts.find((c) => (c.min_quantity || 1) > qty && c.unit_price_cents < unit)
  // only nudges toward a quantity that is really cheaper than what this buyer pays now
  const nudge = quoteOnly ? null : nextTier(schedule, qty)
  const presets = packPresets(product, schedule)
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
              {contract && <ContractPriceBadge className="mb-1" />}
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
                <span className="text-orange-600"> · {formatPrice(nudge.unitPriceCents)}/unit at {nudge.atQty}+</span>
              </span>
            </button>
          )}
          {upcomingContract && (
            <button
              type="button"
              onClick={() => setQty(upcomingContract.min_quantity)}
              className="mt-3 w-full flex items-center gap-2 text-left text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-3 py-2 hover:bg-emerald-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              data-testid="contract-upcoming"
            >
              <TrendingDown className="w-4 h-4 flex-shrink-0" aria-hidden />
              <span>
                Your contract price <strong>{formatPrice(upcomingContract.unit_price_cents)}/unit</strong> applies at{' '}
                <strong>{upcomingContract.min_quantity}+</strong>. Set quantity to {upcomingContract.min_quantity}
              </span>
            </button>
          )}
          {contract ? (
            <p className="mt-2 text-xs text-emerald-800" data-testid="contract-note">
              Agreed price for your account{activeContract?.valid_until ? `, valid through ${new Date(`${activeContract.valid_until}T12:00:00`).toLocaleDateString('en-US', { dateStyle: 'medium' })}` : ''}. Applied automatically at checkout.
            </p>
          ) : wholesaleDiscountPercent > 0 && savings > 0 ? (
            <p className="mt-2 text-xs text-slate-500">Includes your {wholesaleDiscountPercent}% wholesale account discount.</p>
          ) : null}
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
