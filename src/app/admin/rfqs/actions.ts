'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin'
import { addEvent, getQuoteById, isContractorApproved, setAdminNotes, updateQuote } from '@/lib/quotes/store'
import { emailQuoteSent } from '@/lib/quotes/emails'
import { computeTotals, type QuoteLine, type QuoteStatus } from '@/lib/quotes/types'

export interface BuilderInput {
  id: string
  lines: { product_id: string | null; sku: string; name: string; quantity: number; unit_price_cents: number; quote_only?: boolean }[]
  freight_cents: number
  tax_cents: number
  discount_cents: number
  valid_until: string // YYYY-MM-DD
  customer_message: string
  admin_notes: string
}

export type BuilderResult = { ok: true; message: string } | { ok: false; error: string }

const EDITABLE: QuoteStatus[] = ['pending', 'quoted', 'expired', 'declined']
const cents = (n: unknown, max = 100_000_000) => {
  const v = Math.round(Number(n))
  return Number.isFinite(v) && v >= 0 && v <= max ? v : NaN
}

async function persist(input: BuilderInput, mode: 'draft' | 'send'): Promise<BuilderResult> {
  const admin = await requireAdmin() // re-check inside every action: actions are public POST endpoints
  const quote = await getQuoteById(String(input?.id ?? ''))
  if (!quote) return { ok: false, error: 'Quote not found' }
  if (!EDITABLE.includes(quote.status)) return { ok: false, error: `A ${quote.status} quote can't be edited` }

  const rawLines = Array.isArray(input.lines) ? input.lines.slice(0, 60) : []
  const lines: QuoteLine[] = []
  for (const l of rawLines) {
    const quantity = Math.floor(Number(l.quantity))
    const unit = cents(l.unit_price_cents, 10_000_000)
    const name = String(l.name ?? '').trim().slice(0, 300)
    if (!name && !l.sku) continue
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 100000) return { ok: false, error: `Check the quantity on “${name || l.sku}”` }
    if (Number.isNaN(unit)) return { ok: false, error: `Check the unit price on “${name || l.sku}”` }
    lines.push({
      product_id: l.product_id || null,
      sku: String(l.sku ?? '').slice(0, 60),
      name,
      quantity,
      unit_price_cents: unit,
      line_total: unit * quantity,
      quote_only: !!l.quote_only,
    })
  }
  if (!lines.length) return { ok: false, error: 'A quote needs at least one line' }

  const freight = cents(input.freight_cents)
  const tax = cents(input.tax_cents)
  const discount = cents(input.discount_cents)
  if ([freight, tax, discount].some(Number.isNaN)) return { ok: false, error: 'Freight, tax and discount must be valid amounts' }

  const totals = computeTotals(lines, { freight_cents: freight, tax_cents: tax, discount_cents: discount })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.valid_until ?? '')) return { ok: false, error: 'Pick a valid-until date' }
  const validUntil = new Date(`${input.valid_until}T23:59:59-06:00`) // end of day, Central

  if (mode === 'send') {
    const unpriced = lines.find((l) => l.unit_price_cents <= 0)
    if (unpriced) return { ok: false, error: `Price every line before sending (“${unpriced.name || unpriced.sku}” is $0)` }
    if (totals.total_cents < 50) return { ok: false, error: 'Total must be at least $0.50' }
    if (validUntil.getTime() < Date.now()) return { ok: false, error: 'Valid-until must be in the future' }
    if (!quote.guest_email) return { ok: false, error: 'This quote has no customer email' }
  }

  const now = new Date().toISOString()
  const updated = await updateQuote(quote.id, {
    items: lines,
    subtotal_cents: totals.subtotal_cents,
    freight_cents: totals.freight_cents,
    shipping_estimate_cents: totals.freight_cents,
    tax_cents: totals.tax_cents,
    discount_cents: totals.discount_cents,
    total_cents: totals.total_cents,
    valid_until: validUntil.toISOString(),
    customer_message: String(input.customer_message ?? '').slice(0, 4000) || null,
    quoted_by: admin.email,
    ...(mode === 'send'
      ? { status: 'quoted' as const, sent_at: now, quoted_at: now, declined_reason: null }
      : {}),
  })
  await setAdminNotes(quote.id, String(input.admin_notes ?? '').slice(0, 8000))
  if (!updated) return { ok: false, error: 'Save failed' }

  if (mode === 'send') {
    await addEvent(quote.id, 'sent', `Emailed to ${updated.guest_email} by ${admin.email}`)
    try {
      const approved = updated.contractor_id ? await isContractorApproved(updated.contractor_id) : false
      await emailQuoteSent(updated, { accountState: approved ? 'approved' : updated.contractor_id ? 'unapproved' : 'guest' })
    } catch (e) {
      console.error('quote email failed', e)
      revalidatePath(`/admin/rfqs/${quote.id}`)
      return { ok: true, message: 'Quote saved and marked sent, but the email failed — copy the customer link and send it manually.' }
    }
  }

  revalidatePath('/admin/rfqs')
  revalidatePath(`/admin/rfqs/${quote.id}`)
  revalidatePath(`/quote/${quote.public_token}`)
  return { ok: true, message: mode === 'send' ? `Quote sent to ${updated.guest_email}` : 'Draft saved' }
}

export async function saveQuoteDraft(input: BuilderInput): Promise<BuilderResult> {
  return persist(input, 'draft')
}

export async function sendQuote(input: BuilderInput): Promise<BuilderResult> {
  return persist(input, 'send')
}
