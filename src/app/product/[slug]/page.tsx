import { notFound } from 'next/navigation'
import { getProductBySlug, getRelatedProducts } from '@/lib/products'
import { AddToCartOrRFQ } from '@/components/products/AddToCartOrRFQ'
import { ProductCard } from '@/components/products/ProductCard'
import { formatPrice } from '@/lib/utils'
import { CheckCircle, Package } from 'lucide-react'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}
  return {
    title: product.name,
    description: `${product.name}. ${product.width_ft}x${product.length_ft} ft, ${product.thickness_mil ? `${product.thickness_mil}-mil, ` : ''}${product.color}. ${product.product_line?.description?.slice(0, 120) ?? ''}`,
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  const related = await getRelatedProducts(product)
  const pl = product.product_line

  const specs: Array<[string, string | number | boolean | null | undefined]> = [
    ['SKU', product.xpose_sku],
    ['Dimensions', `${product.width_ft} ft × ${product.length_ft} ft`],
    ['Coverage', `${product.coverage_sqft} sq ft`],
    ['Thickness', product.thickness_mil ? `${product.thickness_mil} mil` : null],
    ['Color', product.color],
    ['Material', pl?.material],
    ['Weave Count', pl?.weave_count],
    ['Weight', pl?.weight_oz_per_sqyd ? `${pl.weight_oz_per_sqyd} oz/sq yd` : null],
    ['Grommets', pl?.grommet_type],
    ['Grommet Spacing', pl?.grommet_spacing_inches ? `Every ${pl.grommet_spacing_inches}"` : null],
  ].filter(([, v]) => v != null) as Array<[string, string | number]>

  const features: string[] = [
    pl?.uv_resistant ? 'UV Resistant' : null,
    pl?.waterproof ? 'Waterproof' : null,
    pl?.mildew_resistant ? 'Mildew Resistant' : null,
    pl?.fire_retardant ? 'Fire Retardant' : null,
    pl?.reinforced_corners ? 'Reinforced Corners' : null,
    pl?.sewn_in_rope ? 'Sewn-In Rope' : null,
  ].filter(Boolean) as string[]

  const image = product.image_urls?.[0]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500 mb-6">
        <a href="/" className="hover:text-orange-600">Home</a>
        <span className="mx-2">/</span>
        <a href="/products" className="hover:text-orange-600">Products</a>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Image */}
        <div>
          <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-24 h-24 text-slate-300" />
              </div>
            )}
            {pl?.fire_retardant && (
              <div className="absolute top-4 left-4 bg-red-600 text-white font-bold px-3 py-1 rounded-lg">
                FIRE RETARDANT
              </div>
            )}
          </div>
          {/* Thumbnail strip if multiple images */}
          {product.image_urls && product.image_urls.length > 1 && (
            <div className="flex gap-2 mt-3">
              {product.image_urls.slice(0, 4).map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover border-2 border-slate-200" />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">{product.name}</h1>
          <p className="text-slate-500 text-sm mb-4">SKU: {product.xpose_sku}</p>

          {product.retail_price_cents > 0 && (
            <p className="text-4xl font-black text-slate-900 mb-6">
              {formatPrice(product.retail_price_cents)}
              <span className="text-base font-normal text-slate-500 ml-2">per unit</span>
            </p>
          )}

          {/* Features badges */}
          {features.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {features.map((f) => (
                <span key={f} className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-3 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" /> {f}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {pl?.description && (
            <p className="text-slate-600 mb-6 leading-relaxed">{pl.description}</p>
          )}

          {/* Add to cart / RFQ */}
          <AddToCartOrRFQ product={product} />
        </div>
      </div>

      {/* Specs table */}
      <div className="mb-16">
        <h2 className="text-2xl font-black text-slate-900 mb-6">Product Specifications</h2>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <tbody>
              {specs.map(([label, value], i) => (
                <tr key={label} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                  <td className="py-3 px-6 text-sm font-semibold text-slate-700 w-48">{label}</td>
                  <td className="py-3 px-6 text-sm text-slate-900">{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-6">More from this Line</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
