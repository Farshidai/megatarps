import Link from 'next/link'
import { LayoutDashboard, FileText, ShoppingBag, Heart, Settings } from 'lucide-react'
import type { Metadata } from 'next'
import { getCurrentAccount } from '@/lib/accounts'

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

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  approved: { label: 'Wholesale · Approved', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  pending: { label: 'Pending review', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  rejected: { label: 'Not approved', cls: 'bg-red-50 text-red-700 ring-red-200' },
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentAccount()

  // Signed out (login / forgot-password / signed-out dashboard): no sidebar.
  if (!user) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>

  const chip = profile ? STATUS_CHIP[profile.account_status] : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Sidebar */}
        <aside className="md:w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-4 border-b border-slate-100">
              <p className="font-bold text-slate-900 text-sm truncate">{profile?.company_name ?? 'My Account'}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
              {chip && (
                <span className={`mt-2 inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ring-1 ${chip.cls}`}>{chip.label}</span>
              )}
            </div>
            <nav aria-label="Account" className="py-2 flex md:block overflow-x-auto">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 md:gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors whitespace-nowrap"
                >
                  <Icon className="w-4 h-4" aria-hidden />
                  {label}
                </Link>
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
