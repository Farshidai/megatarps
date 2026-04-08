import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Orders' }

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

export default async function AdminOrdersPage() {
  const supabase = await createAdminClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900">Orders</h1>
        <span className="text-sm text-slate-500">{orders?.length ?? 0} total</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Order #</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Ship To</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Items</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Total</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Tracking</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!orders?.length ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">No orders yet</td>
              </tr>
            ) : orders.map(o => {
              const addr = o.shipping_address as { name?: string; city?: string; state?: string }
              const items = o.items as Array<{ sku: string; name: string; quantity: number }>
              return (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs">{o.order_number}</p>
                    <p className="text-xs text-slate-400">{new Date(o.created_at).toLocaleDateString()}</p>
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
