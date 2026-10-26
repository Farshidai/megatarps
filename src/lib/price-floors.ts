// Server-only: price floors (products.min_unit_price_cents ≈ cost × 1.15).
// The column is NOT readable by anon / authenticated (0099_column_privileges.sql) because
// floor ÷ 1.15 reveals cost, so it is loaded here with the service-role client and merged
// into product objects that only server code prices with. Never import from client code;
// strip the field (toPublicProduct) before a product crosses to a client component.
//
// Fail-closed: if the floors can't be loaded, every product's floor becomes its retail
// price (no discounts below list) instead of "no floor" (which could sell below cost).
import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo'
import catalog from '@/data/demo-catalog.json'

type FloorMap = Map<string, number | null>

/** product id → floor (null = no floor set). null result = floors unavailable (fail closed). */
export const loadPriceFloors = cache(async (): Promise<FloorMap | null> => {
  if (isDemoMode()) {
    const rows = (catalog as unknown as { products: { id: string; min_unit_price_cents?: number | null }[] }).products
    return new Map(rows.map((p) => [p.id, p.min_unit_price_cents ?? null]))
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!key || /placeholder/i.test(key)) {
    console.error('price floors: SUPABASE_SERVICE_ROLE_KEY is not configured; pricing at list price (no discounts below retail)')
    return null
  }
  try {
    const sb = await createAdminClient()
    const map: FloorMap = new Map()
    for (let from = 0; from < 20000; from += 1000) {
      const { data, error } = await sb.from('products').select('id, min_unit_price_cents').order('id').range(from, from + 999)
      if (error) throw new Error(error.message)
      for (const r of (data ?? []) as { id: string; min_unit_price_cents: number | null }[]) map.set(r.id, r.min_unit_price_cents)
      if (!data || data.length < 1000) break
    }
    return map
  } catch (e) {
    console.error('price floors: load failed; pricing at list price', e)
    return null
  }
})

type WithFloor<T> = T & { min_unit_price_cents: number | null }

/** Same products with min_unit_price_cents from the service-role map (server-side pricing only). */
export async function withPriceFloors<T extends { id: string; retail_price_cents: number }>(products: T[]): Promise<WithFloor<T>[]> {
  if (!products.length) return []
  const floors = await loadPriceFloors()
  return products.map((p) => ({
    ...p,
    // unknown product or floors unavailable → floor = retail (fail closed)
    min_unit_price_cents: floors ? (floors.has(p.id) ? floors.get(p.id)! : p.retail_price_cents) : p.retail_price_cents,
  }))
}

export async function withPriceFloor<T extends { id: string; retail_price_cents: number }>(product: T): Promise<WithFloor<T>> {
  return (await withPriceFloors([product]))[0]
}
