import { LayoutDashboard, FileText, ShoppingBag, Package, Settings, Tag } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | MegaTarps Admin' },
  robots: 'noindex',
}

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/rfqs', label: 'Quote Requests', icon: FileText },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/pricing-rules', label: 'Pricing Rules', icon: Tag },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="px-4 py-5 border-b border-slate-700">
          <p className="font-black text-orange-400 text-lg">MegaTarps</p>
          <p className="text-slate-400 text-xs">Admin Panel</p>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </a>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-700">
          <a href="/" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
            <Settings className="w-3 h-3" /> Back to site
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
