import Link from 'next/link'
import { connection } from 'next/server'
import { LayoutDashboard, FileText, ShoppingBag, Package, Tag, Users, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin'
import { getPendingCount } from './accounts/data'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | MegaTarps Admin' },
  robots: 'noindex',
}

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/rfqs', label: 'RFQs / Quotes', icon: FileText },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/pricing-rules', label: 'Pricing Rules', icon: Tag },
  { href: '/admin/accounts', label: 'Accounts', icon: Users },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate for every admin page (proxy is only the first line of defense).
  await connection() // always render per request (auth + live counts)
  const admin = await requireAdmin()
  const pending = await getPendingCount()

  return (
    <div className="md:min-h-screen bg-slate-50 md:flex">
      {/* Sidebar (desktop) / top bar (mobile) */}
      <aside className="md:w-56 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="px-4 py-4 md:py-5 border-b border-slate-700 flex items-center justify-between md:block">
          <div>
            <p className="font-black text-orange-400 text-lg">MegaTarps</p>
            <p className="text-slate-400 text-xs">Admin{admin.demo ? ' · demo mode' : ''}</p>
          </div>
          <Link href="/" className="md:hidden text-xs text-slate-400 hover:text-white">Back to site</Link>
        </div>
        <nav aria-label="Admin" className="flex md:flex-col overflow-x-auto md:overflow-visible md:flex-1 md:py-4">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 md:gap-3 px-4 py-3 md:py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap"
            >
              <Icon className="w-4 h-4" aria-hidden />
              {label}
              {href === '/admin/accounts' && pending > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-[10px] font-black rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center" aria-label={`${pending} pending`}>
                  {pending}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="hidden md:block px-4 py-4 border-t border-slate-700">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" aria-hidden /> Back to site
          </Link>
          <p className="text-[11px] text-slate-600 mt-2 truncate">{admin.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-auto">
        {children}
      </div>
    </div>
  )
}
