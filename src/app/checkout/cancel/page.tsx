import type { Metadata } from 'next'
import Link from 'next/link'
import { ShoppingCart, Phone } from 'lucide-react'

export const metadata: Metadata = { title: 'Checkout cancelled', robots: { index: false, follow: false } }

export default function CheckoutCancelPage() {
  return (
    <div className="bg-slate-50 min-h-[70vh]">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center">
          <ShoppingCart className="w-14 h-14 text-slate-300 mx-auto" aria-hidden />
          <h1 className="text-3xl font-black text-slate-900 mt-4">Checkout cancelled</h1>
          <p className="mt-3 text-slate-600">No payment was taken. Your cart is saved, so you can pick up where you left off.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/cart" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl">Back to cart</Link>
            <Link href="/bulk-quote?from=cart" className="border-2 border-orange-400 text-orange-600 hover:bg-orange-50 font-semibold px-6 py-3 rounded-xl">Request a quote instead</Link>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Questions about pricing or terms?{' '}
            <a href="tel:+19133132691" className="inline-flex items-center gap-1 text-orange-600 font-semibold hover:underline"><Phone className="w-3.5 h-3.5" aria-hidden />(913) 313-2691</a>
          </p>
        </div>
      </div>
    </div>
  )
}
