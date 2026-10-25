'use client'

import { useState } from 'react'
import type { CartItem } from './types'

/** Sends only {sku, quantity} to /api/checkout and redirects to Stripe (or the demo success page). */
export function useCheckout() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkout = async (items: CartItem[]) => {
    const lines = items.filter((i) => !i.quote_only).map((i) => ({ sku: i.sku, quantity: i.quantity }))
    if (!lines.length) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lines }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Checkout failed. Please try again.')
      window.location.assign(data.url)
    } catch (e) {
      setError((e as Error).message)
      setLoading(false)
    }
  }

  return { checkout, loading, error }
}
