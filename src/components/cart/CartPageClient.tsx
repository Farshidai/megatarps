'use client'

import Link from 'next/link'
import { ShoppingCart, Lock, FileText, Zap, AlertTriangle, ArrowLeft, CreditCard, Landmark } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/lib/cart/useCart'
import { usePricingData } from '@/lib/cart/usePricingData'
import { useCheckout } from '@/lib/cart/useCheckout'
import { cartTotals } from '@/lib/cart/totals'
import { CartLineRow } from './CartLineRow'
import { FreeFreightBar } from './FreeFreightBar'
import { FreightRows, FreightQuoteRequired } from './FreightSummary'

export function CartPageClient() {
  const cart = useCart()
  const { data, loading } = usePricingData(cart.items.map((i) => i.sku), cart.items.length > 0)
  const { checkout, loading: checkingOut, error } = useCheckout()
  const rules = data?.rules ?? []
  const opts = { wholesaleDiscountPercent: data?.wholesaleDiscountPercent ?? 0, accountApproved: data?.accountApproved === true, contractPrices: data?.contractPrices ?? [] }
  const t = cartTotals(cart.items, data?.products, rules, opts, data?.freight)
  const freightQuote = t.freight?.method === 'quote'
  const freightCents = t.freight?.freightCents ?? 0

  if (!cart.hydrated) {
    return <div className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" aria-label="Loading cart" />
  }

  if (cart.items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-16 text-center">
        <ShoppingCart className="w-14 h-14 text-slate-200 mx-auto mb-4" aria-hidden />
        <h1 className="text-2xl font-black text-slate-900">Your cart is empty</h1>
        <p className="text-slate-500 mt-2">Browse the catalog, or paste your SKU list into Quick Order.</p>
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <Link href="/products" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl">Shop tarps</Link>
          <Link href="/quick-order" className="border border-slate-300 hover:border-slate-400 bg-white text-slate-800 font-semibold px-6 py-3 rounded-xl inline-flex items-center gap-1.5"><Zap className="w-4 h-4 text-orange-500" aria-hidden /> Quick Order</Link>
        </div>
      </div>
    )
  }

  const row = (item: (typeof cart.items)[number]) => (
    <CartLineRow
      key={item.sku}
      item={item}
      product={data?.products[item.sku]}
      rules={rules}
      opts={opts}
      loading={loading}
      onQty={(q) => cart.setQuantity(item.sku, q)}
      onRemove={() => cart.removeItem(item.sku)}
    />
  )

  return (
    <div>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Your Cart</h1>
          <p className="text-slate-500 text-sm mt-1">
            {cart.lineCount} line{cart.lineCount > 1 ? 's' : ''} · {cart.count.toLocaleString()} units · volume pricing applied per line
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/quick-order" className="text-orange-600 font-semibold hover:underline inline-flex items-center gap-1"><Zap className="w-4 h-4" aria-hidden />Quick Order</Link>
          <Link href="/products" className="text-slate-600 font-semibold hover:underline inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" aria-hidden />Keep shopping</Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="space-y-6">
          {(t.priced.length > 0 || t.unavailable.length > 0 || loading) && (
            <section className="bg-white rounded-2xl border border-slate-200 px-5 sm:px-6" aria-labelledby="priced-heading">
              <h2 id="priced-heading" className="pt-5 font-bold text-slate-900">Ready to order</h2>
              <ul className="divide-y divide-slate-100">
                {(loading ? cart.items.filter((i) => !i.quote_only) : [...t.priced, ...t.unavailable]).map(row)}
              </ul>
              {t.unavailable.length > 0 && (
                <p className="pb-4 text-sm text-red-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" aria-hidden /> Remove unavailable items before checkout.
                </p>
              )}
            </section>
          )}

          {t.quote.length > 0 && !loading && (
            <section className="bg-white rounded-2xl border-2 border-dashed border-orange-300 px-5 sm:px-6" aria-labelledby="quote-heading">
              <div className="pt-5 flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 id="quote-heading" className="font-bold text-slate-900 flex items-center gap-2"><FileText className="w-4 h-4 text-orange-500" aria-hidden />Priced by quote</h2>
                  <p className="text-sm text-slate-500 mt-1">Pallet and project items. These are not charged at checkout; our team will send you a quote.</p>
                </div>
                <Link href="/bulk-quote?from=cart" className="text-sm bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg">Request quote</Link>
              </div>
              <ul className="divide-y divide-slate-100">{t.quote.map(row)}</ul>
            </section>
          )}
        </div>

        <aside className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 lg:sticky lg:top-32" aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="font-bold text-slate-900">Order summary</h2>
          {t.priced.length > 0 ? (
            <>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-600">Subtotal</dt><dd className="font-semibold text-slate-900" data-testid="cart-subtotal">{formatPrice(t.subtotal)}</dd></div>
                {t.savings > 0 && <div className="flex justify-between text-green-700"><dt>Volume savings</dt><dd className="font-semibold">−{formatPrice(t.savings)}</dd></div>}
                {t.freight && <FreightRows freight={t.freight} />}
                <div className="flex justify-between text-slate-400"><dt>Tax</dt><dd>Calculated at checkout</dd></div>
                <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
                  <dt className="font-bold text-slate-900">{freightQuote ? 'Items total' : 'Estimated total'}</dt>
                  <dd className="font-black text-slate-900 text-xl" data-testid="cart-total">{formatPrice(t.subtotal + (freightQuote ? 0 : freightCents))}</dd>
                </div>
              </dl>
              {t.freeFreightThreshold && <FreeFreightBar threshold={t.freeFreightThreshold} toFreeFreight={t.toFreeFreight} progress={t.freightProgress} />}
              {opts.wholesaleDiscountPercent > 0 && <p className="text-xs text-slate-500">Includes your {opts.wholesaleDiscountPercent}% wholesale discount.</p>}
              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
              {freightQuote && t.freight ? (
                <FreightQuoteRequired freight={t.freight} />
              ) : (
              <button
                type="button"
                onClick={() => checkout(t.priced)}
                disabled={checkingOut || loading || !t.freight || t.unavailable.length > 0}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300"
                data-testid="checkout-button"
              >
                <Lock className="w-5 h-5" aria-hidden />
                {checkingOut ? 'Redirecting to secure checkout…' : `Checkout · ${formatPrice(t.subtotal + freightCents)}`}
              </button>
              )}
              <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-3">
                <span className="inline-flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" aria-hidden />Card</span>
                <span className="inline-flex items-center gap-1"><Landmark className="w-3.5 h-3.5" aria-hidden />ACH bank transfer</span>
                <span>via Stripe</span>
              </p>
              {t.quote.length > 0 && <p className="text-xs text-slate-500">Checkout covers the {t.priced.length} priced line{t.priced.length > 1 ? 's' : ''} only. Quote items stay in your cart.</p>}
            </>
          ) : (
            <p className="text-sm text-slate-500">Everything in your cart is priced by quote. Send it to our team and we&apos;ll reply with pricing and freight.</p>
          )}

          <div className="border-t border-slate-100 pt-4">
            <Link
              href="/bulk-quote?from=cart"
              className="w-full border-2 border-orange-400 text-orange-600 hover:bg-orange-50 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
              data-testid="quote-cart"
            >
              <FileText className="w-4 h-4" aria-hidden />
              Request a quote for this cart
            </Link>
            <p className="text-xs text-slate-400 text-center mt-2">Big job, pallet quantities or net terms? Send the whole cart for a quote.</p>
          </div>
          <p className="text-xs text-slate-400">Freight is calculated by ship weight. Orders over {data?.freight ? Math.round(data.freight.settings.parcel_max_order_lb) : 150} lb ship by truck (LTL).</p>
        </aside>
      </div>
    </div>
  )
}
