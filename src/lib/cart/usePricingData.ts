'use client'

// Fetches display pricing data (rules, wholesale %, slim products) for a set of SKUs.
import { useEffect, useState } from 'react'
import type { PricingRule } from '@/lib/pricing'
import type { CatalogEntry } from './catalog-types'
import type { FreightConfig } from '@/lib/freight'

export interface PricingData {
  rules: PricingRule[]
  wholesaleDiscountPercent: number
  products: Record<string, CatalogEntry>
  freight: FreightConfig | null
}

const cache = new Map<string, PricingData>()

export function usePricingData(skus: string[], enabled = true): { data: PricingData | null; loading: boolean } {
  const key = [...new Set(skus)].sort().join(',')
  const [state, setState] = useState<{ key: string; data: PricingData | null }>({ key: '', data: null })

  useEffect(() => {
    if (!enabled || cache.has(key)) return
    let cancelled = false
    fetch(`/api/pricing-rules?skus=${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: { rules: PricingRule[]; wholesaleDiscountPercent: number; products: CatalogEntry[]; freight?: FreightConfig }) => {
        const data: PricingData = {
          rules: json.rules ?? [],
          wholesaleDiscountPercent: json.wholesaleDiscountPercent ?? 0,
          products: Object.fromEntries((json.products ?? []).map((p) => [p.sku, p])),
          freight: json.freight ?? null,
        }
        cache.set(key, data)
        if (!cancelled) setState({ key, data })
      })
      .catch(() => {
        if (!cancelled) setState({ key, data: null })
      })
    return () => {
      cancelled = true
    }
  }, [key, enabled])

  const data = cache.get(key) ?? (state.key === key ? state.data : null)
  return { data, loading: enabled && !data }
}
