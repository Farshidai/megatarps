// Server-only data access for client contract prices (table contract_prices, migration 0008).
//  • loadOwnContractPrices(): the signed-in contractor's active rows, read with THEIR
//    session (RLS: contractor_id = auth.uid()) and only the storefront columns.
//  • admin*(): service role, for /admin pages and server actions (callers must
//    requireAdmin() first).
// DEMO MODE: reads come from contract-prices-demo.ts; writes are refused (not saved).
import { cache } from 'react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo'
import { isContractActive, type ContractPrice } from '@/lib/pricing'
import { demoContractPrices, type ContractPriceRow } from '@/lib/contract-prices-demo'

export type { ContractPriceRow } from '@/lib/contract-prices-demo'

/** Columns a contractor may SELECT (must match the GRANT in 0008_contract_prices.sql). */
export const CONTRACT_PRICE_PUBLIC_COLUMNS =
  'id, product_id, sku, unit_price_cents, min_quantity, valid_until, source_quote_id'

const todayUtc = () => new Date().toISOString().slice(0, 10)

function toPublic(r: Pick<ContractPrice, 'id' | 'product_id' | 'sku' | 'unit_price_cents' | 'min_quantity' | 'valid_until' | 'source_quote_id'>): ContractPrice {
  return {
    id: r.id,
    product_id: r.product_id,
    sku: r.sku,
    unit_price_cents: Number(r.unit_price_cents),
    min_quantity: Number(r.min_quantity) || 1,
    valid_until: r.valid_until ? String(r.valid_until).slice(0, 10) : null,
    source_quote_id: r.source_quote_id ?? null,
  }
}

/**
 * Active, unexpired contract prices for this contractor (request-cached).
 * Only call for an APPROVED account; getAccountPricing() does that check.
 */
export const loadOwnContractPrices = cache(async (userId: string): Promise<ContractPrice[]> => {
  if (!userId) return []
  const today = todayUtc()
  if (isDemoMode()) {
    return demoContractPrices().filter((r) => r.contractor_id === userId && isContractActive(r, today)).map(toPublic)
  }
  try {
    const supabase = await createClient() // the visitor's own session → RLS limits rows to theirs
    const { data, error } = await supabase
      .from('contract_prices')
      .select(CONTRACT_PRICE_PUBLIC_COLUMNS)
      .eq('contractor_id', userId)
      .or(`valid_until.is.null,valid_until.gte.${today}`)
      .gt('unit_price_cents', 0)
      .order('sku')
      .limit(500)
    if (error) {
      // table missing (migration not run yet) → behave as "no contract prices"
      if (error.code !== '42P01') console.error('loadOwnContractPrices', error)
      return []
    }
    return ((data ?? []) as unknown as ContractPrice[]).map(toPublic).filter((c) => c.unit_price_cents > 0)
  } catch (e) {
    console.error('loadOwnContractPrices failed', e)
    return []
  }
})

// ---------------------------------------------------------------- admin (service role)

export class DemoNotSaved extends Error {
  constructor() {
    super('Demo mode: not saved in demo.')
  }
}

export async function adminListContractPrices(contractorId: string): Promise<ContractPriceRow[]> {
  if (isDemoMode()) return demoContractPrices().filter((r) => r.contractor_id === contractorId)
  const sb = await createAdminClient()
  const { data, error } = await sb
    .from('contract_prices')
    .select('*')
    .eq('contractor_id', contractorId)
    .order('sku')
    .order('min_quantity')
  if (error) {
    if (error.code !== '42P01') console.error('adminListContractPrices', error)
    return []
  }
  return ((data ?? []) as ContractPriceRow[]).map((r) => ({ ...r, valid_until: r.valid_until ? String(r.valid_until).slice(0, 10) : null }))
}

export interface ContractPriceUpsert {
  contractor_id: string
  product_id: string
  sku: string
  unit_price_cents: number
  min_quantity: number
  valid_until: string | null
  source_quote_id: string | null
  note: string | null
  created_by: string
}

/** Insert or update on (contractor_id, product_id, min_quantity). Returns the number of rows written. */
export async function adminUpsertContractPrices(rows: ContractPriceUpsert[]): Promise<number> {
  if (isDemoMode()) throw new DemoNotSaved()
  if (!rows.length) return 0
  const sb = await createAdminClient()
  const { data, error } = await sb
    .from('contract_prices')
    .upsert(rows, { onConflict: 'contractor_id,product_id,min_quantity' })
    .select('id')
  if (error) throw new Error(error.message)
  return data?.length ?? 0
}

export async function adminUpdateContractPrice(
  id: string,
  contractorId: string,
  patch: { unit_price_cents: number; min_quantity: number; valid_until: string | null },
): Promise<void> {
  if (isDemoMode()) throw new DemoNotSaved()
  const sb = await createAdminClient()
  const { data, error } = await sb
    .from('contract_prices')
    .update(patch)
    .eq('id', id)
    .eq('contractor_id', contractorId)
    .select('id')
  if (error) throw new Error(error.code === '23505' ? 'There is already a contract price for this product at that minimum quantity.' : error.message)
  if (!data?.length) throw new Error('Contract price not found')
}

export async function adminDeleteContractPrice(id: string, contractorId: string): Promise<void> {
  if (isDemoMode()) throw new DemoNotSaved()
  const sb = await createAdminClient()
  const { error } = await sb.from('contract_prices').delete().eq('id', id).eq('contractor_id', contractorId)
  if (error) throw new Error(error.message)
}

/** quote id → quote number, for "source quote" links. */
export async function adminQuoteNumbers(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return {}
  if (isDemoMode()) {
    const { listQuotes } = await import('@/lib/quotes/store')
    const all = await listQuotes()
    return Object.fromEntries(all.filter((q) => unique.includes(q.id)).map((q) => [q.id, q.quote_number]))
  }
  const sb = await createAdminClient()
  const { data } = await sb.from('quotes').select('id, quote_number').in('id', unique)
  return Object.fromEntries(((data ?? []) as { id: string; quote_number: string }[]).map((q) => [q.id, q.quote_number]))
}

/** Product rows for the admin table, including cost (service role; never sent to customers). */
export interface AdminPricedProduct {
  id: string
  xpose_sku: string
  name: string
  slug: string
  retail_price_cents: number
  cost_price_cents: number | null
  min_unit_price_cents: number | null
  tarp_type: string
  thickness_mil: number | null
  units_per_full_pallet: number | null
  active: boolean
}

const ADMIN_PRODUCT_COLUMNS =
  'id, xpose_sku, name, slug, retail_price_cents, cost_price_cents, min_unit_price_cents, tarp_type, thickness_mil, units_per_full_pallet, active'

export async function adminProductsByIdsOrSkus(opts: { ids?: string[]; skus?: string[] }): Promise<AdminPricedProduct[]> {
  const ids = [...new Set((opts.ids ?? []).filter(Boolean))]
  const skus = [...new Set((opts.skus ?? []).map((s) => s.trim()).filter(Boolean))]
  if (!ids.length && !skus.length) return []
  if (isDemoMode()) {
    const { demoProducts } = await import('@/lib/demo')
    const lower = new Set(skus.map((s) => s.toLowerCase()))
    return demoProducts
      .filter((p) => ids.includes(p.id) || lower.has(p.xpose_sku.toLowerCase()))
      .map((p) => {
        const x = p as typeof p & { min_unit_price_cents?: number | null }
        return {
          id: p.id, xpose_sku: p.xpose_sku, name: p.name, slug: p.slug, retail_price_cents: p.retail_price_cents,
          cost_price_cents: p.cost_price_cents ?? null, min_unit_price_cents: x.min_unit_price_cents ?? null,
          tarp_type: p.tarp_type, thickness_mil: p.thickness_mil, units_per_full_pallet: p.units_per_full_pallet ?? null, active: p.active,
        }
      })
  }
  const sb = await createAdminClient()
  const out: AdminPricedProduct[] = []
  if (ids.length) {
    const { data } = await sb.from('products').select(ADMIN_PRODUCT_COLUMNS).in('id', ids.slice(0, 500))
    out.push(...((data ?? []) as AdminPricedProduct[]))
  }
  for (const sku of skus.slice(0, 50)) {
    if (out.some((p) => p.xpose_sku.toLowerCase() === sku.toLowerCase())) continue
    const { data } = await sb.from('products').select(ADMIN_PRODUCT_COLUMNS).ilike('xpose_sku', sku.replace(/[%_]/g, '')).limit(1)
    if (data?.[0]) out.push(data[0] as AdminPricedProduct)
  }
  return out
}
