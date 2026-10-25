import Link from 'next/link'
import { ArrowRight, FileText } from 'lucide-react'
import { isDemoMode } from '@/lib/demo'
import { getSignedInUser } from '@/lib/quotes/auth'
import { listQuotesForContractor } from '@/lib/quotes/store'
import { STATUS_LABELS, STATUS_STYLES, effectiveStatus, nowMs } from '@/lib/quotes/types'
import { formatPrice } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Quotes' }
export const dynamic = 'force-dynamic'

export default async function AccountQuotesPage() {
  const demo = isDemoMode()
  const user = demo ? null : await getSignedInUser()

  if (!demo && !user) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-slate-500 mb-4">Sign in to see your quotes.</p>
        <Link href="/account/login?redirect=/account/quotes" className="text-orange-600 font-semibold hover:underline">Sign in →</Link>
      </div>
    )
  }

  const quotes = await listQuotesForContractor(user?.id ?? 'demo')
  const now = nowMs()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-black text-slate-900">My quotes</h1>
        <Link href="/bulk-quote" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg text-sm">New quote request</Link>
      </div>
      {demo && <p className="text-xs text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg px-3 py-2">Demo mode: showing sample quotes.</p>}

      {!quotes.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" aria-hidden />
          <p className="text-slate-500 mb-4">You haven&apos;t requested any quotes yet.</p>
          <Link href="/bulk-quote" className="text-orange-600 font-semibold hover:underline">Request wholesale pricing →</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {quotes.map((q) => {
            const s = effectiveStatus(q, now)
            const units = q.items.reduce((n, i) => n + i.quantity, 0)
            const action =
              s === 'quoted' ? 'Review & accept' : s === 'accepted' ? 'Complete payment' : s === 'pending' ? 'Track request' : 'View quote'
            return (
              <li key={q.id}>
                <Link
                  href={`/quote/${q.public_token}`}
                  className="group block bg-white rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-sm p-5 transition"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-mono font-bold text-slate-900">{q.quote_number}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ${STATUS_STYLES[s]}`}>{STATUS_LABELS[s]}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Requested {new Date(q.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })} · {q.items.length} line{q.items.length === 1 ? '' : 's'} · {units.toLocaleString()} units
                      </p>
                      <p className="text-sm text-slate-600 mt-1 truncate">{q.items.map((i) => i.name || i.sku).join(', ')}</p>
                    </div>
                    <div className="text-right">
                      {q.total_cents && s !== 'pending' ? <p className="font-black text-slate-900 text-lg tabular-nums">{formatPrice(q.total_cents)}</p> : null}
                      {s === 'quoted' && q.valid_until && (
                        <p className="text-xs text-blue-700">Valid until {new Date(q.valid_until).toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
                      )}
                    </div>
                  </div>
                  <p className={`mt-3 inline-flex items-center gap-1 text-sm font-semibold ${s === 'quoted' || s === 'accepted' ? 'text-orange-600' : 'text-slate-500'} group-hover:underline`}>
                    {action} <ArrowRight className="w-4 h-4" aria-hidden />
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
