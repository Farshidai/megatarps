// Stripe webhook: confirms cart orders and creates orders for paid quotes.
//
// Metadata formats handled:
//  - cart checkout (/api/checkout): { order_id, order_number, source: 'cart', items_0.. }
//    → the pending order row already exists; confirm it.
//  - quote payment (Team D):        { quote_id, order_number }
//    → create the order from the quote (or confirm one D already created) and set
//      quotes.status = 'ordered'.
//  - legacy single-item checkout:   { order_number, items: JSON }
//
// Idempotent: confirmations are conditional updates (`payment_status <> 'paid'`) and
// inserts are keyed on the UNIQUE order_number, so retried events never duplicate orders.
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo'
import { parseCompactItems } from '@/lib/cart/checkout-pricing'

type Session = Stripe.Checkout.Session
type Admin = Awaited<ReturnType<typeof createAdminClient>>

const HANDLED = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
])

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const sig = request.headers.get('stripe-signature')
  const body = await request.text()

  if (!secret) {
    console.error('stripe webhook: STRIPE_WEBHOOK_SECRET is not set')
    return Response.json({ error: 'Webhook not configured' }, { status: 500 })
  }
  if (!sig) return Response.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    // constructEvent only verifies the HMAC; the API key is not used here.
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_unused')
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.error('stripe webhook: signature verification failed:', (err as Error).message)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (!HANDLED.has(event.type)) return Response.json({ received: true, ignored: event.type })

  if (isDemoMode()) {
    console.log(`[demo] stripe webhook ${event.type} verified; database writes skipped`)
    return Response.json({ received: true, demo: true })
  }

  try {
    const supabase = await createAdminClient()
    const session = event.data.object as Session
    const result = await handleSession(supabase, event.type, session)
    return Response.json({ received: true, ...result })
  } catch (err) {
    // 500 → Stripe retries; handlers are idempotent so retries are safe
    console.error(`stripe webhook: ${event.type} failed`, err)
    return Response.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

function shippingFromSession(session: Session) {
  const legacy = (session as unknown as { shipping_details?: { name?: string; address?: Stripe.Address } }).shipping_details
  const sd = session.collected_information?.shipping_details ?? legacy ?? null
  const a = sd?.address
  const cd = session.customer_details
  return {
    name: sd?.name ?? cd?.name ?? '',
    line1: a?.line1 ?? '',
    line2: a?.line2 ?? '',
    city: a?.city ?? '',
    state: a?.state ?? '',
    zip: a?.postal_code ?? '',
    country: a?.country ?? 'US',
    email: cd?.email ?? session.customer_email ?? '',
    phone: cd?.phone ?? '',
  }
}

function paymentIntentId(session: Session): string | null {
  const pi = session.payment_intent
  return typeof pi === 'string' ? pi : pi?.id ?? null
}

async function handleSession(supabase: Admin, type: string, session: Session) {
  const meta = session.metadata ?? {}
  const paidNow = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'

  let patch: Record<string, unknown>
  let onlyIfPending = false
  switch (type) {
    case 'checkout.session.completed':
      patch = {
        status: paidNow ? 'processing' : 'pending',
        // ACH: completed but unpaid until async_payment_succeeded
        payment_status: paidNow ? 'paid' : 'processing',
        stripe_payment_id: paymentIntentId(session),
        shipping_address: shippingFromSession(session),
        shipping_cents: session.total_details?.amount_shipping ?? undefined,
        tax_cents: session.total_details?.amount_tax ?? 0,
        total_cents: session.amount_total ?? undefined,
        payment_method: session.payment_method_types?.join(',') ?? 'stripe_checkout',
      }
      break
    case 'checkout.session.async_payment_succeeded':
      patch = { status: 'processing', payment_status: 'paid', stripe_payment_id: paymentIntentId(session) }
      break
    case 'checkout.session.async_payment_failed':
      patch = { status: 'cancelled', payment_status: 'failed' }
      break
    default: // checkout.session.expired
      patch = { status: 'cancelled', payment_status: 'expired' }
      onlyIfPending = true
  }
  for (const k of Object.keys(patch)) if (patch[k] === undefined) delete patch[k]

  // 1) find the order row
  let orderId: string | null = null
  if (meta.order_id) {
    const { data } = await supabase.from('orders').select('id').eq('id', meta.order_id).maybeSingle()
    orderId = data?.id ?? null
  }
  const orderNumber = meta.order_number || `MO-S-${session.id.slice(-10).toUpperCase()}`
  if (!orderId) {
    const { data } = await supabase.from('orders').select('id').eq('order_number', orderNumber).maybeSingle()
    orderId = data?.id ?? null
  }

  // 2) no row yet (quote payment / legacy session): create it, only on completion
  if (!orderId) {
    if (type !== 'checkout.session.completed') return { skipped: 'no order for session' }
    const created = await createOrderFromSession(supabase, session, orderNumber, patch)
    orderId = created.id
    if (created.duplicate) {
      // lost a race with a concurrent retry; fall through to the conditional update
    } else {
      await markQuoteOrdered(supabase, meta.quote_id)
      return { order_id: orderId, created: true }
    }
  }

  // 3) conditional (idempotent) update
  let q = supabase.from('orders').update(patch).eq('id', orderId)
  q = onlyIfPending ? q.eq('payment_status', 'pending') : q.neq('payment_status', 'paid')
  const { error } = await q
  if (error) throw error

  if (type === 'checkout.session.completed') await markQuoteOrdered(supabase, meta.quote_id, orderId)
  return { order_id: orderId, updated: true }
}

async function createOrderFromSession(supabase: Admin, session: Session, orderNumber: string, patch: Record<string, unknown>) {
  const meta = session.metadata ?? {}
  let items: Array<Record<string, unknown>> = []
  let contractorId: string | null = null

  if (meta.quote_id) {
    const { data: quote, error } = await supabase.from('quotes').select('items, contractor_id').eq('id', meta.quote_id).maybeSingle()
    if (error) throw error
    items = (quote?.items as Array<Record<string, unknown>>) ?? []
    contractorId = (quote?.contractor_id as string | null) ?? null
  }
  if (!items.length) {
    let legacy: Array<{ sku?: string; quantity: number }> = []
    try {
      legacy = meta.items ? JSON.parse(meta.items) : []
    } catch {
      legacy = []
    }
    const compact = parseCompactItems(meta)
    items = (compact.length ? compact : legacy).map((i) => ({ sku: i.sku ?? '', name: '', quantity: i.quantity, unit_price_cents: 0, line_total: 0 }))
  }

  const row = {
    order_number: orderNumber,
    quote_id: meta.quote_id || null,
    contractor_id: contractorId,
    items,
    subtotal_cents: session.amount_subtotal ?? 0,
    shipping_cents: session.total_details?.amount_shipping ?? 0,
    ...patch,
    total_cents: session.amount_total ?? 0,
  }
  const { data, error } = await supabase.from('orders').insert(row).select('id').single()
  if (error) {
    if (error.code === '23505') {
      // unique order_number: another delivery of this event already created it
      const { data: existing } = await supabase.from('orders').select('id').eq('order_number', orderNumber).single()
      return { id: existing!.id as string, duplicate: true }
    }
    throw error
  }
  return { id: data.id as string, duplicate: false }
}

async function markQuoteOrdered(supabase: Admin, quoteId: string | undefined, orderId?: string) {
  if (!quoteId) return
  const { error } = await supabase
    .from('quotes')
    .update({ status: 'ordered', updated_at: new Date().toISOString() })
    .eq('id', quoteId)
    .in('status', ['pending', 'quoted', 'accepted'])
  if (error) throw error
  if (orderId) await supabase.from('orders').update({ quote_id: quoteId }).eq('id', orderId).is('quote_id', null)
}
