import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { isDemoMode } from '@/lib/demo'
import { listQuotes } from '@/lib/quotes/store'
import {
  QUOTE_STATUSES, STATUS_LABELS, STATUS_STYLES, DELIVERY_LABELS, ageLabel, effectiveStatus, nowMs, type QuoteStatus,
} from '@/lib/quotes/types'
import { formatPrice } from '@/lib/utils'
import { AlertTriangle, ChevronRight, Truck } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Quotes & RFQs' }
export const dynamic = 'force-dynamic'

const SLA_HOURS = 24

export default async function AdminRFQsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin()
  const { status: rawStatus } = await searchParams
  const status = (QUOTE_STATUSES as readonly string[]).includes(rawStatus ?? '') ? (rawStatus as QuoteStatus) : 'all'

  const all = await listQuotes('all')
  const withStatus = all.map((q) => ({ q, s: effectiveStatus(q) }))
  const counts = withStatus.reduce<Record<string, number>>((acc, { s }) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }), {})
  const rows = status === 'all' ? withStatus : withStatus.filter((r) => r.s === status)
  const now = nowMs()
  const overdue = withStatus.filter(({ q, s }) => s === 'pending' && now - new Date(q.created_at).getTime() > SLA_HOURS * 3600_000).length

  const tabs: (QuoteStatus | 'all')[] = ['all', 'pending', 'quoted', 'accepted', 'ordered', 'expired', 'declined']

  return (
    <div className="p-4 sm:p-8 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Quotes &amp; RFQs</h1>
          <p className="text-sm text-slate-500">Price requests, send quotes, and track them to order.</p>
        </div>
        {overdue > 0 && (
          <Link href="/admin/rfqs?status=pending" className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4" aria-hidden /> {overdue} request{overdue > 1 ? 's' : ''} waiting over {SLA_HOURS} hours
          </Link>
        )}
      </div>

      {isDemoMode() && (
        <p className="mb-4 text-xs text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg px-3 py-2">
          Demo mode: sample quotes held in memory. Edits work until the server restarts.
        </p>
      )}

      <nav aria-label="Filter by status" className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const active = t === status
          const n = t === 'all' ? all.length : counts[t] ?? 0
          return (
            <Link
              key={t}
              href={t === 'all' ? '/admin/rfqs' : `/admin/rfqs?status=${t}`}
              aria-current={active ? 'page' : undefined}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm border transition-colors ${active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-orange-400 hover:text-orange-600'}`}
            >
              {t === 'all' ? 'All' : STATUS_LABELS[t]} <span className={active ? 'text-slate-300' : 'text-slate-400'}>{n}</span>
            </Link>
          )
        })}
      </nav>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">Quote</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Lines</th>
              <th className="px-4 py-3 font-semibold">Delivery</th>
              <th className="px-4 py-3 font-semibold">Age</th>
              <th className="px-4 py-3 font-semibold text-right">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-2 py-3"><span className="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!rows.length ? (
              <tr>
                <td colSpan={8} className="text-center py-14 text-slate-400">
                  {status === 'all' ? 'No quote requests yet.' : `No ${STATUS_LABELS[status].toLowerCase()} quotes.`}
                </td>
              </tr>
            ) : (
              rows.map(({ q, s }) => {
                const ageMs = now - new Date(q.created_at).getTime()
                const late = s === 'pending' && ageMs > SLA_HOURS * 3600_000
                const units = q.items.reduce((n, i) => n + (i.quantity || 0), 0)
                return (
                  <tr key={q.id} className="relative hover:bg-orange-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/rfqs/${q.id}`} className="font-mono text-xs font-bold text-slate-900 after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-orange-400">
                        {q.quote_number}
                      </Link>
                      {q.ai_recommended && <p className="text-[10px] text-orange-600 font-semibold">via AI chat</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{q.guest_company || q.guest_name}</p>
                      <p className="text-xs text-slate-500">{q.guest_company ? q.guest_name : q.guest_email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <p>{q.items.length} line{q.items.length === 1 ? '' : 's'} · {units.toLocaleString()} units</p>
                      <p className="text-slate-400 truncate max-w-[220px]">{q.items[0]?.name || q.items[0]?.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {q.delivery_type ? (
                        <span className="inline-flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-slate-400" aria-hidden />{DELIVERY_LABELS[q.delivery_type].label}</span>
                      ) : '—'}
                      <p className="text-slate-400">
                        {q.delivery_zip ?? ''}
                        {q.needed_by ? ` · by ${new Date(q.needed_by + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold tabular-nums ${late ? 'text-red-600' : 'text-slate-600'}`} title={new Date(q.created_at).toLocaleString()}>
                        {ageLabel(q.created_at, now)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">
                      {q.total_cents ? formatPrice(q.total_cents) : <span className="text-slate-300 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ring-1 ${STATUS_STYLES[s]}`}>{STATUS_LABELS[s]}</span>
                    </td>
                    <td className="px-2 py-3 text-slate-300"><ChevronRight className="w-4 h-4" aria-hidden /></td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
