import { Suspense } from 'react'
import { getProducts } from '@/lib/products'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductFilters } from '@/components/products/ProductFilters'
import { CATEGORY_LABELS, TARP_TYPE_LABELS, THICKNESS_LABELS } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'All Heavy-Duty Tarps — Shop by Size, Type & Thickness',
  description: 'Browse our full catalog of poly tarps, canvas tarps, mesh tarps, clear vinyl, and fire-retardant tarps. 5-mil to 20-mil. Wholesale pricing for 5+ units.',
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500 mb-6">
        <a href="/" className="hover:text-orange-600">Home</a>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium">{pageTitle}</span>
      </nav>

      <div className="flex gap-8">
        {/* Sidebar filters */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <h2 className="font-black text-slate-900 text-lg mb-4">Filter Products</h2>
          <Suspense>
            <ProductFilters
              currentCategory={category}
              currentType={type}
              currentThickness={thickness ? Number(thickness) : undefined}
            />
          </Suspense>
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black text-slate-900">{pageTitle}</h1>
            <span className="text-slate-500 text-sm">{products.length} products</span>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg mb-4">No products found for these filters.</p>
              <a href="/products" className="text-orange-600 font-semibold hover:underline">
                Clear filters
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
