import { getProducts } from '@/lib/products'
import { ProductCard } from '@/components/products/ProductCard'
import { CATEGORY_LABELS } from '@/lib/utils'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  const label = CATEGORY_LABELS[category]
  if (!label) return {}
  return {
    title: `${label} Tarps — Heavy Duty`,
    description: `Shop heavy-duty tarps for ${label.toLowerCase()}. Poly, canvas, fire-retardant options. Bulk pricing for 5+ units.`,
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params
  const label = CATEGORY_LABELS[category]

  if (!label) notFound()

  const products = await getProducts({ category })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-slate-500 mb-6">
        <a href="/" className="hover:text-orange-600">Home</a>
        <span className="mx-2">/</span>
        <a href="/products" className="hover:text-orange-600">Products</a>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium">{label}</span>
      </nav>

      <h1 className="text-3xl font-black text-slate-900 mb-2">{label} Tarps</h1>
      <p className="text-slate-500 mb-8">{products.length} products</p>

      {products.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          No products found in this category. <a href="/products" className="text-orange-600 hover:underline">Browse all products</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
