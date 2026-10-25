'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, ShoppingCart, Lock, FileText, Zap } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/lib/cart/useCart'
import { usePricingData } from '@/lib/cart/usePricingData'
import { useCheckout } from '@/lib/cart/useCheckout'
import { cartTotals } from '@/lib/cart/totals'
import { CartLineRow } from './CartLineRow'
import { FreeFreightBar } from './FreeFreightBar'
import { FreightRows, FreightQuoteRequired } from './FreightSummary'

/** Slide-over mini cart. Rendered once (from the Navbar); opened via useCart().openDrawer(). */
export function CartDrawer() {
  const cart = useCart()
  const { isOpen, closeDrawer } = cart
  const pathname = usePathname()
  const panelRef = useRef<HTMLDivElement>(null)
  const { data, loading } = usePricingData(cart.items.map((i) => i.sku), isOpen && cart.items.length > 0)
  const { checkout, loading: checkingOut, error } = useCheckout()

  const rules = data?.rules ?? []
  const opts = { wholesaleDiscountPercent: data?.wholesaleDiscountPercent ?? 0 }
  const totals = cartTotals(cart.items, data?.products, rules, opts, data?.freight)
  const freightQuote = totals.freight?.method === 'quote'

  // close on route change
  const lastPath = useRef(pathname)
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname
      closeDrawer()
    }
  }, [pathname, closeDrawer])

  // Escape to close, lock body scroll, focus the panel
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const prevFocus = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer()
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      prevFocus?.focus?.()
    }
  }, [isOpen, closeDrawer])

  if (!isOpen || typeof document === 'undefined') return null

  // Portal to <body>: the sticky navbar uses backdrop-filter, which would otherwise
  // become the containing block for this fixed overlay.
  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="mini-cart-title">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeDrawer} aria-hidden />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col focus:outline-none"
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200">
          <h2 id="mini-cart-title" className="font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-500" aria-hidden />
            Your Cart
            {cart.count > 0 && <span className="text-sm font-semibold text-slate-400">({cart.count.toLocaleString()} units)</span>}
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close cart"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingCart className="w-12 h-12 text-slate-200 mb-3" aria-hidden />
            <p className="font-semibold text-slate-700">Your cart is empty</p>
            <p className="text-sm text-slate-400 mt-1">Ordering by SKU? Use Quick Order.</p>
            <div className="mt-5 flex gap-2">
              <Link href="/products" className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-4 py-2.5 rounded-lg">Shop tarps</Link>
              <Link href="/quick-order" className="border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-lg inline-flex items-center gap-1"><Zap className="w-4 h-4" aria-hidden />Quick Order</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              <ul className="divide-y divide-slate-100">
                {cart.items.map((item) => (
                  <CartLineRow
                    key={item.sku}
                    compact
                    item={item}
                    product={data?.products[item.sku]}
                    rules={rules}
                    opts={opts}
                    loading={loading}
                    onQty={(q) => cart.setQuantity(item.sku, q)}
                    onRemove={() => cart.removeItem(item.sku)}
                  />
                ))}
              </ul>
            </div>

            <div className="border-t border-slate-200 p-5 space-y-3 bg-white">
              {totals.priced.length > 0 && totals.freeFreightThreshold && (
                <FreeFreightBar threshold={totals.freeFreightThreshold} toFreeFreight={totals.toFreeFreight} progress={totals.freightProgress} />
              )}
              {totals.priced.length > 0 && (
                <dl className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-600">Subtotal ({totals.priced.length} priced line{totals.priced.length > 1 ? 's' : ''})</dt>
                    <dd className="text-xl font-black text-slate-900" data-testid="drawer-subtotal">{loading ? '…' : formatPrice(totals.subtotal)}</dd>
                  </div>
                  {totals.freight && !loading && <FreightRows freight={totals.freight} />}
                </dl>
              )}
              {freightQuote && totals.freight && <FreightQuoteRequired freight={totals.freight} compact />}
              {totals.quote.length > 0 && (
                <p className="text-xs text-orange-800 bg-orange-50 rounded-lg px-3 py-2">
                  {totals.quote.length} item{totals.quote.length > 1 ? 's are' : ' is'} priced by quote and won&apos;t be charged at checkout.
                </p>
              )}
              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
              <div className="grid grid-cols-2 gap-2">
                <Link href="/cart" className="text-center border border-slate-300 hover:border-slate-400 text-slate-800 font-semibold py-3 rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
                  View cart
                </Link>
                {totals.priced.length > 0 && !freightQuote ? (
                  <button
                    type="button"
                    onClick={() => checkout(totals.priced)}
                    disabled={checkingOut || loading || !totals.freight}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl text-sm inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                  >
                    <Lock className="w-4 h-4" aria-hidden />
                    {checkingOut ? 'Redirecting…' : 'Checkout'}
                  </button>
                ) : (
                  <Link href="/bulk-quote?from=cart" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm inline-flex items-center justify-center gap-1.5">
                    <FileText className="w-4 h-4" aria-hidden />
                    Request quote
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
