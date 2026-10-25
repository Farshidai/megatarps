// Accept & Pay: Stripe Checkout for a saved quote. Amounts come ONLY from the stored quote.
// Team B's webhook sees metadata.quote_id, creates the order and sets the quote to 'ordered'.
import Stripe from 'stripe'
import { isDemoMode } from '@/lib/demo'
import { generateOrderNumber } from '@/lib/utils'
import { addEvent, getQuoteByToken, transitionQuote } from '@/lib/quotes/store'
import { emailAdminStatus, getAppUrl } from '@/lib/quotes/emails'
import { effectiveStatus } from '@/lib/quotes/types'

type CreateParams = NonNullable<Parameters<Stripe['checkout']['sessions']['create']>[0]>
type LineItem = NonNullable<CreateParams['line_items']>[number]
type Discount = NonNullable<CreateParams['discounts']>[number]

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const q = await getQuoteByToken(token)
  if (!q) return Response.json({ error: 'Quote not found' }, { status: 404 })

  const status = effectiveStatus(q)
  if (status === 'expired') return Response.json({ error: 'This quote has expired. Ask us for a refreshed quote.' }, { status: 410 })
  const resumingCard = status === 'accepted' && q.payment_method === 'card'
  if (status !== 'quoted' && !resumingCard) return Response.json({ error: `This quote is ${status} and can't be paid online.` }, { status: 409 })
  if (!q.items.length || q.items.some((i) => !(i.unit_price_cents > 0) || !(i.quantity > 0))) {
    return Response.json({ error: 'This quote is incomplete. Please contact us.' }, { status: 409 })
  }
  if ((q.total_cents ?? 0) < 50) return Response.json({ error: 'Quote total is invalid. Please contact us.' }, { status: 409 })

  const appUrl = await getAppUrl()
  const orderNumber = generateOrderNumber()
  const now = new Date().toISOString()

  // ---- DEMO MODE: no Stripe; simulate checkout + webhook ----
  if (isDemoMode()) {
    const updated = await transitionQuote(q.id, ['quoted', 'accepted'], {
      status: 'ordered', accepted_at: q.accepted_at ?? now, payment_method: 'card', stripe_checkout_session_id: `cs_demo_${orderNumber}`,
    })
    if (!updated) return Response.json({ error: 'This quote was just updated. Refresh and try again.' }, { status: 409 })
    await addEvent(q.id, 'accepted', 'Accepted — paying by card (demo)')
    await addEvent(q.id, 'paid', `Demo payment for order ${orderNumber}`)
    return Response.json({ url: `/quote/${token}?paid=1`, demo: true })
  }

  const key = process.env.STRIPE_SECRET_KEY ?? ''
  if (!key || key.includes('placeholder')) {
    return Response.json({ error: 'Card payments are not configured yet. Please call (913) 313-2691.' }, { status: 503 })
  }
  const stripe = new Stripe(key)

  try {
    // Re-use an open session (double clicks, back button) instead of creating duplicates.
    if (q.stripe_checkout_session_id) {
      const existing = await stripe.checkout.sessions.retrieve(q.stripe_checkout_session_id).catch(() => null)
      if (existing?.status === 'open' && existing.url) return Response.json({ url: existing.url })
      if (existing?.status === 'complete') return Response.json({ error: 'This quote is already paid.' }, { status: 409 })
    }

    const line_items: LineItem[] = q.items.map((i) => ({
      quantity: i.quantity,
      price_data: {
        currency: 'usd',
        unit_amount: i.unit_price_cents,
        product_data: { name: (i.name || i.sku).slice(0, 250), ...(i.sku ? { metadata: { sku: i.sku } } : {}) },
      },
    }))
    if (q.freight_cents > 0) {
      line_items.push({ quantity: 1, price_data: { currency: 'usd', unit_amount: q.freight_cents, product_data: { name: `LTL freight${q.delivery_zip ? ` to ${q.delivery_zip}` : ''}${q.delivery_type ? ` (${q.delivery_type})` : ''}` } } })
    }
    if (q.tax_cents > 0) {
      line_items.push({ quantity: 1, price_data: { currency: 'usd', unit_amount: q.tax_cents, product_data: { name: 'Sales tax' } } })
    }
    let discounts: Discount[] | undefined
    if (q.discount_cents > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: q.discount_cents, currency: 'usd', duration: 'once', max_redemptions: 1,
        name: `Quote ${q.quote_number} discount`.slice(0, 40),
      })
      discounts = [{ coupon: coupon.id }]
    }

    const metadata = { quote_id: q.id, order_number: orderNumber, quote_number: q.quote_number, source: 'quote' }
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      discounts,
      customer_email: q.guest_email ?? undefined,
      client_reference_id: q.id,
      metadata,
      payment_intent_data: { metadata, description: `MegaTarps quote ${q.quote_number}` },
      success_url: `${appUrl}/quote/${token}?paid=1`,
      cancel_url: `${appUrl}/quote/${token}?canceled=1`,
    })

    const updated = await transitionQuote(q.id, ['quoted', 'accepted'], {
      status: 'accepted', accepted_at: q.accepted_at ?? now, payment_method: 'card', stripe_checkout_session_id: session.id,
    })
    if (!updated) return Response.json({ error: 'This quote was just updated. Refresh and try again.' }, { status: 409 })
    if (status === 'quoted') {
      await addEvent(q.id, 'accepted', 'Accepted — paying by card (Stripe Checkout started)')
      await emailAdminStatus(q, 'Quote accepted — customer is paying by card').catch(() => {})
    }
    return Response.json({ url: session.url })
  } catch (e) {
    console.error('quote checkout error:', e)
    return Response.json({ error: 'Could not start checkout. Please try again or call (913) 313-2691.' }, { status: 502 })
  }
}
