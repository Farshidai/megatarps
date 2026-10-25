'use client'

import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart/useCart'

/** Navbar cart icon with unit-count badge; opens the mini cart drawer. */
export function CartButton() {
  const { count, hydrated, openDrawer } = useCart()
  const shown = hydrated ? count : 0
  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={shown ? `Open cart, ${shown} units` : 'Open cart'}
      data-testid="cart-button"
      className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
    >
      <ShoppingCart className="w-5 h-5" aria-hidden />
      {shown > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold leading-[18px] text-center" data-testid="cart-count">
          {shown > 999 ? '999+' : shown}
        </span>
      )}
    </button>
  )
}
