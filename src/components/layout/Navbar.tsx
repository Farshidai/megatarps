'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Phone, ChevronDown, ShoppingCart, Search } from 'lucide-react'

const categories = [
  { href: '/products/construction-roofing', label: 'Construction & Roofing', icon: '🏗️' },
  { href: '/products/agriculture-farming', label: 'Agriculture & Farming', icon: '🌾' },
  { href: '/products/industrial-warehouse', label: 'Industrial & Warehouse', icon: '🏭' },
  { href: '/products/general-purpose', label: 'General Purpose', icon: '🔧' },
]

const productTypes = [
  { href: '/products?type=poly', label: 'Poly Tarps' },
  { href: '/products?type=canvas', label: 'Canvas Tarps' },
  { href: '/products?type=clear-vinyl', label: 'Clear Vinyl Tarps' },
  { href: '/products?type=mesh', label: 'Mesh Tarps' },
  { href: '/products?type=fire-retardant', label: 'Fire Retardant' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top announcement bar */}
      <div className="bg-orange-500 text-white text-xs sm:text-sm py-2 px-4 text-center font-medium">
        Free shipping on orders over $199 &bull;{' '}
        <Link href="/bulk-quote" className="underline underline-offset-2 hover:no-underline">
          Bulk orders? Get a quote in 4 hours →
        </Link>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-0">
              <span className="bg-orange-500 text-white font-black text-xl px-2 py-1 rounded-l-md leading-none">MEGA</span>
              <span className="bg-slate-900 text-white font-black text-xl px-2 py-1 rounded-r-md leading-none">TARPS</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {/* Products dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <button className="flex items-center gap-1 text-slate-700 hover:text-orange-600 font-semibold px-4 py-5 text-sm transition-colors">
                Products <ChevronDown className={`w-4 h-4 transition-transform ${productsOpen ? 'rotate-180' : ''}`} />
              </button>

              {productsOpen && (
                <div className="absolute top-full left-0 w-[480px] bg-white rounded-xl shadow-2xl border border-slate-100 p-5 grid grid-cols-2 gap-6 -ml-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Shop by Use</p>
                    <div className="space-y-1">
                      {categories.map(c => (
                        <Link
                          key={c.href}
                          href={c.href}
                          className="flex items-center gap-2 text-sm text-slate-700 hover:text-orange-600 hover:bg-orange-50 px-2 py-1.5 rounded-lg transition-colors"
                        >
                          <span>{c.icon}</span> {c.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Shop by Type</p>
                    <div className="space-y-1">
                      {productTypes.map(t => (
                        <Link
                          key={t.href}
                          href={t.href}
                          className="block text-sm text-slate-700 hover:text-orange-600 hover:bg-orange-50 px-2 py-1.5 rounded-lg transition-colors"
                        >
                          {t.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 border-t border-slate-100 pt-3 flex items-center justify-between">
                    <Link href="/products" className="text-sm font-bold text-orange-600 hover:text-orange-700">
                      View All Products →
                    </Link>
                    <Link href="/bulk-quote" className="text-xs bg-orange-500 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors">
                      Get Bulk Quote
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/bulk-quote" className="text-slate-700 hover:text-orange-600 font-semibold px-4 py-5 text-sm transition-colors">
              Bulk Pricing
            </Link>
            <Link href="/resources" className="text-slate-700 hover:text-orange-600 font-semibold px-4 py-5 text-sm transition-colors">
              Resources
            </Link>
            <Link href="/about" className="text-slate-700 hover:text-orange-600 font-semibold px-4 py-5 text-sm transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-slate-700 hover:text-orange-600 font-semibold px-4 py-5 text-sm transition-colors">
              Contact
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <button className="hidden lg:flex p-2 text-slate-500 hover:text-slate-900 transition-colors" aria-label="Search">
              <Search className="w-5 h-5" />
            </button>
            <Link href="/account" className="hidden lg:flex p-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
              Login
            </Link>
            <Link
              href="/bulk-quote"
              className="hidden lg:inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Get Quote
            </Link>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white shadow-lg">
          <div className="px-4 py-3 space-y-1">
            <Link href="/products" className="flex items-center gap-2 px-3 py-2.5 text-slate-800 font-semibold hover:bg-orange-50 rounded-lg" onClick={() => setMobileOpen(false)}>
              All Products
            </Link>
            {categories.map(c => (
              <Link key={c.href} href={c.href} className="flex items-center gap-2 px-3 py-2 text-slate-600 text-sm hover:bg-orange-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                <span>{c.icon}</span> {c.label}
              </Link>
            ))}
            <hr className="my-2 border-slate-100" />
            <Link href="/bulk-quote" className="flex items-center gap-2 px-3 py-2.5 text-slate-800 font-semibold hover:bg-orange-50 rounded-lg" onClick={() => setMobileOpen(false)}>
              Bulk Pricing / RFQ
            </Link>
            <Link href="/resources" className="flex items-center gap-2 px-3 py-2.5 text-slate-800 font-semibold hover:bg-orange-50 rounded-lg" onClick={() => setMobileOpen(false)}>
              Resources
            </Link>
            <Link href="/contact" className="flex items-center gap-2 px-3 py-2.5 text-slate-800 font-semibold hover:bg-orange-50 rounded-lg" onClick={() => setMobileOpen(false)}>
              Contact
            </Link>
            <Link href="/account" className="flex items-center gap-2 px-3 py-2.5 text-slate-600 hover:bg-orange-50 rounded-lg" onClick={() => setMobileOpen(false)}>
              Contractor Login
            </Link>
            <Link
              href="/bulk-quote"
              className="flex items-center justify-center gap-2 mx-3 mt-3 bg-orange-500 text-white font-bold text-center py-3 rounded-xl"
              onClick={() => setMobileOpen(false)}
            >
              <ShoppingCart className="w-4 h-4" /> Get Bulk Quote
            </Link>
          </div>

          {/* Mobile contact bar */}
          <div className="bg-slate-50 px-4 py-3 flex items-center justify-center gap-4 text-sm text-slate-500 border-t border-slate-100">
            <a href="tel:+18000000000" className="flex items-center gap-1.5 hover:text-orange-600">
              <Phone className="w-4 h-4" /> (800) 000-0000
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
