// Server-only: market_observations (admin reference prices) and the product fields the
// "Reprice from market" action needs (cost / floor). Uses the service-role client — never
// import from client components. Callers must check admin first (checkAdmin / requireAdmin).
import catalog from '@/data/demo-catalog.json'
import { createAdminClient } from '@/lib/supabase/server'
import { isDemoMode, demoProducts } from '@/lib/demo'
import type { MarketObservation, RepriceProduct } from '@/lib/reprice'

const REPRICE_COLUMNS =
  'xpose_sku, name, tarp_type, thickness_mil, width_ft, length_ft, color, pack_quantity, retail_price_cents, cost_price_cents, min_unit_price_cents'

const demoObservations = ((catalog as unknown as { market_observations?: MarketObservation[] }).market_observations ?? [])

/** Observations for these SKUs (upper-cased), or all of them when skus is omitted. */
export async function loadMarketObservations(skus?: string[]): Promise<MarketObservation[]> {
  const keys = skus ? [...new Set(skus.map((s) => s.trim().toUpperCase()).filter(Boolean))] : null
  if (keys && !keys.length) return []
  if (isDemoMode()) return keys ? demoObservations.filter((o) => keys.includes(o.sku.toUpperCase())) : demoObservations
  const sb = await createAdminClient()
  const out: MarketObservation[] = []
  const chunks = keys ? Array.from({ length: Math.ceil(keys.length / 200) }, (_, i) => keys.slice(i * 200, i * 200 + 200)) : [null]
  for (const chunk of chunks) {
    let q = sb
      .from('market_observations')
      .select('sku, source, kind, units, price_cents, per_unit_cents, url, note, checked_at')
      .order('checked_at', { ascending: false })
      .limit(5000)
    if (chunk) q = q.in('sku', chunk)
    const { data, error } = await q
    if (error) {
      if (error.code !== '42P01') console.error('loadMarketObservations', error) // table missing → no data
      return out
    }
    out.push(...((data ?? []) as MarketObservation[]).map((o) => ({ ...o, checked_at: String(o.checked_at).slice(0, 10) })))
  }
  return out
}

/** Products (with cost and floor) by SKU, for repricing. */
export async function loadRepriceProducts(skus: string[]): Promise<RepriceProduct[]> {
  const wanted = new Set(skus.map((s) => s.trim()).filter(Boolean))
  if (!wanted.size) return []
  if (isDemoMode()) {
    return demoProducts.filter((p) => wanted.has(p.xpose_sku)).map((p) => {
      const x = p as typeof p & { min_unit_price_cents?: number | null; pack_quantity?: number | null }
      return {
        xpose_sku: p.xpose_sku, name: p.name, tarp_type: p.tarp_type, thickness_mil: p.thickness_mil, width_ft: p.width_ft,
        length_ft: p.length_ft, color: p.color, pack_quantity: x.pack_quantity ?? null, retail_price_cents: p.retail_price_cents,
        cost_price_cents: p.cost_price_cents ?? null, min_unit_price_cents: x.min_unit_price_cents ?? null,
      }
    })
  }
  const sb = await createAdminClient()
  const list = [...wanted]
  const out: RepriceProduct[] = []
  for (let i = 0; i < list.length; i += 200) {
    const { data, error } = await sb.from('products').select(REPRICE_COLUMNS).in('xpose_sku', list.slice(i, i + 200))
    if (error) throw new Error(error.message)
    out.push(...((data ?? []) as RepriceProduct[]))
  }
  return out
}
