import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Quotes' }

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  quoted: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  ordered: 'bg-indigo-100 text-indigo-700',
  expired: 'bg-slate-100 text-slate-500',
}

export default async function AccountQuotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-slate-500 mb-4">Sign in to view your quotes.</p>
        <a href="/account/login" className="text-orange-600 font-semibold hover:underline">Sign In →</a>
      </div>
    )
  }

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*')
    .eq('contractor_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black text-slate-900">My Quote Requests</h1>

      {!quotes?.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-400 mb-4">You haven&apos;t submitted any quote requests yet.</p>
          <a href="/bulk-quote"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
            Request Bulk Pricing
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map(q => {
            const items = q.items as Array<{ sku: string; name: string; quantity: number; unit_price_cents: number }>
            return (
              <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-900">{q.quote_number}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[q.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {q.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{new Date(q.created_at).toLocaleDateString()}</p>
                  </div>
                  {q.total_cents && (
                    <p className="font-black text-slate-900 text-lg">{formatPrice(q.total_cents)}</p>
                  )}
                </div>

                <ul className="mt-3 text-sm text-slate-600 space-y-1">
                  {items.map((item, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{item.quantity}x {item.name || item.sku}</span>
                      {item.unit_price_cents > 0 && (
                        <span className="text-slate-500">{formatPrice(item.unit_price_cents)} ea</span>
                      )}
                    </li>
                  ))}
                </ul>

                {q.status === 'pending' && (
                  <p className="mt-3 text-xs text-orange-600">
                    We&apos;ll send pricing to your email within 4 business hours.
                  </p>
                )}
                {q.status === 'quoted' && q.expires_at && (
                  <p className="mt-3 text-xs text-blue-600">
                    Quote valid until {new Date(q.expires_at).toLocaleDateString()}
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
