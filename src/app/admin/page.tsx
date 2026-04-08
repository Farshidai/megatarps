import { createAdminClient } from '@/lib/supabase/server'
import { FileText, ShoppingBag, Package, DollarSign } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function AdminDashboard() {
  const supabase = await createAdminClient()

  const [{ count: pendingQuotes }, { count: totalOrders }, { count: totalProducts }, { data: recentQuotes }] =
    await Promise.all([
      supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true),
      supabase.from('quotes')
        .select('id, quote_number, guest_name, guest_email, guest_company, status, created_at, items')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

  const stats = [
    { label: 'Pending Quotes', value: pendingQuotes ?? 0, icon: FileText, href: '/admin/rfqs', color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Orders', value: totalOrders ?? 0, icon: ShoppingBag, href: '/admin/orders', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Products', value: totalProducts ?? 0, icon: Package, href: '/admin/products', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Revenue', value: '—', icon: DollarSign, href: '/admin/orders', color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-slate-900 mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(s => (
          <a key={s.label} href={s.href}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-orange-300 hover:shadow-sm transition-all flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Recent quotes */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">Recent Quote Requests</h2>
          <a href="/admin/rfqs" className="text-sm text-orange-600 hover:underline">View all →</a>
        </div>
        <div className="divide-y divide-slate-100">
          {!recentQuotes?.length ? (
            <p className="px-6 py-8 text-sm text-slate-400 text-center">No quotes yet</p>
          ) : recentQuotes.map(q => (
            <a key={q.id} href={`/admin/rfqs?id=${q.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
              <div>
                <p className="text-sm font-semibold text-slate-900">{q.guest_name}{q.guest_company ? ` — ${q.guest_company}` : ''}</p>
                <p className="text-xs text-slate-500">{q.quote_number} · {q.guest_email}</p>
                <p className="text-xs text-slate-400">{(q.items as Array<{quantity: number; name: string}>).length} item(s)</p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  q.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  q.status === 'quoted' ? 'bg-blue-100 text-blue-700' :
                  q.status === 'accepted' ? 'bg-green-100 text-green-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {q.status}
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(q.created_at).toLocaleDateString()}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
