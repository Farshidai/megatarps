import Link from 'next/link'
import type { Metadata } from 'next'
import { Search, ChevronRight, FileCheck2 } from 'lucide-react'
import { requireAdmin } from '@/lib/admin'
import { getStatusCounts, listApplications, type StatusFilter } from './data'
import { StatusBadge } from './StatusBadge'

export const metadata: Metadata = { title: 'Wholesale Accounts' }

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
]

export default async function AdminAccountsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin('/admin/accounts')
  const sp = await props.searchParams
  const raw = typeof sp.status === 'string' ? sp.status : 'all'
  const status: StatusFilter = (['all', 'pending', 'approved', 'rejected'] as const).includes(raw as StatusFilter) ? (raw as StatusFilter) : 'all'
  const q = typeof sp.q === 'string' ? sp.q.slice(0, 100) : ''

  const [counts, rows] = await Promise.all([getStatusCounts(), listApplications(status, q)])
  const href = (s: StatusFilter) => `/admin/accounts?${new URLSearchParams({ ...(s !== 'all' ? { status: s } : {}), ...(q ? { q } : {}) })}`

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Wholesale accounts</h1>
          <p className="text-sm text-slate-500">
            {counts.pending > 0 ? (
              <><strong className="text-amber-700">{counts.pending} pending</strong> application{counts.pending === 1 ? '' : 's'} to review</>
            ) : 'No applications waiting for review'}
            {admin.demo && <span className="ml-2 text-xs text-slate-400">(demo data)</span>}
          </p>
        </div>
        <form className="relative w-full sm:w-72" role="search" action="/admin/accounts">
          {status !== 'all' && <input type="hidden" name="status" value={status} />}
          <label htmlFor="acct-q" className="sr-only">Search accounts</label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
          <input id="acct-q" name="q" defaultValue={q} placeholder="Search company, contact, email"
            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400" />
        </form>
      </div>

      <nav aria-label="Filter by status" className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map((f) => {
          const active = f.value === status
          return (
            <Link key={f.value} href={href(f.value)} aria-current={active ? 'page' : undefined}
              className={`px-3 py-1.5 rounded-full text-sm border font-semibold transition-colors ${
                active ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 bg-white text-slate-600 hover:border-orange-400 hover:text-orange-600'
              }`}>
              {f.label} <span className={active ? 'text-slate-300' : 'text-slate-400'}>{counts[f.value]}</span>
            </Link>
          )
        })}
      </nav>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-400">No {status === 'all' ? '' : status} applications{q ? ` matching “${q}”` : ''}.</p>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Company</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Type</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Est. volume</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Applied</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((a) => (
                  <tr key={a.id} className="hover:bg-orange-50/40">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/accounts/${a.id}`} className="font-bold text-slate-900 hover:text-orange-600">{a.company_name}</Link>
                      <p className="text-xs text-slate-500">{a.contact_name} · {a.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {a.business_type ?? '—'}
                      {a.resale_certificate_path && <FileCheck2 className="inline w-3.5 h-3.5 ml-1.5 text-emerald-600" aria-label="Certificate on file" />}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{a.est_monthly_volume ?? '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600">{new Date(a.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={a.account_status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/admin/accounts/${a.id}`} className="text-orange-600 font-semibold hover:underline text-xs">
                        {a.account_status === 'pending' ? 'Review' : 'View'}<span className="sr-only"> {a.company_name}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Mobile list */}
            <ul className="md:hidden divide-y divide-slate-100">
              {rows.map((a) => (
                <li key={a.id}>
                  <Link href={`/admin/accounts/${a.id}`} className="flex items-center gap-3 px-4 py-4 hover:bg-orange-50/40">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 truncate">{a.company_name}</p>
                        <StatusBadge status={a.account_status} />
                      </div>
                      <p className="text-xs text-slate-500 truncate">{a.business_type ?? '—'} · {a.est_monthly_volume ?? '—'}</p>
                      <p className="text-xs text-slate-400">Applied {new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
