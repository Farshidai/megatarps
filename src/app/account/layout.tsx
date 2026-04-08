import { LayoutDashboard, FileText, ShoppingBag, Heart, Settings } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'My Account', template: '%s | MegaTarps' },
}

const NAV = [
  { href: '/account', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/account/quotes', label: 'My Quotes', icon: FileText },
  { href: '/account/orders', label: 'My Orders', icon: ShoppingBag },
  { href: '/account/saved-products', label: 'Saved Products', icon: Heart },
  { href: '/account/settings', label: 'Account Settings', icon: Settings },
]

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row gap-8">
        {/* Sidebar */}
        <aside className="sm:w-48 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-4 border-b border-slate-100">
              <p className="font-bold text-slate-900 text-sm">My Account</p>
            </div>
            <nav className="py-2">
              {NAV.map(({ href, label, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
