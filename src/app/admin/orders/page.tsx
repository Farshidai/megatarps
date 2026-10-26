import Link from 'next/link'
import { connection } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import { isDemoMode } from '@/lib/demo'
import { formatPrice } from '@/lib/utils'
import { paymentBucket, paymentLabel, type PaymentBucket } from '@/lib/orders/payment-view'
import { demoAdminOrders, type AdminOrderRow } from '@/lib/orders/demo-orders'
import { nowMs } from '@/lib/quotes/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Orders' }

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}
const PAYMENT_STYLES: Record<PaymentBucket, string> = {
  paid: 'bg-green-100 text-green-800',
  awaiting: 'bg-amber-100 text-amber-800',
  abandoned: 'bg-slate-200 text-slate-600',
}

type View = 'all' | PaymentBucket
const VIEWS: { key: View; label: string }[] = [
  { key: 'all', label: 'All (open + paid)' },
  { key: 'paid', label: 'Paid' },
  { key: 'awaiting', label: 'Awaiting payment' },
  { key: 'abandoned', label: 'Abandoned > 24h' },
]

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  // Re-check here: layouts don't re-render on client navigation, so the layout gate alone isn't enough.
  await requireAdmin('/admin/orders')
  await connection()
  const { view: rawView } = await searchParams
  const view: View = VIEWS.some((v) => v.key === rawView) ? (rawView as View) : 'all'

  const demo = isDemoMode()
  let orders: AdminOrderRow[] = []
  if (demo) {
    orders = demoAdminOrders()
  } else {
    const supabase = await createAdminClient()
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, created_at, status, payment_status, payment_method, total_cents, tracking_number, xpose_invoice_ref, shipping_address, items')
      .order('created_at', { ascending: false })
      .limit(1000)
    orders = (data ?? []) as AdminOrderRow[]
  }

  const now = nowMs() // request time (server component renders once per request)
  const withBucket = orders.map((o) => ({ o, bucket: paymentBucket(o, now) }))
  const counts = { all: 0, paid: 0, awaiting: 0, abandoned: 0 } as Record<View, number>
  for (const { bucket } of withBucket) {
    counts[bucket]++
    if (bucket !== 'abandoned') counts.all++
  }
  const shown = withBucket.filter(({ bucket }) => (view === 'all' ? bucket !== 'abandoned' : bucket === view))

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-2xl font-black text-slate-900">Orders</h1>
        <span className="text-sm text-slate-500">{orders.length} total</span>
      </div>
      {demo && (
        <p role="status" className="mb-4 rounded-xl bg-amber-50 ring-1 ring-amber-300 px-4 py-2.5 text-sm text-amber-900">
          Demo mode: sample orders, no database connected.
        </p>
      )}

      <nav aria-label="Filter orders by payment" className="flex flex-wrap gap-2 mb-4" data-testid="orders-filter">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={v.key === 'all' ? '/admin/orders' : `/admin/orders?view=${v.key}`}
            aria-current={view === v.key ? 'page' : undefined}
            className={`text-sm font-semibold px-3 py-1.5 rounded-full ring-1 transition-colors ${view === v.key ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-700 ring-slate-300 hover:ring-orange-400'}`}
          >
            {v.label} <span className={view === v.key ? 'text-orange-300' : 'text-slate-400'}>{counts[v.key]}</span>
          </Link>
        ))}
      </nav>
      {view === 'all' && counts.abandoned > 0 && (
        <p className="text-xs text-slate-500 mb-3">
          {counts.abandoned} abandoned or expired checkout{counts.abandoned === 1 ? '' : 's'} hidden.{' '}
          <Link href="/admin/orders?view=abandoned" className="text-orange-600 font-semibold hover:underline">Show</Link>
        </p>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th scope="col" className="text-left px-4 py-3 font-semibold text-slate-700">Order #</th>
              <th scope="col" className="text-left px-4 py-3 font-semibold text-slate-700">Ship To</th>
              <th scope="col" className="text-left px-4 py-3 font-semibold text-slate-700">Items</th>
              <th scope="col" className="text-left px-4 py-3 font-semibold text-slate-700">Total</th>
              <th scope="col" className="text-left px-4 py-3 font-semibold text-slate-700">Payment</th>
              <th scope="col" className="text-left px-4 py-3 font-semibold text-slate-700">Tracking</th>
              <th scope="col" className="text-left px-4 py-3 font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!shown.length ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">No orders in this view</td>
              </tr>
            ) : shown.map(({ o, bucket }) => {
              const addr = o.shipping_address
              const items = o.items ?? []
              return (
                <tr key={o.id} className={bucket === 'abandoned' ? 'bg-slate-50/70 text-slate-500' : 'hover:bg-slate-50'} data-testid="order-row">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs">{o.order_number}</p>
                    <p className="text-xs text-slate-400">{new Date(o.created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {addr?.name && <p className="font-semibold">{addr.name}</p>}
                    {addr?.city && <p>{addr.city}, {addr.state}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <ul className="text-xs text-slate-600 space-y-0.5">
                      {items.slice(0, 3).map((item, i) => (
                        <li key={i}>{item.quantity}x {item.name || item.sku}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">{formatPrice(o.total_cents)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${PAYMENT_STYLES[bucket]}`} data-testid="payment-status">
                      {paymentLabel(o, now)}
                    </span>
                    {o.payment_method && <p className="text-[11px] text-slate-400 mt-1">{o.payment_method}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {o.tracking_number ?? '—'}
                    {o.xpose_invoice_ref && <p className="text-slate-400">Inv: {o.xpose_invoice_ref}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[o.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
