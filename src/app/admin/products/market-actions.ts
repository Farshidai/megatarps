'use server'

// "Reprice from market" + the market prices panel on /admin/products.
// Every action re-checks requireAdmin() on the server (server actions are reachable by
// direct POST). Save recomputes every price from the database; it never trusts numbers
// sent by the browser — the browser only sends SKUs, the percent and the source.
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/server'
import { loadMarketObservations, loadRepriceProducts } from '@/lib/market'
import { repriceRows, marketSkuFor, observationsFor, type MarketObservation, type RepriceRow } from '@/lib/reprice'

const MAX_SKUS = 2000

export interface RepriceRequest {
  skus: string[]
  /** X in "market − X%"; default 5 */
  percent: number
  /** source name, or null/'' for any source */
  source: string | null
}

export interface RepricePreview {
  ok: boolean
  message: string
  rows: RepriceRow[]
  demo: boolean
}

export interface RepriceSaveResult {
  ok: boolean
  demo: boolean
  saved: number
  message: string
  errors: string[]
  /** sku → new retail, for rows that were written */
  updated: Record<string, number>
}

function cleanRequest(req: RepriceRequest): { skus: string[]; percent: number; source: string | null } | string {
  if (!req || !Array.isArray(req.skus)) return 'No products selected.'
  const skus = [...new Set(req.skus.filter((s) => typeof s === 'string' && s.trim() && s.length <= 64).map((s) => s.trim()))]
  if (!skus.length) return 'No products selected.'
  if (skus.length > MAX_SKUS) return `Too many products (max ${MAX_SKUS}).`
  const percent = Number(req.percent)
  if (!Number.isFinite(percent) || percent < 0 || percent >= 100) return 'Percent below market must be from 0 to 99.'
  const source = typeof req.source === 'string' && req.source.trim() ? req.source.trim().slice(0, 200) : null
  return { skus, percent, source }
}

async function compute(skus: string[], percent: number, source: string | null): Promise<RepriceRow[]> {
  const products = await loadRepriceProducts(skus)
  const marketSkus = products.flatMap((p) => [p.xpose_sku, p.xpose_sku.replace(/-X$/i, ''), marketSkuFor(p) ?? '']).filter(Boolean)
  const obs = await loadMarketObservations(marketSkus)
  return repriceRows(products, obs, percent, source)
}

/** Preview only — writes nothing. */
export async function previewRepriceFromMarket(req: RepriceRequest): Promise<RepricePreview> {
  const admin = await requireAdmin('/admin/products')
  const clean = cleanRequest(req)
  if (typeof clean === 'string') return { ok: false, message: clean, rows: [], demo: admin.demo }
  const rows = await compute(clean.skus, clean.percent, clean.source)
  const changing = rows.filter((r) => r.status === 'ok' || r.status === 'floor').length
  return {
    ok: true,
    demo: admin.demo,
    rows,
    message: `${changing} of ${rows.length} product${rows.length === 1 ? '' : 's'} would change.`,
  }
}

/** Recomputes server-side and writes retail_price_cents for rows that change. */
export async function saveRepriceFromMarket(req: RepriceRequest): Promise<RepriceSaveResult> {
  const admin = await requireAdmin('/admin/products')
  const clean = cleanRequest(req)
  if (typeof clean === 'string') return { ok: false, demo: admin.demo, saved: 0, message: clean, errors: [], updated: {} }
  const rows = (await compute(clean.skus, clean.percent, clean.source)).filter((r) => r.status === 'ok' || r.status === 'floor')
  if (!rows.length) return { ok: true, demo: admin.demo, saved: 0, message: 'Nothing to change.', errors: [], updated: {} }
  if (admin.demo) {
    return {
      ok: false,
      demo: true,
      saved: 0,
      message: `Demo mode: ${rows.length} new price${rows.length === 1 ? '' : 's'} computed but not saved in demo.`,
      errors: [],
      updated: {},
    }
  }
  const sb = await createAdminClient()
  const errors: string[] = []
  const updated: Record<string, number> = {}
  for (let i = 0; i < rows.length; i += 25) {
    const chunk = rows.slice(i, i + 25)
    const results = await Promise.all(
      chunk.map((r) => sb.from('products').update({ retail_price_cents: r.new_retail_cents }).eq('xpose_sku', r.sku).select('xpose_sku')),
    )
    results.forEach((res, j) => {
      const r = chunk[j]
      if (res.error) errors.push(`${r.sku}: ${res.error.message}`)
      else if (!res.data?.length) errors.push(`${r.sku}: SKU not found`)
      else updated[r.sku] = r.new_retail_cents
    })
  }
  revalidatePath('/admin/products')
  revalidatePath('/products', 'layout')
  revalidatePath('/product/[slug]', 'page')
  revalidatePath('/')
  const saved = Object.keys(updated).length
  return {
    ok: errors.length === 0,
    demo: false,
    saved,
    updated,
    errors,
    message: `Repriced ${saved} product${saved === 1 ? '' : 's'} from market − ${clean.percent}%${errors.length ? `, ${errors.length} problem${errors.length === 1 ? '' : 's'}` : ''}.`,
  }
}

export interface MarketPanelData {
  sku: string
  market_sku: string | null
  observations: MarketObservation[]
}

/** Every market observation for one product (own SKU + mapped Xpose SKU). Admin only. */
export async function getMarketObservations(sku: string): Promise<MarketPanelData> {
  await requireAdmin('/admin/products')
  if (typeof sku !== 'string' || !sku.trim() || sku.length > 64) return { sku: String(sku), market_sku: null, observations: [] }
  const [p] = await loadRepriceProducts([sku.trim()])
  if (!p) return { sku, market_sku: null, observations: [] }
  const mapped = marketSkuFor(p)
  const obs = await loadMarketObservations([p.xpose_sku, p.xpose_sku.replace(/-X$/i, ''), mapped ?? ''].filter(Boolean))
  return { sku: p.xpose_sku, market_sku: mapped, observations: observationsFor(p, obs) }
}
