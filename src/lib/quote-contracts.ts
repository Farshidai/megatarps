// Server-only: turn a quote's line prices into the client's contract prices (Team F's
// contract_prices table). Used by
//  • the admin "Save as client's contract prices" action (chosen lines / min qty / end date), and
//  • automatically when an APPROVED account accepts a quote on Net terms or pays it
//    (/api/quotes/[token]/accept and the Stripe webhook): every catalog line, min_quantity 1,
//    valid 90 days. The quote email promises this. Admin can still edit or delete them on
//    /admin/accounts/[id].
// Prices always come from the quote stored on the server, never from the browser.
import { isDemoMode } from '@/lib/demo'
import { adminProductsByIdsOrSkus, adminUpsertContractPrices, type AdminPricedProduct, type ContractPriceUpsert } from '@/lib/contract-prices'
import { DEFAULT_CONTRACT_DAYS, defaultValidUntil } from '@/lib/contract-prices-input'
import type { QuoteLine } from '@/lib/quotes/types'

export interface QuoteForContracts {
  id: string
  quote_number: string
  contractor_id: string | null
  items: QuoteLine[]
}

export interface ContractPick {
  item: QuoteLine
  min_quantity: number
}

/**
 * Contract rows for the picked quote lines. Lines that aren't catalog products are reported in
 * `skipped` (custom lines can't be contract prices). One row per (product, min_quantity).
 */
export function contractRowsFromQuote(
  quote: QuoteForContracts,
  picks: ContractPick[],
  products: AdminPricedProduct[],
  opts: { validUntil: string | null; createdBy: string },
): { rows: ContractPriceUpsert[]; skipped: QuoteLine[] } {
  if (!quote.contractor_id) return { rows: [], skipped: picks.map((p) => p.item) }
  const byId = new Map(products.map((p) => [p.id, p]))
  const bySku = new Map(products.map((p) => [p.xpose_sku.toLowerCase(), p]))
  const rows = new Map<string, ContractPriceUpsert>()
  const skipped: QuoteLine[] = []
  for (const { item, min_quantity } of picks) {
    const product = (item.product_id && byId.get(item.product_id)) || bySku.get(String(item.sku ?? '').toLowerCase())
    if (!product || !(Number.isInteger(item.unit_price_cents) && item.unit_price_cents > 0)) {
      skipped.push(item)
      continue
    }
    rows.set(`${product.id}:${min_quantity}`, {
      contractor_id: quote.contractor_id,
      product_id: product.id,
      sku: product.xpose_sku,
      unit_price_cents: item.unit_price_cents,
      min_quantity,
      valid_until: opts.validUntil,
      source_quote_id: quote.id,
      note: `From quote ${quote.quote_number}`,
      created_by: opts.createdBy,
    })
  }
  return { rows: [...rows.values()], skipped }
}

export async function loadProductsForQuoteItems(items: QuoteLine[]): Promise<AdminPricedProduct[]> {
  return adminProductsByIdsOrSkus({
    ids: items.map((i) => i.product_id ?? '').filter(Boolean),
    skus: items.map((i) => i.sku ?? '').filter(Boolean),
  })
}

export type AutoSaveResult = { saved: number; demo?: boolean; skipped?: string }

/**
 * Called when an approved account's quote is accepted (Net terms) or paid. Never throws:
 * a failure here must not undo the order; it is logged and returned.
 * `approved` must already be verified by the caller (netTermsFor / isContractorApproved).
 */
export async function autoSaveQuoteContractPrices(quote: QuoteForContracts, approved: boolean, now = Date.now()): Promise<AutoSaveResult> {
  try {
    if (!quote.contractor_id) return { saved: 0, skipped: 'no wholesale account' }
    if (!approved) return { saved: 0, skipped: 'account not approved' }
    const picks = quote.items.filter((i) => i.unit_price_cents > 0).map((item) => ({ item, min_quantity: 1 }))
    if (!picks.length) return { saved: 0, skipped: 'no priced lines' }
    const products = await loadProductsForQuoteItems(picks.map((p) => p.item))
    const { rows } = contractRowsFromQuote(quote, picks, products, {
      validUntil: defaultValidUntil(now, DEFAULT_CONTRACT_DAYS),
      createdBy: 'auto: quote accepted',
    })
    if (!rows.length) return { saved: 0, skipped: 'no catalog lines' }
    if (isDemoMode()) return { saved: 0, demo: true }
    return { saved: await adminUpsertContractPrices(rows) }
  } catch (e) {
    console.error('autoSaveQuoteContractPrices failed', quote.id, (e as Error).message)
    return { saved: 0, skipped: 'error' }
  }
}
