'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Phone, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const categories = [
  { href: '/products/construction-roofing', label: 'Construction & Roofing' },
  { href: '/products/agriculture-farming', label: 'Agriculture & Farming' },
  { href: '/products/industrial-warehouse', label: 'Industrial & Warehouse' },
  { href: '/products/general-purpose', label: 'General Purpose' },
]

const productTypes = [
  { href: '/products/type/poly-tarps', label: 'Poly Tarps' },
  { href: '/products/type/canvas-tarps', label: 'Canvas Tarps' },
  { href: '/products/type/clear-vinyl-tarps', label: 'Clear Vinyl Tarps' },
  { href: '/products/type/mesh-tarps', label: 'Mesh Tarps' },
  { href: '/products/type/fire-retardant-tarps', label: 'Fire Retardant' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-slate-900 text-slate-300 text-sm py-1.5 px-4 text-center">
        <span>Bulk pricing available for 5+ units — </span>
        <Link href="/bulk-quote" className="text-orange-400 font-semibold hover:text-orange-300 underline">
          Request a Quote
        </Link>
        <span className="ml-4 hidden sm:inline">
          <Phone className="inline w-3 h-3 mr-1" />
          Questions? <a href="tel:+1-800-000-0000" className="hover:text-white">(800) 000-0000</a>
        </span>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="bg-orange-500 text-white font-black text-lg px-3 py-1 rounded">
              MEGA
            </div>
            <span className="text-slate-900 font-bold text-xl tracking-tight">TARPS</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {/* Products dropdown */}
            <div className="relative" onMouseEnter={() => setProductsOpen(true)} onMouseLeave={() => setProductsOpen(false)}>
              <button className="flex items-center gap-1 text-slate-700 hover:text-orange-600 font-medium py-5">
                Products <ChevronDown className="w-4 h-4" />
              </button>
              {productsOpen && (
                <div className="absolute top-full left-0 w-96 bg-white rounded-b-xl shadow-xl border border-slate-100 p-4 grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">By Use</p>
                    {categories.map(c => (
                      <Link key={c.href} href={c.href} className="block text-sm text-slate-700 hover:text-orange-600 py-1">
                        {c.label}
                      </Link>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">By Type</p>
                    {productTypes.map(t => (
                      <Link key={t.href} href={t.href} className="block text-sm text-slate-700 hover:text-orange-600 py-1">
                        {t.label}
                      </Link>
                    ))}
                  </div>
                  <div className="col-span-2 mt-2 pt-2 border-t border-slate-100">
                    <Link href="/products" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
                      View All Products →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/bulk-quote" className="text-slate-700 hover:text-orange-600 font-medium">
              Bulk Pricing
            </Link>
            <Link href="/resources" className="text-slate-700 hover:text-orange-600 font-medium">
              Resources
            </Link>
            <Link href="/about" className="text-slate-700 hover:text-orange-600 font-medium">
              About
            </Link>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/account" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
              Contractor Login
            </Link>
            <Link
              href="/bulk-quote"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Get Bulk Quote
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-4 space-y-1">
            <Link href="/products" className="block px-3 py-2 text-slate-700 font-medium hover:bg-slate-50 rounded-lg" onClick={() => setMobileOpen(false)}>
              All Products
            </Link>
            {categories.map(c => (
              <Link key={c.href} href={c.href} className="block px-3 py-2 text-slate-600 text-sm hover:bg-slate-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                {c.label}
              </Link>
            ))}
            <hr className="my-2 border-slate-100" />
            <Link href="/bulk-quote" className="block px-3 py-2 text-slate-700 font-medium hover:bg-slate-50 rounded-lg" onClick={() => setMobileOpen(false)}>
              Bulk Pricing / RFQ
            </Link>
            <Link href="/resources" className="block px-3 py-2 text-slate-700 font-medium hover:bg-slate-50 rounded-lg" onClick={() => setMobileOpen(false)}>
              Resources
            </Link>
            <Link href="/account" className="block px-3 py-2 text-slate-700 font-medium hover:bg-slate-50 rounded-lg" onClick={() => setMobileOpen(false)}>
              Contractor Login
            </Link>
            <Link
              href="/bulk-quote"
              className="block mx-3 mt-2 bg-orange-500 text-white font-bold text-center py-3 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Get Bulk Quote
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
