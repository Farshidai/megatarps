import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Calculator, Clock } from 'lucide-react'
import { ARTICLES, CALCULATOR } from './_content'
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd'
import { SITE_URL } from '@/lib/site'
import { NewsletterSignup } from '@/components/seo/NewsletterSignup'

export const metadata: Metadata = {
  title: 'Tarp Guides & Resources for Contractors',
  description:
    'Practical tarp guides for contractors, roofers and farms: mil thickness, sizing with overhang, poly vs canvas vs vinyl, storm roof tarps, cold-weather concrete and wholesale freight.',
  alternates: { canonical: '/resources' },
}

export default function ResourcesPage() {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'MegaTarps resource guides',
    itemListElement: [
      ...ARTICLES.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/resources/${a.slug}`, name: a.title })),
      { '@type': 'ListItem', position: ARTICLES.length + 1, url: `${SITE_URL}${CALCULATOR.path}`, name: CALCULATOR.title },
    ],
  }

  return (
    <div className="bg-white">
      <JsonLd data={[itemList, breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Resources', path: '/resources' }])]} />

      <header className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgb(249_115_22_/_0.14),_transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-[0.18em] mb-3">Resources</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight max-w-3xl leading-[1.05]">
            Tarp guides written for the jobsite
          </h1>
          <p className="mt-5 text-lg text-slate-300 max-w-2xl leading-relaxed">
            The right mil, the right size, the right material. Straight answers for contractors, roofers, farms and
            warehouse buyers, with no fluff.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Calculator feature */}
        <Link
          href={CALCULATOR.path}
          className="group flex flex-col sm:flex-row sm:items-center gap-5 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 sm:p-8 mb-12 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/15 ring-1 ring-white/30 flex items-center justify-center flex-shrink-0">
            <Calculator className="w-7 h-7" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-black tracking-tight">{CALCULATOR.title}</p>
            <p className="text-orange-50/90 mt-1">{CALCULATOR.description}</p>
          </div>
          <span className="inline-flex items-center gap-2 bg-white text-orange-600 font-black px-5 py-3 rounded-xl text-sm whitespace-nowrap group-hover:gap-3 transition-all w-fit">
            Size my tarp <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </span>
        </Link>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-6">Guides</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ARTICLES.map((a) => (
            <Link
              key={a.slug}
              href={`/resources/${a.slug}`}
              className="group flex flex-col rounded-2xl ring-1 ring-slate-200 hover:ring-orange-300 hover:shadow-xl p-6 transition-all bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wider mb-3">{a.topic}</p>
              <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-orange-700 mb-3">{a.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-5 flex-1">{a.excerpt}</p>
              <span className="flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden="true" /> {a.readingMinutes} min read</span>
                <span className="inline-flex items-center gap-1 font-bold text-slate-700 group-hover:text-orange-600">
                  Read guide <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-14">
          <NewsletterSignup source="resources" />
        </div>
      </div>
    </div>
  )
}
