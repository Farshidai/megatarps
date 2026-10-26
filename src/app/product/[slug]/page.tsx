import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import type { Metadata } from 'next'
import { CheckCircle, Truck, ShieldCheck, Clock, Flame } from 'lucide-react'
import { getProductBySlug, getRelatedProducts, getPricingRules } from '@/lib/products'
import { isQuoteOnly, priceTiers, palletTiers, lowestUnitPriceCents } from '@/lib/pricing'
import { getAccountPricing } from '@/lib/accounts'
import {
  toPublicProduct, seoTitle, seoDescription, gradeLabel, gaugeLabel, dimsLabel, isAccessory, isPalletSku, type CatalogProduct,
} from '@/lib/catalog'
import { AddToCartOrRFQ } from '@/components/products/AddToCartOrRFQ'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductImage } from '@/components/products/ProductImage'
import { TierPriceTable } from '@/components/products/TierPriceTable'
import { formatPrice, CATEGORY_LABELS } from '@/lib/utils'

interface PageProps {
  params: Promise<{ slug: string }>
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megatarps.com').replace(/\/$/, '')

// generateMetadata and the page share one lookup per request
const loadProduct = cache(async (slug: string) => {
  const p = await getProductBySlug(slug)
  return p ? (toPublicProduct(p) as CatalogProduct) : null
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await loadProduct(slug)
  if (!product) return { title: 'Product not found' }
  const title = seoTitle(product)
  const description = seoDescription(product)
  const image = product.image_urls?.[0]
  return {
    title: { absolute: `${title} | MegaTarps` },
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title, description, type: 'website', url: `${SITE_URL}/product/${product.slug}`, images: image ? [{ url: image, alt: product.name }] : undefined },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const [product, rules, account] = await Promise.all([loadProduct(slug), getPricingRules(), getAccountPricing()])
  const accountApproved = account.status === 'approved'
  if (!product) notFound()

  const related = (await getRelatedProducts(product)).map(toPublicProduct)
  const pl = product.product_line
  const quoteOnly = isQuoteOnly(product)
  const tiers = priceTiers(product, rules)
  const low = quoteOnly ? 0 : lowestUnitPriceCents(product, rules)
  const lowTier = tiers.find((t) => t.unit_price_cents === low)
  const acc = isAccessory(product)
  const pallets = palletTiers(product, rules)
  const bestPallet = pallets[pallets.length - 1]
  const palletSku = isPalletSku(product)
  const category = product.categories?.find((c) => CATEGORY_LABELS[c])

  const specs: Array<[string, string | null | undefined]> = [
    ['SKU', product.xpose_sku],
    ['Dimensions', dimsLabel(product) ? `${product.width_ft} ft × ${product.length_ft} ft (finished size)` : product.size_label],
    ['Coverage', product.coverage_sqft > 0 ? `${product.coverage_sqft.toLocaleString('en-US')} sq ft` : null],
    ['Thickness', product.thickness_mil ? `${product.thickness_mil} mil` : null],
    ['Fabric weight', pl?.weight_oz_per_sqyd ? `${Number(pl.weight_oz_per_sqyd)} oz / sq yd` : null],
    ['Weave count', pl?.weave_count ? `${pl.weave_count} per sq in` : null],
    ['Material', product.material ?? pl?.material],
    ['Color', product.color && product.color !== 'Standard' ? product.color : null],
    ['Grommets', pl?.grommet_type ? `${pl.grommet_type}${pl.grommet_spacing_inches ? `, every ${pl.grommet_spacing_inches}"` : ''}` : null],
    ['Corners', pl ? (pl.reinforced_corners ? 'Reinforced' : 'Standard') : null],
    ['Edges', pl ? (pl.sewn_in_rope ? 'Rope-reinforced hems' : 'Hemmed') : null],
    ['Fire rating', pl?.fire_retardant ? 'Fire retardant' : null],
  ]
  const pack: Array<[string, string | null]> = [
    ['Sold as', palletSku ? `1 pallet of ${product.pack_quantity ?? '?'} tarps` : acc && product.pack_quantity && product.pack_quantity > 1 ? `${product.pack_quantity}-pack` : 'Each'],
    ['Units per case', product.units_per_case ? String(product.units_per_case) : null],
    ['Units per half pallet', product.units_per_half_pallet ? String(product.units_per_half_pallet) : null],
    ['Units per full pallet', product.units_per_full_pallet ? String(product.units_per_full_pallet) : null],
    ['Volume pricing', quoteOnly ? 'By quote' : pallets.length ? `Wholesale accounts: ${pallets.map((x) => x.label).join(' / ')}` : tiers.length > 1 ? `${tiers.length} tiers, from ${tiers[1].min_quantity} units` : null],
  ]

  const features = [
    pl?.waterproof && 'Waterproof',
    pl?.uv_resistant && 'UV resistant',
    pl?.mildew_resistant && 'Mildew resistant',
    pl?.fire_retardant && 'Fire retardant',
    pl?.reinforced_corners && 'Reinforced corners',
    pl?.sewn_in_rope && 'Rope-reinforced hems',
  ].filter(Boolean) as string[]

  const images = product.image_urls ?? []
  const url = `${SITE_URL}/product/${product.slug}`
  const availability = product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/BackOrder'
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.xpose_sku,
    url,
    image: images.length ? images : undefined,
    description: seoDescription(product),
    brand: { '@type': 'Brand', name: 'MegaTarps' },
    category: acc ? 'Tarp accessories' : gradeLabel(product),
    color: product.color !== 'Standard' ? product.color : undefined,
    material: product.material ?? pl?.material,
    width: product.width_ft ? { '@type': 'QuantitativeValue', value: product.width_ft, unitCode: 'FOT' } : undefined,
    depth: product.length_ft ? { '@type': 'QuantitativeValue', value: product.length_ft, unitCode: 'FOT' } : undefined,
  }
  if (!quoteOnly && tiers.length) {
    const offerFor = (t: (typeof tiers)[number]) => ({
      '@type': 'Offer',
      price: (t.unit_price_cents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability,
      url,
      eligibleQuantity: { '@type': 'QuantitativeValue', minValue: t.min_quantity, ...(t.max_quantity ? { maxValue: t.max_quantity } : {}), unitCode: 'C62' },
      seller: { '@type': 'Organization', name: 'MegaTarps' },
    })
    jsonLd.offers = tiers.length === 1
      ? offerFor(tiers[0])
      : {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: (low / 100).toFixed(2),
          highPrice: (product.retail_price_cents / 100).toFixed(2),
          offerCount: tiers.length,
          availability,
          offers: tiers.map(offerFor),
        }
  }

  return (
    <div className="bg-white min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <div className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-orange-600 transition-colors">Home</Link>
            <span aria-hidden>/</span>
            <Link href="/products" className="hover:text-orange-600 transition-colors">Products</Link>
            {category && (
              <>
                <span aria-hidden>/</span>
                <Link href={`/products/${category}`} className="hover:text-orange-600 transition-colors">{CATEGORY_LABELS[category]}</Link>
              </>
            )}
            <span aria-hidden>/</span>
            <span className="text-slate-800 font-medium truncate max-w-[16rem] sm:max-w-md" aria-current="page">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 lg:gap-12 mb-14">
          {/* ─── Images ─── */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative shadow-sm ring-1 ring-slate-200">
              <ProductImage product={product} variant="hero" />
              {pl?.fire_retardant && (
                <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-red-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5" aria-hidden /> Fire retardant
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {images.slice(0, 5).map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt={`${product.name} — view ${i + 1}`} loading="lazy" className="w-16 h-16 rounded-xl object-cover ring-1 ring-slate-200" />
                ))}
              </div>
            )}
          </div>

          {/* ─── Buy box ─── */}
          <div>
            {pl?.name && <p className="text-orange-600 text-xs font-bold uppercase tracking-[0.14em] mb-2">{pl.name}</p>}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 leading-tight">{product.name}</h1>
            <p className="text-slate-400 text-sm mb-4">SKU {product.xpose_sku}</p>

            <div className="flex flex-wrap gap-2 mb-5">
              {[dimsLabel(product), product.coverage_sqft > 0 ? `${product.coverage_sqft.toLocaleString('en-US')} sq ft` : null, gaugeLabel(product), pl?.grommet_type ? `${pl.grommet_type} grommets` : null]
                .filter(Boolean)
                .map((c) => (
                  <span key={c} className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">{c}</span>
                ))}
            </div>

            {quoteOnly ? null : (
              <div className="mb-5">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-4xl font-black text-slate-900 tabular-nums">{formatPrice(product.retail_price_cents)}</span>
                  <span className="text-slate-500">{palletSku ? '/ pallet' : '/ unit'}</span>
                </div>
                {palletSku && product.pack_quantity ? (
                  <p className="text-sm text-slate-600 mt-1">
                    {product.pack_quantity} tarps · <strong>{formatPrice(Math.round(product.retail_price_cents / product.pack_quantity))}/tarp</strong>
                  </p>
                ) : null}
                {bestPallet && (
                  <p className="text-sm text-slate-600 mt-1">
                    Pallet of {bestPallet.units_per_pallet}: wholesale from <strong className="text-green-700">{formatPrice(bestPallet.unit_price_cents)}/ea</strong>
                    {!accountApproved && <> · <Link href="/apply" className="text-orange-600 font-semibold hover:underline">apply for an account</Link></>}
                  </p>
                )}
                {!bestPallet && lowTier && lowTier.min_quantity > 1 && (
                  <p className="text-sm text-slate-600 mt-1">
                    As low as <strong className="text-green-700">{formatPrice(low)}/ea</strong> when you buy {lowTier.min_quantity}+
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-5 xl:grid-cols-1">
              <TierPriceTable product={product} rules={rules} accountApproved={accountApproved} contractPrices={accountApproved ? account.contractPrices : undefined} />
              <div className="rounded-2xl ring-1 ring-slate-200 p-4 sm:p-5">
                <AddToCartOrRFQ product={product} rules={rules} />
              </div>
            </div>

            {features.length > 0 && (
              <ul className="flex flex-wrap gap-2 mt-5" aria-label="Features">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 bg-green-50 text-green-800 ring-1 ring-green-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" aria-hidden /> {f}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {[
                { icon: Truck, label: 'Kansas City based · Midwest freight' },
                { icon: Clock, label: 'Quotes within 1 business day' },
                { icon: ShieldCheck, label: 'Net terms for approved accounts' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1.5 bg-slate-50 rounded-xl p-3">
                  <Icon className="w-4 h-4 text-orange-500" aria-hidden />
                  <span className="text-[11px] font-medium text-slate-600 leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Details ─── */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] mb-14">
          <section aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="text-xl font-black text-slate-900 mb-3">Specifications</h2>
            {pl?.description && <p className="text-slate-600 mb-4 leading-relaxed text-sm">{pl.description}</p>}
            <dl className="rounded-2xl ring-1 ring-slate-200 overflow-hidden divide-y divide-slate-100">
              {specs.filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="grid grid-cols-[10rem_1fr] sm:grid-cols-[12rem_1fr] odd:bg-slate-50">
                  <dt className="py-2.5 px-4 text-sm font-semibold text-slate-600">{label}</dt>
                  <dd className="py-2.5 px-4 text-sm text-slate-900 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section aria-labelledby="pack-heading">
            <h2 id="pack-heading" className="text-xl font-black text-slate-900 mb-3">Pack &amp; pallet</h2>
            <dl className="rounded-2xl ring-1 ring-slate-200 overflow-hidden divide-y divide-slate-100">
              {pack.filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="grid grid-cols-[10rem_1fr] odd:bg-slate-50">
                  <dt className="py-2.5 px-4 text-sm font-semibold text-slate-600">{label}</dt>
                  <dd className="py-2.5 px-4 text-sm text-slate-900 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-slate-600 mt-4 leading-relaxed">
              Buying for a crew, a season or a whole yard? We quote mixed-SKU pallets and truckloads with freight to your jobsite.{' '}
              <Link href={`/bulk-quote?sku=${encodeURIComponent(product.xpose_sku)}`} className="text-orange-600 font-semibold hover:underline">
                Request a pallet quote →
              </Link>
            </p>
          </section>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-xl font-black text-slate-900 mb-5">More from this line</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {related.map((p) => <ProductCard key={p.id} product={p} rules={rules} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
