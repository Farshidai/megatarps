// Server-only quote data access. Uses the Supabase service role (token links and admin
// pages are authorized in code, not by RLS). In DEMO MODE, reads/writes a process-wide
// in-memory store seeded with sample quotes.
import { randomBytes } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo'
import { generateOrderNumber, generateQuoteNumber } from '@/lib/utils'
import { buildDemoQuotes } from './demo-data'
import {
  effectiveStatus,
  type QuoteEvent,
  type QuoteEventType,
  type QuoteRecord,
  type QuoteStatus,
} from './types'

// ---------- demo store ----------
interface DemoStore {
  quotes: QuoteRecord[]
  events: QuoteEvent[]
  notes: Record<string, string>
  orders: { order_number: string; quote_id: string; payment_status: string; total_cents: number; created_at: string }[]
}
const g = globalThis as unknown as { __mtDemoQuotes?: DemoStore }
function demo(): DemoStore {
  if (!g.__mtDemoQuotes) g.__mtDemoQuotes = { ...buildDemoQuotes(), orders: [] }
  return g.__mtDemoQuotes
}

export function newPublicToken(): string {
  return randomBytes(24).toString('base64url') // 192 bits, URL-safe
}

function normalize(row: Record<string, unknown>): QuoteRecord {
  const r = row as unknown as QuoteRecord
  return {
    ...r,
    items: Array.isArray(r.items) ? r.items : [],
    freight_cents: Number(r.freight_cents ?? r.shipping_estimate_cents ?? 0),
    tax_cents: Number(r.tax_cents ?? 0),
    discount_cents: Number(r.discount_cents ?? 0),
  }
}

// ---------- reads ----------
export async function listQuotes(status?: QuoteStatus | 'all'): Promise<QuoteRecord[]> {
  if (isDemoMode()) {
    const all = [...demo().quotes].sort((a, b) => b.created_at.localeCompare(a.created_at))
    return !status || status === 'all' ? all : all.filter((q) => effectiveStatus(q) === status)
  }
  const supabase = await createAdminClient()
  let query = supabase.from('quotes').select('*').order('created_at', { ascending: false }).limit(500)
  if (status && status !== 'all') query = query.eq('status', status)
  const { data, error } = await query
  if (error) {
    console.error('listQuotes error:', error)
    return []
  }
  return (data ?? []).map(normalize)
}

export async function getQuoteById(id: string): Promise<QuoteRecord | null> {
  if (isDemoMode()) return demo().quotes.find((q) => q.id === id) ?? null
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const supabase = await createAdminClient()
  const { data } = await supabase.from('quotes').select('*').eq('id', id).maybeSingle()
  return data ? normalize(data) : null
}

export async function getQuoteByToken(token: string): Promise<QuoteRecord | null> {
  if (!token || token.length > 128) return null
  let q: QuoteRecord | null
  if (isDemoMode()) {
    q = demo().quotes.find((x) => x.public_token === token) ?? null
  } else {
    const supabase = await createAdminClient()
    const { data } = await supabase.from('quotes').select('*').eq('public_token', token).maybeSingle()
    q = data ? normalize(data) : null
  }
  // persist lazy expiry so the admin list agrees with what the customer sees
  if (q && q.status === 'quoted' && effectiveStatus(q) === 'expired') {
    q = (await updateQuote(q.id, { status: 'expired' })) ?? q
  }
  return q
}

export async function listQuotesForContractor(userId: string): Promise<QuoteRecord[]> {
  if (isDemoMode()) return listQuotes()
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('quotes')
    .select('*')
    .eq('contractor_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(normalize)
}

export async function listEvents(quoteId: string): Promise<QuoteEvent[]> {
  if (isDemoMode()) {
    return demo().events.filter((e) => e.quote_id === quoteId).sort((a, b) => a.created_at.localeCompare(b.created_at))
  }
  const supabase = await createAdminClient()
  const { data } = await supabase.from('quote_events').select('*').eq('quote_id', quoteId).order('created_at')
  return (data as QuoteEvent[]) ?? []
}

export async function getAdminNotes(quoteId: string): Promise<string> {
  if (isDemoMode()) return demo().notes[quoteId] ?? ''
  const supabase = await createAdminClient()
  const { data } = await supabase.from('quote_admin_notes').select('admin_notes').eq('quote_id', quoteId).maybeSingle()
  return (data?.admin_notes as string) ?? ''
}

// ---------- writes ----------
export async function createQuote(input: Partial<QuoteRecord>): Promise<QuoteRecord> {
  const now = new Date().toISOString()
  if (isDemoMode()) {
    const q = {
      ...(input as QuoteRecord),
      id: crypto.randomUUID(),
      quote_number: generateQuoteNumber(),
      public_token: newPublicToken(),
      status: input.status ?? 'pending',
      freight_cents: input.freight_cents ?? 0,
      tax_cents: input.tax_cents ?? 0,
      discount_cents: input.discount_cents ?? 0,
      created_at: now,
      updated_at: now,
    } as QuoteRecord
    demo().quotes.unshift(q)
    return q
  }
  const supabase = await createAdminClient()
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error } = await supabase
      .from('quotes')
      .insert({ ...input, quote_number: generateQuoteNumber(), public_token: newPublicToken() })
      .select('*')
      .single()
    if (!error && data) return normalize(data)
    if (error?.code !== '23505') throw new Error(error?.message ?? 'Quote insert failed')
  }
  throw new Error('Could not allocate a unique quote number')
}

export async function updateQuote(id: string, patch: Partial<QuoteRecord>): Promise<QuoteRecord | null> {
  if (isDemoMode()) {
    const s = demo()
    const i = s.quotes.findIndex((q) => q.id === id)
    if (i < 0) return null
    s.quotes[i] = { ...s.quotes[i], ...patch, updated_at: new Date().toISOString() }
    return s.quotes[i]
  }
  const supabase = await createAdminClient()
  const { data, error } = await supabase.from('quotes').update(patch).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return data ? normalize(data) : null
}

/**
 * Compare-and-set status change, so two tabs (or a double-click) can't both accept a quote.
 * Returns null when the quote was no longer in one of `from`.
 */
export async function transitionQuote(
  id: string,
  from: QuoteStatus[],
  patch: Partial<QuoteRecord>,
): Promise<QuoteRecord | null> {
  if (isDemoMode()) {
    const q = demo().quotes.find((x) => x.id === id)
    if (!q || !from.includes(q.status)) return null
    return updateQuote(id, patch)
  }
  const supabase = await createAdminClient()
  const { data, error } = await supabase.from('quotes').update(patch).eq('id', id).in('status', from).select('*')
  if (error) throw new Error(error.message)
  return data?.[0] ? normalize(data[0]) : null
}

export async function setAdminNotes(quoteId: string, notes: string): Promise<void> {
  if (isDemoMode()) {
    demo().notes[quoteId] = notes
    return
  }
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('quote_admin_notes')
    .upsert({ quote_id: quoteId, admin_notes: notes, updated_at: new Date().toISOString() })
  if (error) console.error('setAdminNotes error:', error)
}

export async function addEvent(quoteId: string, type: QuoteEventType, note: string | null = null): Promise<void> {
  if (isDemoMode()) {
    demo().events.push({ id: crypto.randomUUID(), quote_id: quoteId, type, note, created_at: new Date().toISOString() })
    return
  }
  const supabase = await createAdminClient()
  const { error } = await supabase.from('quote_events').insert({ quote_id: quoteId, type, note })
  if (error) console.error('addEvent error:', error)
}

/** Log a 'viewed' event at most once an hour per quote (page refreshes aren't news). */
export async function logViewOnce(quoteId: string): Promise<void> {
  const events = await listEvents(quoteId)
  const last = [...events].reverse().find((e) => e.type === 'viewed')
  if (last && Date.now() - new Date(last.created_at).getTime() < 3600_000) return
  await addEvent(quoteId, 'viewed')
}

/** Creates the order row for a net-terms acceptance. Card payments get their order from Team B's webhook. */
export async function createOrderFromQuote(
  q: QuoteRecord,
  opts: { paymentMethod: string; paymentStatus: string },
): Promise<string> {
  if (isDemoMode()) {
    const order_number = generateOrderNumber()
    demo().orders.push({ order_number, quote_id: q.id, payment_status: opts.paymentStatus, total_cents: q.total_cents ?? 0, created_at: new Date().toISOString() })
    return order_number
  }
  const supabase = await createAdminClient()
  for (let attempt = 0; attempt < 4; attempt++) {
    const order_number = generateOrderNumber()
    const { error } = await supabase.from('orders').insert({
      order_number,
      quote_id: q.id,
      contractor_id: q.contractor_id,
      items: q.items,
      // orders has no discount column: subtotal is merchandise net of the quote discount
      subtotal_cents: (q.subtotal_cents ?? 0) - (q.discount_cents ?? 0),
      shipping_cents: q.freight_cents ?? 0,
      tax_cents: q.tax_cents ?? 0,
      total_cents: q.total_cents ?? 0,
      status: 'processing',
      shipping_address: q.shipping_address ?? { zip: q.delivery_zip ?? '', country: 'US' },
      shipping_method: q.delivery_type ? `LTL freight (${q.delivery_type})` : 'LTL freight',
      payment_method: opts.paymentMethod,
      payment_status: opts.paymentStatus,
    })
    if (!error) return order_number
    if (error.code !== '23505') throw new Error(error.message)
  }
  throw new Error('Could not allocate a unique order number')
}

/** Approved account's extra wholesale % (column added by Team C's migration — read defensively). */
export async function getContractorDiscountPercent(contractorId: string | null): Promise<number> {
  if (!contractorId) return 0
  if (isDemoMode()) return 0
  try {
    const supabase = await createAdminClient()
    const { data } = await supabase.from('contractor_profiles').select('*').eq('id', contractorId).maybeSingle()
    if (!data) return 0
    const row = data as Record<string, unknown>
    const status = (row.account_status ?? row.status ?? row.approval_status) as string | undefined
    if (status && status !== 'approved') return 0
    const pct = Number(row.wholesale_discount_percent ?? 0)
    return Number.isFinite(pct) && pct > 0 && pct < 100 ? pct : 0
  } catch {
    return 0
  }
}

/** Does a contractor_profiles row exist for this user? (quotes.contractor_id has an FK to it.) */
export async function contractorProfileExists(userId: string): Promise<boolean> {
  if (isDemoMode()) return false
  const supabase = await createAdminClient()
  const { data } = await supabase.from('contractor_profiles').select('id').eq('id', userId).maybeSingle()
  return !!data
}
