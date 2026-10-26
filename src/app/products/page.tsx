import { getProducts } from '@/lib/products'
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
  const count = (await getProducts()).length // real catalog size, never a hard-coded "240+"
  return {
    title: job ? `Wholesale Tarps for ${job.label}` : 'Wholesale Heavy-Duty Tarps — Shop by Size, Type & Thickness',
    description: job
      ? `${job.blurb} Per-tarp prices online, pallet pricing for approved wholesale accounts, case and pallet quotes. Kansas City based, Midwest freight.`
      : `Browse ${count} poly, canvas, mesh, clear vinyl and fire-retardant tarps plus tie-downs and straps. 5 to 20 mil. Per-tarp prices online, pallet pricing for approved accounts, pallet quotes for contractors.`,
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
      subtitle="Heavy-duty tarps and tie-downs by the unit, case or pallet. Prices shown are per unit; pallet pricing is for approved wholesale accounts."
      breadcrumb={[{ href: '/', label: 'Home' }, { label: 'Products' }]}
    />
  )
}
