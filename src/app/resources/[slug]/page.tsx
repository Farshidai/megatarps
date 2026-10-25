import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowRight, Calculator, Clock, ShoppingBag } from 'lucide-react'
import { ARTICLES, getArticle, CALCULATOR } from '../_content'
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd'
import { site, SITE_URL } from '@/lib/site'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const a = getArticle(slug)
  if (!a) return {}
  const path = `/resources/${a.slug}`
  return {
    title: a.metaTitle ?? a.title,
    description: a.description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      url: path,
      title: a.title,
      description: a.description,
      publishedTime: a.published,
      modifiedTime: a.updated,
      section: a.topic,
    },
    twitter: { card: 'summary_large_image', title: a.title, description: a.description },
  }
}

const fmtDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params
  const a = getArticle(slug)
  if (!a) notFound()
  const path = `/resources/${a.slug}`
  const related = a.related.map(getArticle).filter((x): x is NonNullable<typeof x> => Boolean(x))

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    datePublished: a.published,
    dateModified: a.updated,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${path}` },
    image: [`${SITE_URL}${path}/opengraph-image`],
    articleSection: a.topic,
    inLanguage: 'en-US',
    author: { '@type': 'Organization', name: site.name, url: SITE_URL },
    publisher: { '@id': `${SITE_URL}/#organization` },
  }

  return (
    <div className="bg-white">
      <JsonLd
        data={[
          articleLd,
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Resources', path: '/resources' },
            { name: a.title, path },
          ]),
        ]}
      />

      {/* Header */}
      <header className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgb(249_115_22_/_0.14),_transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-400 mb-6">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li aria-hidden="true" className="text-slate-600">/</li>
              <li><Link href="/resources" className="hover:text-white">Resources</Link></li>
              <li aria-hidden="true" className="text-slate-600">/</li>
              <li className="text-slate-200" aria-current="page">{a.topic}</li>
            </ol>
          </nav>
          <p className="text-xs font-bold text-orange-400 uppercase tracking-[0.18em] mb-3">{a.topic} guide</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08] max-w-4xl">{a.title}</h1>
          <p className="mt-5 text-lg text-slate-300 max-w-3xl leading-relaxed">{a.excerpt}</p>
          <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
            <span>By the {site.name} team</span>
            <span aria-hidden="true">·</span>
            <span>Updated <time dateTime={a.updated}>{fmtDate(a.updated)}</time></span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden="true" /> {a.readingMinutes} min read</span>
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 grid lg:grid-cols-[minmax(0,1fr)_300px] gap-10 lg:gap-14">
        <article className="min-w-0 max-w-3xl">
          {/* Mobile TOC */}
          <details className="lg:hidden mb-8 rounded-xl ring-1 ring-slate-200 p-4">
            <summary className="font-bold text-slate-900 cursor-pointer">In this guide</summary>
            <ul className="mt-3 space-y-2 text-sm">
              {a.toc.map((t) => (
                <li key={t.id}><a href={`#${t.id}`} className="text-slate-700 hover:text-orange-600">{t.label}</a></li>
              ))}
            </ul>
          </details>

          {a.body()}

          {/* End-of-article CTA */}
          <div className="mt-12 rounded-2xl bg-slate-950 text-white p-6 sm:p-8">
            <p className="text-xs font-bold text-orange-400 uppercase tracking-[0.18em] mb-2">Buying for a crew?</p>
            <p className="text-2xl font-black tracking-tight mb-2">Case and pallet pricing for contractors</p>
            <p className="text-slate-300 mb-6 max-w-xl">
              Open a wholesale account for tier pricing, tax-exempt purchasing and net terms for qualified buyers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/apply" className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
                Open a wholesale account <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link href="/bulk-quote" className="inline-flex items-center justify-center gap-2 ring-1 ring-white/25 hover:ring-white/50 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                Request a pallet quote
              </Link>
            </div>
          </div>
        </article>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="In this guide" className="hidden lg:block rounded-2xl ring-1 ring-slate-200 p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">In this guide</p>
            <ul className="space-y-2 text-sm">
              {a.toc.map((t) => (
                <li key={t.id}><a href={`#${t.id}`} className="text-slate-700 hover:text-orange-600">{t.label}</a></li>
              ))}
            </ul>
          </nav>

          <div className="rounded-2xl bg-orange-50 ring-1 ring-orange-200 p-5">
            <p className="flex items-center gap-2 text-sm font-black text-orange-900 mb-3">
              <ShoppingBag className="w-4 h-4" aria-hidden="true" /> Shop for this job
            </p>
            <ul className="space-y-3">
              {a.shop.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="group block">
                    <span className="font-bold text-slate-900 group-hover:text-orange-700 text-sm inline-flex items-center gap-1">
                      {s.label} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                    {s.note && <span className="block text-xs text-slate-600">{s.note}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <Link href={CALCULATOR.path} className="flex gap-3 items-start rounded-2xl ring-1 ring-slate-200 hover:ring-orange-300 p-5 transition-colors">
            <Calculator className="w-5 h-5 text-orange-500 mt-0.5" aria-hidden="true" />
            <span>
              <span className="block font-bold text-slate-900 text-sm">{CALCULATOR.title}</span>
              <span className="block text-xs text-slate-600">Get the right standard size, allowing for finished size.</span>
            </span>
          </Link>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="bg-slate-50 border-t border-slate-100 py-14" aria-labelledby="related-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="related-heading" className="text-2xl font-black text-slate-900 tracking-tight mb-6">Related guides</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {related.map((r) => (
                <Link key={r.slug} href={`/resources/${r.slug}`} className="group rounded-2xl bg-white ring-1 ring-slate-200 hover:ring-orange-300 hover:shadow-lg p-5 transition-all">
                  <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wider mb-2">{r.topic}</p>
                  <p className="font-bold text-slate-900 group-hover:text-orange-700 leading-snug">{r.title}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
