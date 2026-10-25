import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { isDemoMode, demoProducts } from '@/lib/demo'
import { formatPrice } from '@/lib/utils'
import { getProductsBySkus } from '@/lib/cart/server'
import { toCatalogEntry, cartItemFromEntry } from '@/lib/cart/catalog-types'
import type { CartItem } from '@/lib/cart/types'
import { ReorderButton } from '@/components/cart/ReorderButton'

export const metadata: Metadata = { title: 'My Orders' }

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

interface OrderLine {
  sku: string
  name?: string
  quantity: number
  unit_price_cents?: number
  line_total?: number
}

interface OrderView {
  id: string
  order_number: string
  status: string
  payment_status?: string | null
  created_at: string
  total_cents: number
  items: OrderLine[]
  shipping_address?: { name?: string; city?: string; state?: string; zip?: string } | null
  tracking_number?: string | null
}

function demoOrders(): OrderView[] {
  const priced = demoProducts.filter((p) => p.active && p.in_stock && p.retail_price_cents > 0)
  const pick = (sku: string, i: number) => priced.find((p) => p.xpose_sku === sku) ?? priced[i % priced.length]
  const mk = (n: string, days: number, status: string, lines: Array<[string, number]>, tracking?: string): OrderView => {
    const items = lines.map(([sku, quantity], i) => {
      const p = pick(sku, i)
      return { sku: p.xpose_sku, name: p.name, quantity, unit_price_cents: p.retail_price_cents, line_total: p.retail_price_cents * quantity }
    })
    return {
      id: n,
      order_number: n,
      status,
      payment_status: 'paid',
      created_at: new Date(Date.now() - days * 86400000).toISOString(),
      total_cents: items.reduce((s, i) => s + i.line_total, 0),
      items,
      shipping_address: { name: 'Demo Contractor', city: 'Lee’s Summit', state: 'MO', zip: '64063' },
      tracking_number: tracking ?? null,
    }
  }
  return [
    mk('MO-DEMO-1042', 6, 'shipped', [['MT-20X30-10MIL', 12], ['MT-30X40-12MIL', 4], ['BB-9B-10', 10]], '1Z999AA10123456784'),
    mk('MO-DEMO-0987', 41, 'delivered', [['MT-12X16-10MIL', 25], ['BB-11B-10', 5]]),
  ]
}

async function reorderLines(orders: OrderView[]) {
  const skus = [...new Set(orders.flatMap((o) => o.items.map((i) => i.sku)).filter(Boolean))]
  const products = await getProductsBySkus(skus).catch(() => [])
  const bySku = new Map(products.map((p) => [p.xpose_sku, toCatalogEntry(p)]))
  return (o: OrderView) => {
    const items: CartItem[] = []
    const unavailable: string[] = []
    for (const line of o.items) {
      const e = bySku.get(line.sku)
      if (e && line.quantity > 0) items.push(cartItemFromEntry(e, line.quantity))
      else unavailable.push(line.sku)
    }
    return { items, unavailable }
  }
}

export default async function AccountOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; order?: string }>
}) {
  const { success, order } = await searchParams
  const demo = isDemoMode()
  let orders: OrderView[] = []

  if (demo) {
    orders = demoOrders()
  } else {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500 mb-4">Sign in to view your orders.</p>
          <Link href="/account/login" className="text-orange-600 font-semibold hover:underline">Sign In →</Link>
        </div>
      )
    }
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_status, created_at, total_cents, items, shipping_address, tracking_number')
      .eq('contractor_id', user.id)
      .order('created_at', { ascending: false })
    orders = (data as OrderView[] | null) ?? []
  }

  const linesFor = await reorderLines(orders)

  return (
    <div className="space-y-4">
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
          <strong>Order placed!</strong> {order ? `Order ${order} confirmed.` : ''} You&apos;ll receive a confirmation email shortly.
        </div>
      )}
      {demo && (
        <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">Demo mode: showing 2 sample orders.</p>
      )}

      <h1 className="text-xl font-black text-slate-900">My Orders</h1>

      {!orders.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-400 mb-4">No orders yet.</p>
          <Link href="/products" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const addr = o.shipping_address
            const { items, unavailable } = linesFor(o)
            return (
              <div key={o.id} className="bg-white rounded-xl border border-slate-200 p-5" data-testid="order-card">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-bold text-slate-900">{o.order_number}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[o.status] ?? 'bg-slate-100 text-slate-600'}`}>{o.status}</span>
                      {o.payment_status && o.payment_status !== 'paid' && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">payment {o.payment_status}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{new Date(o.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <p className="font-black text-slate-900 text-lg">{formatPrice(o.total_cents)}</p>
                    <ReorderButton items={items} unavailable={unavailable} />
                  </div>
                </div>

                <ul className="mt-3 text-sm text-slate-600 space-y-1">
                  {o.items.map((item, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span>
                        {item.quantity}× {item.name || item.sku} <span className="text-xs text-slate-400 font-mono">{item.sku}</span>
                      </span>
                      {item.line_total ? <span className="text-slate-500">{formatPrice(item.line_total)}</span> : null}
                    </li>
                  ))}
                </ul>

                {addr?.city && (
                  <p className="mt-3 text-xs text-slate-400">
                    Shipping to: {addr.city}, {addr.state} {addr.zip}
                  </p>
                )}
                {o.tracking_number && <p className="mt-2 text-xs text-purple-700 font-semibold">Tracking: {o.tracking_number}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
