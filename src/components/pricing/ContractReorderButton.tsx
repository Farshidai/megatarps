'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RotateCcw, Check } from 'lucide-react'
import { useCart } from '@/lib/cart/useCart'
import type { CartItem } from '@/lib/cart/types'

/** "Reorder at contract price": adds the contract's minimum quantity to the cart (prices are re-checked at checkout). */
export function ContractReorderButton({ item, label = 'Reorder at contract price' }: { item: CartItem; label?: string }) {
  const cart = useCart()
  const [done, setDone] = useState(false)
  return (
    <div className="flex flex-col items-stretch sm:items-end gap-1">
      <button
        type="button"
        onClick={() => {
          cart.addItems([item])
          setDone(true)
          cart.openDrawer()
        }}
        className="inline-flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-3.5 py-2 rounded-lg whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        data-testid="contract-reorder"
      >
        {done ? <Check className="w-4 h-4" aria-hidden /> : <RotateCcw className="w-4 h-4" aria-hidden />}
        {done ? `Added ${item.quantity.toLocaleString('en-US')} to cart` : label}
      </button>
      {done && <Link href="/cart" className="text-xs font-semibold text-orange-600 hover:underline text-center sm:text-right">Go to cart →</Link>}
    </div>
  )
}
