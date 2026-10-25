import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ProductListing } from '@/components/products/ProductListing'
import { parseCatalogQuery } from '@/lib/catalog'
import { CATEGORY_LABELS } from '@/lib/utils'

interface PageProps {
  params: Promise<{ category: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { category } = await params
  const label = CATEGORY_LABELS[category]
  if (!label) return {}
  const filtered = Object.keys(parseCatalogQuery(await searchParams)).length > 0
  return {
    title: `${label} Tarps — Wholesale & Bulk`,
    description: `Heavy-duty tarps and supplies for ${label.toLowerCase()}. Poly, canvas, mesh and fire-retardant options with volume pricing from 5 units and pallet quotes.`,
    alternates: { canonical: `/products/${category}` },
    robots: filtered ? { index: false, follow: true } : undefined,
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category } = await params
  const label = CATEGORY_LABELS[category]
  if (!label) notFound()
  const { category: _ignored, ...query } = parseCatalogQuery(await searchParams)
  void _ignored

  return (
    <ProductListing
      basePath={`/products/${category}`}
      query={query}
      fixedCategory={category}
      title={`${label} Tarps`}
      subtitle={`Tarps, covers and tie-downs for ${label.toLowerCase()}, with volume pricing on every SKU.`}
      breadcrumb={[{ href: '/', label: 'Home' }, { href: '/products', label: 'Products' }, { label }]}
    />
  )
}
