// POST /api/checkout  { items: [{ sku, quantity }, ...] }
// Multi-line cart checkout. The browser's job ends at "which SKUs, how many": every price is
// recomputed here from the product rows, the active pricing rules and the buyer's account
// (getAccountPricing). Any price/discount/total fields in the request are ignored.
import Stripe from 'stripe'
import { randomBytes } from 'crypto'
import { getPricingRules } from '@/lib/products'
import { getAccountPricing } from '@/lib/accounts'
import { isDemoMode } from '@/lib/demo'
import { createAdminClient } from '@/lib/supabase/server'
import { getProductsBySkus, stripeConfigured } from '@/lib/cart/server'
import {
  buildStripeLineItems,
  CheckoutError,
  compactItemsMetadata,
  parseCheckoutBody,
  priceCheckoutLines,
  type PricedLine,
} from '@/lib/cart/checkout-pricing'
import { calculateFreight, type FreightResult } from '@/lib/freight'
import { getFreightConfig } from '@/lib/freight-server'

type SessionCreateParams = NonNullable<Parameters<Stripe['checkout']['sessions']['create']>[0]>

function newOrderNumber() {
  return `MO-${new Date().getFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`
}

function appOrigin(request: Request) {
  const env = process.env.NEXT_PUBLIC_APP_URL
  if (env && /^https?:\/\//.test(env)) return env.replace(/\/$/, '')
  return new URL(request.url).origin
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  let priced: { lines: PricedLine[]; subtotal_cents: number }
  let freight: FreightResult
  let account: Awaited<ReturnType<typeof getAccountPricing>>
  try {
    const lines = parseCheckoutBody(body)
    const [products, rules, acct, freightConfig] = await Promise.all([
      getProductsBySkus(lines.map((l) => l.sku)),
      getPricingRules(),
      getAccountPricing(),
      getFreightConfig(),
    ])
    account = acct
    const wholesaleDiscountPercent = acct.status === 'approved' ? Math.min(Math.max(acct.wholesaleDiscountPercent || 0, 0), 90) : 0
    priced = priceCheckoutLines(lines, products, rules, { wholesaleDiscountPercent, accountApproved: acct.status === 'approved' })
    // Freight: server weights + server rates only. Nothing from the request is used.
    freight = calculateFreight(
      priced.lines.map((l) => ({ sku: l.sku, quantity: l.quantity, unitWeightLb: l.unit_weight_lb })),
      freightConfig,
      priced.subtotal_cents,
    )
    if (freight.method === 'quote' || freight.freightCents == null) {
      throw new CheckoutError(`Freight quote required: ${freight.reason}`, 409, {
        code: 'freight_quote_required',
        quote_url: '/bulk-quote?from=cart',
        total_weight_lb: freight.totalWeightLb,
        unknown_weight: freight.unknownWeightSkus,
      })
    }
  } catch (e) {
    if (e instanceof CheckoutError) return Response.json({ error: e.message, details: e.details }, { status: e.status })
    console.error('checkout pricing error', e)
    return Response.json({ error: 'Could not price your cart. Please try again.' }, { status: 500 })
  }

  const shipping_cents = freight.freightCents ?? 0
  const orderNumber = newOrderNumber()
  const summary = {
    order_number: orderNumber,
    lines: priced.lines.map((l) => ({ sku: l.sku, quantity: l.quantity, unit_price_cents: l.unit_price_cents, line_total_cents: l.line_total_cents })),
    subtotal_cents: priced.subtotal_cents,
    shipping_cents,
    freight: { method: freight.method, total_weight_lb: freight.totalWeightLb, billable_weight_lb: freight.billableWeightLb, freight_cents: shipping_cents },
    total_cents: priced.subtotal_cents + shipping_cents,
  }

  // DEMO MODE: no Stripe / Supabase. Same validation and pricing, mock redirect.
  if (isDemoMode() || !stripeConfigured()) {
    return Response.json({
      ...summary,
      demo: true,
      url: `/checkout/success?demo=1&order=${orderNumber}`,
      // exactly what would be sent to Stripe (lets QA / scripts verify server pricing)
      stripe_line_items: buildStripeLineItems(priced.lines, freight).map((li) => ({ sku: li.price_data.product_data.metadata.sku, quantity: li.quantity, unit_amount: li.price_data.unit_amount })),
    })
  }

  // 1) Pending order row holds the full line detail (Stripe metadata values cap at 500 chars).
  const supabase = await createAdminClient()
  const orderRow = {
    order_number: orderNumber,
    contractor_id: account.userId && account.status !== 'guest' ? account.userId : null,
    items: priced.lines.map((l) => ({
      product_id: l.product_id,
      sku: l.sku,
      name: l.name,
      quantity: l.quantity,
      unit_price_cents: l.unit_price_cents,
      line_total: l.line_total_cents,
    })),
    subtotal_cents: priced.subtotal_cents,
    shipping_cents,
    tax_cents: 0,
    total_cents: priced.subtotal_cents + shipping_cents,
    status: 'pending',
    payment_status: 'pending',
    payment_method: 'stripe_checkout',
    shipping_method: `${freight.method} ${freight.totalWeightLb} lb`,
    shipping_address: {},
  }
  let ins = await supabase.from('orders').insert(orderRow).select('id').single()
  if (ins.error && orderRow.contractor_id) {
    // e.g. signed-in user without a contractor_profiles row (FK) — keep the sale, drop the link
    ins = await supabase.from('orders').insert({ ...orderRow, contractor_id: null }).select('id').single()
  }
  if (ins.error || !ins.data) {
    console.error('checkout: pending order insert failed', ins.error)
    return Response.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 })
  }
  const orderId: string = ins.data.id

  // 2) Stripe Checkout Session with server prices only.
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const origin = appOrigin(request)
  const params: SessionCreateParams = {
    mode: 'payment',
    payment_method_types: ['card', 'us_bank_account'],
    line_items: buildStripeLineItems(priced.lines, freight),
    client_reference_id: orderId,
    customer_email: account.email ?? undefined,
    metadata: {
      order_id: orderId,
      order_number: orderNumber,
      source: 'cart',
      freight: `${freight.method}:${shipping_cents}:${freight.totalWeightLb}`,
      ...compactItemsMetadata(priced.lines),
    },
    payment_intent_data: { metadata: { order_id: orderId, order_number: orderNumber } },
    shipping_address_collection: { allowed_countries: ['US'] },
    phone_number_collection: { enabled: true },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel?order=${orderNumber}`,
  }

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create(params)
  } catch (e) {
    // ACH not enabled on the Stripe account → retry card-only rather than failing the sale
    const msg = (e as Error).message ?? ''
    if (/us_bank_account|payment method type/i.test(msg)) {
      console.warn('checkout: ACH unavailable, falling back to card only:', msg)
      try {
        session = await stripe.checkout.sessions.create({ ...params, payment_method_types: ['card'] })
      } catch (e2) {
        console.error('checkout: stripe error', e2)
        return Response.json({ error: 'Payment provider error. Please try again.' }, { status: 502 })
      }
    } else {
      console.error('checkout: stripe error', e)
      return Response.json({ error: 'Payment provider error. Please try again.' }, { status: 502 })
    }
  }

  return Response.json({ url: session.url, order_number: orderNumber })
}
