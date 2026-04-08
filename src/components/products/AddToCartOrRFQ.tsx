'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, FileText, Minus, Plus } from 'lucide-react'
import { formatPrice, BULK_THRESHOLD } from '@/lib/utils'
import type { Product } from '@/types'

interface Props {
  product: Product
}

export function AddToCartOrRFQ({ product }: Props) {
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)

  const isBulk = qty >= BULK_THRESHOLD

  const handleBuyNow = async () => {
    if (!product.in_stock) return
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ product_id: product.id, sku: product.xpose_sku, quantity: qty }],
        }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkQuote = () => {
    const params = new URLSearchParams({
      sku: product.xpose_sku,
      name: product.name,
      qty: String(qty),
    })
    router.push(`/bulk-quote?${params.toString()}`)
  }

  const total = product.retail_price_cents * qty

  return (
    <div className="space-y-4">
      {/* Quantity */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Quantity</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-10 h-10 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 text-center border border-slate-300 rounded-lg py-2 text-lg font-bold focus:outline-none focus:border-orange-400"
          />
          <button
            onClick={() => setQty(qty + 1)}
            className="w-10 h-10 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk notice */}
      {isBulk && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
          <strong>Bulk order ({qty} units)</strong> — Request a quote for wholesale pricing.
          Our team responds within 4 business hours.
        </div>
      )}

      {/* Price */}
      {product.retail_price_cents > 0 && (
        <div className="flex items-end gap-3">
          <div>
            <p className="text-sm text-slate-500">Total ({qty} unit{qty > 1 ? 's' : ''})</p>
            <p className="text-3xl font-black text-slate-900">{formatPrice(total)}</p>
          </div>
          {qty > 1 && (
            <p className="text-slate-400 text-sm pb-1">{formatPrice(product.retail_price_cents)} each</p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        {isBulk ? (
          <button
            onClick={handleBulkQuote}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors text-lg"
          >
            <FileText className="w-5 h-5" />
            Request Bulk Quote
          </button>
        ) : (
          <button
            onClick={handleBuyNow}
            disabled={!product.in_stock || loading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors text-lg"
          >
            <ShoppingCart className="w-5 h-5" />
            {loading ? 'Processing…' : product.in_stock ? 'Buy Now' : 'Out of Stock'}
          </button>
        )}

        {!isBulk && (
          <button
            onClick={handleBulkQuote}
            className="w-full border-2 border-orange-400 text-orange-600 hover:bg-orange-50 font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Need 5+? Get bulk pricing
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Secure checkout via Stripe · Ships nationwide
      </p>
    </div>
  )
}
