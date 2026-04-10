import { notFound } from 'next/navigation'
import { getProductBySlug, getRelatedProducts } from '@/lib/products'
import { AddToCartOrRFQ } from '@/components/products/AddToCartOrRFQ'
import { ProductCard } from '@/components/products/ProductCard'
import { formatPrice } from '@/lib/utils'
import { CheckCircle, Package, Truck, Shield, RotateCcw } from 'lucide-react'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}
  return {
    title: `${product.name} | MegaTarps`,
    description: `${product.name}. ${product.width_ft}x${product.length_ft} ft${product.thickness_mil ? `, ${product.thickness_mil}-mil` : ''}, ${product.color}. ${product.product_line?.description?.slice(0, 120) ?? ''}`,
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

  const images = product.image_urls ?? []
  const mainImage = images[0]

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="text-sm text-slate-500 flex items-center gap-1.5 flex-wrap">
            <a href="/" className="hover:text-orange-600 transition-colors">Home</a>
            <span>/</span>
            <a href="/products" className="hover:text-orange-600 transition-colors">Products</a>
            <span>/</span>
            <span className="text-slate-800 font-medium truncate max-w-xs">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-16">

          {/* ─── Images ─── */}
          <div>
            <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative shadow-md">
              {mainImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-300">
                  <Package className="w-24 h-24" />
                  <span className="text-sm text-slate-400">No image available</span>
                </div>
              )}
              {pl?.fire_retardant && (
                <div className="absolute top-4 left-4 bg-red-600 text-white font-bold px-3 py-1.5 rounded-xl text-sm">
                  🔥 FIRE RETARDANT
                </div>
              )}
            </div>
            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {images.slice(0, 5).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200 hover:border-orange-400 transition-colors cursor-pointer"
                  />
                ))}
              </div>
            )}
          </div>

          {/* ─── Product Info ─── */}
          <div>
            {/* Product line label */}
            {pl?.name && (
              <p className="text-orange-600 text-sm font-bold uppercase tracking-wide mb-2">{pl.name}</p>
            )}

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 leading-tight">
              {product.name}
            </h1>
            <p className="text-slate-400 text-sm mb-4">SKU: {product.xpose_sku}</p>

            {/* Price */}
            {product.retail_price_cents > 0 ? (
              <div className="mb-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900">
                    {formatPrice(product.retail_price_cents)}
                  </span>
                  <span className="text-slate-500 text-base">/ unit</span>
                </div>
                <p className="text-sm text-orange-600 font-semibold mt-1">
                  5+ units? Request bulk pricing →
                </p>
              </div>
            ) : (
              <div className="mb-5 bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="font-bold text-slate-900">Bulk / Quote Only</p>
                <p className="text-sm text-slate-500 mt-0.5">Contact us for pricing on this item</p>
              </div>
            )}

            {/* Feature badges */}
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {features.map((f) => (
                  <span
                    key={f}
                    className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-3 py-1.5 rounded-full"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> {f}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {pl?.description && (
              <p className="text-slate-600 mb-6 leading-relaxed text-sm">{pl.description}</p>
            )}

            {/* Add to cart / RFQ */}
            <AddToCartOrRFQ product={product} />

            {/* Shipping info */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: <Truck className="w-4 h-4" />, label: 'Ships Nationwide' },
                { icon: <Shield className="w-4 h-4" />, label: 'Genuine Product' },
                { icon: <RotateCcw className="w-4 h-4" />, label: 'Hassle-free Returns' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1.5 bg-slate-50 rounded-xl p-3">
                  <span className="text-orange-500">{icon}</span>
                  <span className="text-xs font-medium text-slate-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Specs Table ─── */}
        <div className="mb-16">
          <h2 className="text-xl font-black text-slate-900 mb-4">Product Specifications</h2>
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <tbody>
                {specs.map(([label, value], i) => (
                  <tr key={label} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="py-3 px-5 text-sm font-semibold text-slate-600 w-44">{label}</td>
                    <td className="py-3 px-5 text-sm text-slate-900 font-medium">{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Related Products ─── */}
        {related.length > 0 && (
          <div>
            <h2 className="text-xl font-black text-slate-900 mb-5">More from this Line</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
