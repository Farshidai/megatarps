import Link from 'next/link'
import { cookies } from 'next/headers'
import { FileText, ShoppingBag, ArrowRight, BadgePercent, CalendarClock, FileCheck2, Headset, Building2 } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAccount, DEMO_ACCOUNT_COOKIE } from '@/lib/accounts'
import { StatusBanner } from './_components/StatusBanner'
import { DemoAccountSwitcher } from './_components/DemoAccountSwitcher'

export const metadata: Metadata = { title: 'My Account' }

type Row = { id: string; created_at: string; status: string; items?: unknown[]; quote_number?: string; order_number?: string }

export default async function AccountPage() {
  const { user, profile, demo } = await getCurrentAccount()
  const demoState = demo ? (await cookies()).get(DEMO_ACCOUNT_COOKIE)?.value ?? 'guest' : ''

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6">
        {demo && <DemoAccountSwitcher current={demoState} />}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center">
          <h1 className="text-2xl font-black text-slate-900 mb-2">Your MegaTarps account</h1>
          <p className="text-slate-500 mb-6">Sign in to track quotes and orders, or apply for wholesale pricing.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/account/login" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
              Sign in
            </Link>
            <Link href="/apply" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
              Apply for a wholesale account
            </Link>
          </div>
          <ul className="grid sm:grid-cols-2 gap-3 text-left mt-8">
            {[
              { icon: BadgePercent, t: 'Wholesale tier pricing' },
              { icon: CalendarClock, t: 'Net terms for qualified buyers' },
              { icon: FileCheck2, t: 'Tax-exempt purchasing' },
              { icon: Headset, t: 'A dedicated account rep' },
            ].map(({ icon: Icon, t }) => (
              <li key={t} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                <Icon className="w-4 h-4 text-orange-500" aria-hidden /> {t}
              </li>
            ))}
          </ul>
          <p className="text-slate-400 text-xs mt-6">
            No account needed to <Link href="/bulk-quote" className="text-orange-600 hover:underline">request a bulk quote</Link>.
          </p>
        </div>
      </div>
    )
  }

  let quotes: Row[] = []
  let orders: Row[] = []
  let quoteCount = 0
  let orderCount = 0
  if (!demo) {
    const supabase = await createClient()
    const [q, o] = await Promise.all([
      supabase.from('quotes').select('id, quote_number, status, created_at, items', { count: 'exact' })
        .eq('contractor_id', user.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('orders').select('id, order_number, status, created_at', { count: 'exact' })
        .eq('contractor_id', user.id).order('created_at', { ascending: false }).limit(3),
    ])
    quotes = (q.data as Row[] | null) ?? []
    orders = (o.data as Row[] | null) ?? []
    quoteCount = q.count ?? 0
    orderCount = o.count ?? 0
  }

  const firstName = (profile?.contact_name ?? '').split(' ')[0]

  return (
    <div className="space-y-6">
      {demo && <DemoAccountSwitcher current={demoState} />}

      <div>
        <h1 className="text-2xl font-black text-slate-900">Welcome back{firstName ? `, ${firstName}` : ''}</h1>
        <p className="text-slate-500 text-sm">{user.email}</p>
      </div>

      <StatusBanner profile={profile} />

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/account/quotes" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-orange-300 transition-colors flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-orange-600" aria-hidden />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{quoteCount}</p>
            <p className="text-xs text-slate-500">Quote requests</p>
          </div>
        </Link>
        <Link href="/account/orders" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-orange-300 transition-colors flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-blue-600" aria-hidden />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{orderCount}</p>
            <p className="text-xs text-slate-500">Orders</p>
          </div>
        </Link>
      </div>

      {profile && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" aria-hidden /> Company profile</h2>
            <Link href="/account/settings" className="text-xs text-orange-600 hover:underline">Edit</Link>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {[
              ['Company', profile.company_name],
              ['Business type', profile.business_type ?? '—'],
              ['Service area', profile.service_area ?? '—'],
              ['Contact', profile.contact_name],
              ['Phone', profile.phone ?? '—'],
              ['Saved jobsites', String(profile.jobsite_addresses?.length ?? 0)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="font-medium text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {quotes.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">Recent quotes</h2>
            <Link href="/account/quotes" className="text-xs text-orange-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" aria-hidden />
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {quotes.map((q) => (
              <li key={q.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{q.quote_number}</p>
                  <p className="text-xs text-slate-500">{(q.items ?? []).length} item(s) · {new Date(q.created_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">{q.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {orders.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">Recent orders</h2>
            <Link href="/account/orders" className="text-xs text-orange-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" aria-hidden />
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {orders.map((o) => (
              <li key={o.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{o.order_number}</p>
                  <p className="text-xs text-slate-500">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">{o.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!quotes.length && !orders.length && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-400 text-sm mb-4">No quotes or orders yet.</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link href="/products" className="text-orange-600 font-semibold hover:underline">Browse products →</Link>
            <Link href="/bulk-quote" className="text-orange-600 font-semibold hover:underline">Request a bulk quote →</Link>
          </div>
        </div>
      )}
    </div>
  )
}
