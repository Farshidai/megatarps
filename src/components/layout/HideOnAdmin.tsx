'use client'

// Hides the public storefront chrome (navbar, footer, chat bubble) on /admin pages, which
// have their own layout. Server-rendered too (usePathname works during SSR), so no flash.
import { usePathname } from 'next/navigation'

export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? ''
  if (path === '/admin' || path.startsWith('/admin/')) return null
  return <>{children}</>
}
