import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { generateOrderNumber } from '@/lib/utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

interface CheckoutItem {
  product_id?: string
  sku?: string
  quantity: number
}

export async function POST(request: Request) {
  const body = await request.json()
  const { items }: { items: CheckoutItem[] } = body

  if (!items?.length) {
    return Response.json({ error: 'No items provided' }, { status: 400 })
  }

  // Validate quantities (retail only: 1–4 units)
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)
  if (totalQty >= 5) {
    return Response.json({ error: 'Use bulk quote for 5+ units' }, { status: 400 })
  }

  const supabase = await createClient()

  // Fetch product details
  const productIds = items.map(i => i.product_id).filter(Boolean) as string[]
  const skus = items.map(i => i.sku).filter(Boolean) as string[]

  const { data: products } = productIds.length
    ? await supabase.from('products').select('id, xpose_sku, name, retail_price_cents, image_urls, in_stock').in('id', productIds)
    : await supabase.from('products').select('id, xpose_sku, name, retail_price_cents, image_urls, in_stock').in('xpose_sku', skus)

  if (!products?.length) {
    return Response.json({ error: 'Products not found' }, { status: 400 })
  }

  // Build Stripe line items
  let lineItems
  try {
    lineItems = items.map(item => {
      const product = products.find(p => p.id === item.product_id || p.xpose_sku === item.sku)
      if (!product) throw new Error(`Product not found: ${item.product_id ?? item.sku}`)
      if (!product.in_stock) throw new Error(`${product.name} is out of stock`)
      return {
        price_data: {
          currency: 'usd' as const,
          product_data: {
            name: product.name,
            images: product.image_urls?.[0] ? [product.image_urls[0]] : [],
          },
          unit_amount: product.retail_price_cents,
        },
        quantity: item.quantity,
      }
    })
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 })
  }

  const orderNumber = generateOrderNumber()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${appUrl}/account/orders?success=1&order=${orderNumber}`,
    cancel_url: `${appUrl}/products`,
    metadata: {
      order_number: orderNumber,
      items: JSON.stringify(items),
    },
    shipping_address_collection: {
      allowed_countries: ['US'],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 0, currency: 'usd' },
          display_name: 'Standard Shipping (3–7 business days)',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 3 },
            maximum: { unit: 'business_day', value: 7 },
          },
        },
      },
    ],
    allow_promotion_codes: true,
  })

  return Response.json({ url: session.url })
}
