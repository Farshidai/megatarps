'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RotateCcw, Check } from 'lucide-react'
import { useCart } from '@/lib/cart/useCart'
import type { CartItem } from '@/lib/cart/types'

/** Puts a past order's lines back in the cart (quantities merge with what's already there). */
export function ReorderButton({ items, unavailable = [] }: { items: CartItem[]; unavailable?: string[] }) {
  const cart = useCart()
  const [done, setDone] = useState(false)
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={!items.length}
        onClick={() => {
          cart.addItems(items)
          setDone(true)
          cart.openDrawer()
        }}
        className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold text-sm px-4 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        data-testid="reorder-button"
      >
        {done ? <Check className="w-4 h-4" aria-hidden /> : <RotateCcw className="w-4 h-4" aria-hidden />}
        {done ? 'Added to cart' : 'Reorder'}
      </button>
      {done && <Link href="/cart" className="text-xs font-semibold text-orange-600 hover:underline">Go to cart →</Link>}
      {unavailable.length > 0 && <p className="text-xs text-slate-400">{unavailable.length} item{unavailable.length > 1 ? 's' : ''} no longer available</p>}
    </div>
  )
}
