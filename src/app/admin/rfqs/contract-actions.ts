'use server'

// "Save as client's contract prices" from the admin quote builder (Team F).
// Prices come from the quote as stored on the server, never from the browser; the dialog
// only chooses which lines, each line's min quantity, and the valid-until date.
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin'
import { isDemoMode } from '@/lib/demo'
import { getQuoteById } from '@/lib/quotes/store'
import { effectiveStatus } from '@/lib/quotes/types'
import { adminUpsertContractPrices } from '@/lib/contract-prices'
import { contractRowsFromQuote, loadProductsForQuoteItems } from '@/lib/quote-contracts'
import { CONTRACT_SAVE_STATUSES, parseMinQty, parseValidUntil } from '@/lib/contract-prices-input'
import { formatPrice } from '@/lib/utils'

export interface SaveContractInput {
  quoteId: string
  validUntil: string // YYYY-MM-DD or '' for no end date
  lines: { index: number; min_quantity: number }[]
}

export type SaveContractResult =
  | { ok: true; message: string; demo?: boolean; saved: number }
  | { ok: false; error: string }

export async function saveQuoteAsContractPrices(input: SaveContractInput): Promise<SaveContractResult> {
  const admin = await requireAdmin() // server actions are public POST endpoints: always re-check
  const quote = await getQuoteById(String(input?.quoteId ?? ''))
  if (!quote) return { ok: false, error: 'Quote not found' }
  if (!quote.contractor_id) {
    return { ok: false, error: 'Client has no wholesale account. Invite them to /apply to save contract prices.' }
  }
  const status = effectiveStatus(quote)
  if (!(CONTRACT_SAVE_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: `Only a quoted, accepted or ordered quote can become contract prices (this one is ${status}).` }
  }

  let validUntil: string | null
  try {
    validUntil = parseValidUntil(input.validUntil)
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  const picks = Array.isArray(input.lines) ? input.lines.slice(0, 100) : []
  if (!picks.length) return { ok: false, error: 'Pick at least one line to save' }

  const items = quote.items
  const chosen: { item: (typeof items)[number]; min_quantity: number }[] = []
  for (const p of picks) {
    const idx = Number(p?.index)
    const item = Number.isInteger(idx) ? items[idx] : undefined
    if (!item) return { ok: false, error: 'A selected line is no longer on this quote. Reload and try again.' }
    if (!(Number.isInteger(item.unit_price_cents) && item.unit_price_cents > 0)) {
      return { ok: false, error: `“${item.name || item.sku}” has no price on the quote` }
    }
    try {
      chosen.push({ item, min_quantity: parseMinQty(p.min_quantity) })
    } catch (e) {
      return { ok: false, error: `${item.sku}: ${(e as Error).message}` }
    }
  }

  // shared with the automatic save on accept / payment (src/lib/quote-contracts.ts)
  const products = await loadProductsForQuoteItems(chosen.map((c) => c.item))
  const { rows: list, skipped } = contractRowsFromQuote(quote, chosen, products, { validUntil, createdBy: admin.email })
  if (skipped.length) {
    const item = skipped[0]
    return { ok: false, error: `“${item.name || item.sku}” is a custom line, not a catalog product, so it can’t be a contract price` }
  }
  const summary = list.map((r) => `${r.sku} ${formatPrice(r.unit_price_cents)}${r.min_quantity > 1 ? ` @${r.min_quantity}+` : ''}`).join(', ')
  if (admin.demo || isDemoMode()) {
    return {
      ok: true,
      demo: true,
      saved: 0,
      message: `Demo mode: ${list.length} contract price${list.length === 1 ? '' : 's'} (${summary}) would be saved for this client. Not saved in demo.`,
    }
  }

  try {
    const saved = await adminUpsertContractPrices(list)
    revalidatePath(`/admin/rfqs/${quote.id}`)
    revalidatePath(`/admin/accounts/${quote.contractor_id}`)
    revalidatePath('/account')
    return { ok: true, saved, message: `Saved ${saved} contract price${saved === 1 ? '' : 's'} to the client’s account${validUntil ? `, valid through ${validUntil}` : ''}.` }
  } catch (e) {
    const msg = (e as Error).message
    console.error('saveQuoteAsContractPrices', msg)
    if (/foreign key|violates/i.test(msg)) return { ok: false, error: 'The client’s wholesale account record is missing, so prices could not be saved.' }
    return { ok: false, error: 'Could not save contract prices. Is migration 0008_contract_prices.sql applied?' }
  }
}
