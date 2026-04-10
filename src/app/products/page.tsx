import { Suspense } from 'react'
import { getProducts } from '@/lib/products'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductFilters } from '@/components/products/ProductFilters'
import { CATEGORY_LABELS, TARP_TYPE_LABELS, THICKNESS_LABELS } from '@/lib/utils'
import { SlidersHorizontal } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'All Heavy-Duty Tarps — Shop by Size, Type & Thickness | MegaTarps',
  description: 'Browse 200+ poly tarps, canvas tarps, mesh tarps, clear vinyl, and fire-retardant tarps. 5-mil to 20-mil. Wholesale pricing for 5+ units.',
}

interface PageProps {
  searchParams: Promise<{ category?: string; type?: string; thickness?: string }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { category, type, thickness } = await searchParams

  const products = await getProducts({
    category,
    tarp_type: type,
    thickness_mil: thickness ? Number(thickness) : undefined,
  })

  const categoryLabel = category ? CATEGORY_LABELS[category] : null
  const typeLabel = type ? TARP_TYPE_LABELS[type] : null
  const thicknessLabel = thickness ? THICKNESS_LABELS[Number(thickness)] : null
  const pageTitle = categoryLabel ?? typeLabel ?? thicknessLabel ?? 'All Tarps'
  const activeFilters = [categoryLabel, typeLabel, thicknessLabel].filter(Boolean)

  return (
    <div className="bg-white min-h-screen">
      {/* Page header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-slate-400 mb-3">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <span className="mx-2">/</span>
            <span className="text-slate-200">{pageTitle}</span>
          </nav>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">{pageTitle}</h1>
              <p className="text-slate-400 mt-1 text-sm">
                {products.length} product{products.length !== 1 ? 's' : ''}
                {activeFilters.length > 0 && ` · Filtered by: ${activeFilters.join(', ')}`}
              </p>
            </div>
            {activeFilters.length > 0 && (
              <a href="/products" className="text-sm text-orange-400 hover:text-orange-300 font-semibold whitespace-nowrap transition-colors">
                Clear filters ×
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 mb-5">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <h2 className="font-bold text-slate-900">Filter Products</h2>
              </div>
              <Suspense>
                <ProductFilters
                  currentCategory={category}
                  currentType={type}
                  currentThickness={thickness ? Number(thickness) : undefined}
                />
              </Suspense>
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No products found</h3>
                <p className="text-slate-500 mb-6">Try adjusting or clearing your filters.</p>
                <a
                  href="/products"
                  className="bg-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors"
                >
                  View All Products
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
