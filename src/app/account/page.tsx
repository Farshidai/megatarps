import { createClient } from '@/lib/supabase/server'
import { FileText, ShoppingBag, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Account' }

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
        <h2 className="text-xl font-black text-slate-900 mb-3">Sign in to your account</h2>
        <p className="text-slate-500 mb-6">Track your quote requests and orders in one place.</p>
        <div className="flex gap-3 justify-center">
          <a href="/account/login"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-sm">
            Sign In
          </a>
          <a href="/account/register"
            className="border-2 border-slate-200 hover:border-orange-400 text-slate-700 font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
            Create Account
          </a>
        </div>
        <p className="text-slate-400 text-xs mt-6">
          Don&apos;t have an account? You can still <a href="/bulk-quote" className="text-orange-600 hover:underline">request a bulk quote</a> as a guest.
        </p>
      </div>
    )
  }

  const [{ data: quotes, count: quoteCount }, { data: orders, count: orderCount }] = await Promise.all([
    supabase.from('quotes').select('*', { count: 'exact' })
      .eq('contractor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase.from('orders').select('*', { count: 'exact' })
      .eq('contractor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h1 className="text-xl font-black text-slate-900 mb-1">Welcome back!</h1>
        <p className="text-slate-500 text-sm">{user.email}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <a href="/account/quotes" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-orange-300 transition-colors flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{quoteCount ?? 0}</p>
            <p className="text-xs text-slate-500">Quote Requests</p>
          </div>
        </a>
        <a href="/account/orders" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-orange-300 transition-colors flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{orderCount ?? 0}</p>
            <p className="text-xs text-slate-500">Orders</p>
          </div>
        </a>
      </div>

      {/* Recent quotes */}
      {quotes && quotes.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">Recent Quotes</h2>
            <a href="/account/quotes" className="text-xs text-orange-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <div className="divide-y divide-slate-100">
            {quotes.map(q => (
              <div key={q.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{q.quote_number}</p>
                  <p className="text-xs text-slate-500">{(q.items as Array<unknown>).length} item(s) · {new Date(q.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  q.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  q.status === 'quoted' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {q.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      {orders && orders.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">Recent Orders</h2>
            <a href="/account/orders" className="text-xs text-orange-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <div className="divide-y divide-slate-100">
            {orders.map(o => (
              <div key={o.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{o.order_number}</p>
                  <p className="text-xs text-slate-500">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  o.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                  o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!quotes?.length && !orders?.length && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-400 text-sm mb-4">No activity yet. Start by browsing products.</p>
          <a href="/products" className="text-orange-600 font-semibold hover:underline text-sm">
            Browse Products →
          </a>
        </div>
      )}
    </div>
  )
}
