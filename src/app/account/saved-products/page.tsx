import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Saved Products' }

export default function SavedProductsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black text-slate-900">Saved Products</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-slate-400 text-sm mb-4">
          Product saving is coming soon. For now, bookmark individual product pages or
          include them directly in a bulk quote request.
        </p>
        <Link href="/products"
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
          Browse Products
        </Link>
      </div>
    </div>
  )
}
