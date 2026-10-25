import type { Metadata } from 'next'
import { CartPageClient } from '@/components/cart/CartPageClient'

export const metadata: Metadata = {
  title: 'Cart',
  robots: { index: false, follow: false },
}

export default function CartPage() {
  return (
    <div className="bg-slate-50 min-h-[70vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <CartPageClient />
      </div>
    </div>
  )
}
