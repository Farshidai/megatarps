import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { generateOrderNumber } from '@/lib/utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return Response.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const supabase = await createAdminClient()
    const items = session.metadata?.items ? JSON.parse(session.metadata.items) : []
    const orderNumber = session.metadata?.order_number ?? generateOrderNumber()

    // shipping_details is present at runtime but typed loosely in Stripe v22
    const sessionAny = session as unknown as Record<string, unknown>
    const shippingDetails = sessionAny['shipping_details'] as { address?: { line1?: string; line2?: string; city?: string; state?: string; postal_code?: string; country?: string }; name?: string } | null
    const shippingAddr = shippingDetails?.address
    const shippingName = shippingDetails?.name ?? ''

    await supabase.from('orders').insert({
      order_number: orderNumber,
      items: items.map((i: { product_id?: string; sku?: string; quantity: number }) => ({
        sku: i.sku ?? '',
        name: '',
        quantity: i.quantity,
        unit_price_cents: 0,
        line_total: 0,
      })),
      subtotal_cents: session.amount_subtotal ?? 0,
      shipping_cents: 0,
      total_cents: session.amount_total ?? 0,
      status: 'processing',
      payment_status: 'paid',
      stripe_payment_id: session.payment_intent as string,
      shipping_address: {
        name: shippingName,
        line1: shippingAddr?.line1 ?? '',
        line2: shippingAddr?.line2 ?? '',
        city: shippingAddr?.city ?? '',
        state: shippingAddr?.state ?? '',
        zip: shippingAddr?.postal_code ?? '',
        country: shippingAddr?.country ?? 'US',
      },
    })
  }

  return Response.json({ received: true })
}
