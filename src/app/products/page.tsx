import type { Metadata } from 'next'
import { ProductListing } from '@/components/products/ProductListing'
import { JOBS, parseCatalogQuery } from '@/lib/catalog'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = parseCatalogQuery(await searchParams)
  const job = query.job ? JOBS[query.job] : undefined
  const filtered = Object.keys(query).some((k) => k !== 'job')
  return {
    title: job ? `Wholesale Tarps for ${job.label}` : 'Wholesale Heavy-Duty Tarps — Shop by Size, Type & Thickness',
    description: job
      ? `${job.blurb} Volume pricing from 5 units, case and pallet quotes. Kansas City based, Midwest freight.`
      : 'Browse 240+ poly, canvas, mesh, clear vinyl and fire-retardant tarps plus tie-downs and straps. 5 to 20 mil. Volume pricing from 5 units, pallet quotes for contractors.',
    alternates: { canonical: job && !filtered ? `/products?job=${query.job}` : '/products' },
    robots: filtered ? { index: false, follow: true } : undefined,
  }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const query = parseCatalogQuery(await searchParams)
  return (
    <ProductListing
      basePath="/products"
      query={query}
      title="All Tarps & Supplies"
      subtitle="Heavy-duty tarps and tie-downs by the unit, case or pallet. Every price shows its volume discount."
      breadcrumb={[{ href: '/', label: 'Home' }, { label: 'Products' }]}
    />
  )
}
