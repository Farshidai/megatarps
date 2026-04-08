import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Quote Requests' }

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  quoted: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  ordered: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-slate-100 text-slate-600',
  expired: 'bg-red-100 text-red-600',
}

export default async function AdminRFQsPage() {
  const supabase = await createAdminClient()

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900">Quote Requests</h1>
        <span className="text-sm text-slate-500">{quotes?.length ?? 0} total</span>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'pending', 'quoted', 'accepted', 'ordered'].map(s => (
          <span key={s}
            className="px-3 py-1 rounded-full text-sm border border-slate-200 bg-white text-slate-600 cursor-pointer hover:border-orange-400 hover:text-orange-600 transition-colors">
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Quote #</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Customer</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Items</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Timeline</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Quoted At</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Total</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!quotes?.length ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">No quote requests yet</td>
              </tr>
            ) : quotes.map(q => {
              const items = q.items as Array<{ sku: string; name: string; quantity: number; unit_price_cents: number }>
              return (
                <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-slate-600">{q.quote_number}</p>
                    <p className="text-xs text-slate-400">{new Date(q.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{q.guest_name}</p>
                    <p className="text-xs text-slate-500">{q.guest_email}</p>
                    {q.guest_company && <p className="text-xs text-slate-400">{q.guest_company}</p>}
                    {q.guest_phone && <p className="text-xs text-slate-400">{q.guest_phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <ul className="text-xs text-slate-600 space-y-0.5">
                      {items.map((item, i) => (
                        <li key={i}>{item.quantity}x {item.name || item.sku}</li>
                      ))}
                    </ul>
                    {q.special_requirements && (
                      <p className="text-xs text-orange-600 mt-1">Note: {q.special_requirements}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-600">{q.timeline ?? '—'}</p>
                    <p className="text-xs text-slate-400">{q.project_type ?? ''}</p>
                    <p className="text-xs text-slate-400">{q.project_location ?? ''}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {q.quoted_at ? new Date(q.quoted_at).toLocaleDateString() : '—'}
                    {q.quoted_by && <p className="text-slate-400">{q.quoted_by}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900">
                    {q.total_cents ? formatPrice(q.total_cents) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[q.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {q.status}
                    </span>
                    <div className="mt-2">
                      <a href={`mailto:${q.guest_email}?subject=Re: Quote ${q.quote_number}`}
                        className="text-xs text-orange-600 hover:underline">
                        Reply →
                      </a>
                    </div>
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
