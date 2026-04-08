import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Orders' }

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

export default async function AccountOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; order?: string }>
}) {
  const { success, order } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-slate-500 mb-4">Sign in to view your orders.</p>
        <a href="/account/login" className="text-orange-600 font-semibold hover:underline">Sign In →</a>
      </div>
    )
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('contractor_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
          <strong>Order placed!</strong> {order ? `Order ${order} confirmed.` : ''} You&apos;ll receive a confirmation email shortly.
        </div>
      )}

      <h1 className="text-xl font-black text-slate-900">My Orders</h1>

      {!orders?.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-400 mb-4">No orders yet.</p>
          <a href="/products"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
            Shop Now
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const items = o.items as Array<{ sku: string; name: string; quantity: number }>
            const addr = o.shipping_address as { name?: string; line1?: string; city?: string; state?: string; zip?: string }
            return (
              <div key={o.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-900">{o.order_number}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[o.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {o.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="font-black text-slate-900 text-lg">{formatPrice(o.total_cents)}</p>
                </div>

                <ul className="mt-3 text-sm text-slate-600 space-y-1">
                  {items.map((item, i) => (
                    <li key={i}>{item.quantity}x {item.name || item.sku}</li>
                  ))}
                </ul>

                {addr?.city && (
                  <p className="mt-3 text-xs text-slate-400">
                    Shipping to: {addr.city}, {addr.state} {addr.zip}
                  </p>
                )}

                {o.tracking_number && (
                  <p className="mt-2 text-xs text-purple-700 font-semibold">
                    Tracking: {o.tracking_number}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
