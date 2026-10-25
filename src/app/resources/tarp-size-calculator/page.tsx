import type { Metadata } from 'next'
import Link from 'next/link'
import { getProducts } from '@/lib/products'
import { isQuoteOnly } from '@/lib/pricing'
import { TarpSizeCalculator, type CalcProduct } from './TarpSizeCalculator'
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd'
import { CALCULATOR } from '../_content'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Tarp Size Calculator (With Overhang)',
  description:
    'Free tarp size calculator: enter the area or load, its height and the overhang you want, and get the right standard tarp size, allowing for finished size.',
  alternates: { canonical: CALCULATOR.path },
}

// Revalidate the product list hourly; the calculator itself runs in the browser.
export const revalidate = 3600

export default async function TarpSizeCalculatorPage() {
  let products: CalcProduct[] = []
  try {
    products = (await getProducts())
      .filter((p) => p.width_ft > 0 && p.length_ft > 0 && p.tarp_type !== 'accessory')
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        width: Math.min(p.width_ft, p.length_ft),
        length: Math.max(p.width_ft, p.length_ft),
        thickness: p.thickness_mil,
        quoteOnly: isQuoteOnly(p),
      }))
  } catch (e) {
    console.error('calculator: product load failed', e)
  }

  const appLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: CALCULATOR.title,
    url: `${SITE_URL}${CALCULATOR.path}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: CALCULATOR.description,
  }

  return (
    <div className="bg-white">
      <JsonLd
        data={[
          appLd,
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Resources', path: '/resources' },
            { name: CALCULATOR.title, path: CALCULATOR.path },
          ]),
        ]}
      />
      <header className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgb(249_115_22_/_0.14),_transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-400 mb-5">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li aria-hidden="true" className="text-slate-600">/</li>
              <li><Link href="/resources" className="hover:text-white">Resources</Link></li>
              <li aria-hidden="true" className="text-slate-600">/</li>
              <li className="text-slate-200" aria-current="page">Size calculator</li>
            </ol>
          </nav>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">{CALCULATOR.title}</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl">
            Enter what you are covering and how much overhang you need. We&apos;ll pick the smallest standard tarp whose{' '}
            <em>finished</em> size covers it.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <TarpSizeCalculator products={products} />

        <div className="mt-12 max-w-3xl text-slate-600 leading-relaxed space-y-3">
          <h2 className="text-xl font-black text-slate-900">How the calculator works</h2>
          <p>
            Required size is the footprint plus twice the height (the tarp drapes down both sides) plus twice the overhang
            and tie-down allowance. Tarps are sold by their cut size and finish a few percent smaller once hemmed, so the
            calculator compares your requirement against the approximate finished size of each standard tarp.
          </p>
          <p>
            For the full method and worked examples, read{' '}
            <Link href="/resources/how-to-size-a-tarp" className="font-semibold text-orange-700 underline">how to size a tarp</Link>
            , and pick a weight with{' '}
            <Link href="/resources/tarp-mil-thickness-explained" className="font-semibold text-orange-700 underline">mil thickness explained</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
