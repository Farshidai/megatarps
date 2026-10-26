import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import {
  ArrowRight, CheckCircle, Phone, Flame, Lock, FileCheck, Handshake, MapPin,
  ClipboardCheck, Tags, PackageCheck, Truck, Calculator, BookOpen,
} from 'lucide-react'
import { getFeaturedProducts } from '@/lib/products'
import { ProductCard } from '@/components/products/ProductCard'
import { NewsletterSignup } from '@/components/seo/NewsletterSignup'
import { ARTICLES, CALCULATOR } from './resources/_content'
import { JOBS, site, telHref } from '@/lib/site'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

const TRUST = [
  { icon: Lock, title: 'Secure Stripe checkout', desc: 'Card payments are processed by Stripe. We never see or store card numbers.' },
  { icon: FileCheck, title: 'Tax-exempt purchasing', desc: 'Put your resale or exemption certificate on file and order tax-free.' },
  { icon: Handshake, title: 'Net terms for qualified buyers', desc: 'Approved wholesale accounts can pay on invoice terms.' },
  { icon: MapPin, title: 'Kansas City based', desc: 'A local supplier for the Midwest, not an anonymous marketplace seller.' },
]

const STEPS = [
  { icon: ClipboardCheck, title: 'Apply', desc: 'One short form with your business and tax details.' },
  { icon: Tags, title: 'Get tier pricing', desc: 'Your account pricing shows on every product once approved.' },
  { icon: PackageCheck, title: 'Order by case or pallet', desc: 'Buy online, or request a quote for full pallets and mixed loads.' },
  { icon: Truck, title: 'LTL delivery', desc: 'Freight to your yard, warehouse or jobsite across the Midwest.' },
]

export default async function HomePage() {
  const featured = await getFeaturedProducts(8)
  const guides = ARTICLES.slice(0, 3)

  return (
    <div>
      {/* ─── Hero ─── */}
      <section className="relative bg-slate-950 text-white flex items-center overflow-hidden lg:min-h-[600px]">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-jobsite.webp"
            alt=""
            fill
            preload
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgb(249_115_22_/_0.18),_transparent_55%)]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 w-full">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 bg-white/[0.07] ring-1 ring-white/15 rounded-full px-4 py-1.5 text-xs font-semibold mb-6 text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" aria-hidden="true" />
              {site.tagline} · {site.baseLocation}
            </p>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1] tracking-tight mb-6">
              Wholesale heavy-duty tarps.
              <span className="block mt-3 text-2xl sm:text-4xl lg:text-[2.75rem] leading-tight bg-gradient-to-r from-orange-300 via-orange-400 to-amber-300 bg-clip-text text-transparent">
                Case &amp; pallet pricing. Midwest freight.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl">
              5 to 20 mil poly, canvas, mesh, clear vinyl and fire-retardant tarps for contractors, roofers, farms and
              warehouses. <span className="text-white font-semibold">The right mil, the right size, by the pallet.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                href="#shop-by-job"
                className="group/btn inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold text-base px-8 py-4 rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300"
              >
                Shop by job
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>
              <Link
                href="/apply"
                className="inline-flex items-center justify-center gap-2 bg-white/[0.08] hover:bg-white/[0.14] ring-1 ring-white/25 hover:ring-white/40 text-white font-bold text-base px-8 py-4 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
              >
                Open a wholesale account
              </Link>
            </div>

            <ul className="flex flex-wrap gap-2.5" aria-label="Wholesale benefits">
              {['Case & pallet pricing', 'Tax-exempt purchasing', 'Net terms for qualified buyers', 'LTL freight'].map((text) => (
                <li key={text} className="flex items-center gap-1.5 bg-white/[0.06] ring-1 ring-white/10 rounded-full px-3 py-1.5 text-[13px] text-slate-300">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Trust badges (factual only) ─── */}
      <section aria-label="Why buy from MegaTarps" className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TRUST.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="bg-orange-50 ring-1 ring-orange-100 p-2.5 rounded-xl flex-shrink-0">
                  <Icon className="w-5 h-5 text-orange-500" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-bold text-slate-900 text-sm">{title}</span>
                  <span className="block text-sm text-slate-500 leading-snug">{desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── Shop by job ─── */}
      <section id="shop-by-job" className="py-16 lg:py-20 bg-white scroll-mt-20" aria-labelledby="shop-by-job-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-xs font-bold text-orange-600 uppercase tracking-[0.18em] mb-2">Shop by job</p>
              <h2 id="shop-by-job-heading" className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">What are you covering?</h2>
              <p className="text-slate-500 mt-2">Each job gets the right weight, material and edge construction.</p>
            </div>
            <Link href="/products" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors">
              All tarps <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {JOBS.map((job, i) => (
              <Link
                key={job.slug}
                href={`/products?job=${job.slug}`}
                className={`group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-md hover:shadow-2xl transition-all duration-500 ring-1 ring-slate-900/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-400 ${i === JOBS.length - 1 ? 'col-span-2 md:col-span-1 aspect-[8/5] md:aspect-[4/5]' : ''}`}
              >
                <Image
                  src={job.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/10" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-white">
                  <h3 className="font-black text-lg sm:text-xl leading-tight tracking-tight mb-1">{job.label}</h3>
                  <p className="text-xs text-white/75 leading-relaxed mb-3">{job.blurb}</p>
                  <span className="inline-flex items-center gap-1.5 text-orange-300 text-xs font-bold uppercase tracking-wider group-hover:gap-2.5 transition-all">
                    Shop {job.label.toLowerCase()} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How wholesale works ─── */}
      <section className="relative bg-slate-950 py-16 overflow-hidden" aria-labelledby="how-heading">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgb(249_115_22_/_0.08),_transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold text-orange-400 uppercase tracking-[0.18em] mb-2">How wholesale works</p>
              <h2 id="how-heading" className="text-white font-black text-3xl sm:text-4xl tracking-tight">From application to pallet on your dock</h2>
            </div>
            <Link href="/apply" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors w-fit">
              Open a wholesale account <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <li key={title} className="relative rounded-2xl bg-slate-900/80 ring-1 ring-white/10 p-6">
                <span className="absolute top-5 right-5 text-5xl font-black text-white/[0.06] leading-none" aria-hidden="true">{i + 1}</span>
                <Icon className="w-7 h-7 text-orange-400 mb-4" aria-hidden="true" />
                <p className="text-white font-bold text-lg">
                  <span className="sr-only">Step {i + 1}: </span>{title}
                </p>
                <p className="text-slate-400 text-sm mt-1 leading-relaxed">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── Thickness strip ─── */}
      <section className="py-14 bg-white" aria-labelledby="mil-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold text-orange-600 uppercase tracking-[0.18em] mb-2">Thickness</p>
              <h2 id="mil-heading" className="text-slate-900 font-black text-2xl sm:text-3xl tracking-tight">Pick your weight class</h2>
            </div>
            <Link href="/resources/tarp-mil-thickness-explained" className="text-orange-600 text-sm font-semibold hover:text-orange-500 transition-colors whitespace-nowrap">
              Which mil do I need? →
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {[
              { mil: 5, label: '5 mil', sub: 'Light / indoor' },
              { mil: 10, label: '10 mil', sub: 'Site & storage' },
              { mil: 12, label: '12 mil', sub: 'Roofing' },
              { mil: 16, label: '16 mil', sub: 'Long-term outdoor' },
              { mil: 20, label: '20 mil', sub: 'Semi-permanent' },
            ].map((t) => (
              <Link
                key={t.mil}
                href={`/products?thickness=${t.mil}`}
                className="group/mil rounded-2xl p-5 text-center transition-all hover:-translate-y-1 bg-slate-50 ring-1 ring-slate-200 hover:ring-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{t.label}</div>
                <div className="text-[11px] mt-1 font-semibold uppercase tracking-wider text-slate-500 group-hover/mil:text-orange-700">{t.sub}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured products ─── */}
      {featured.length > 0 && (
        <section className="py-16 lg:py-20 bg-gradient-to-b from-slate-50 to-white" aria-labelledby="featured-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10 gap-4">
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-[0.18em] mb-2">{featured.every((p) => p.in_stock) ? 'In stock · priced online' : 'Priced online'}</p>
                <h2 id="featured-heading" className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Contractor staples</h2>
                <p className="text-slate-500 mt-2">Heavy-duty sizes crews reorder by the case.</p>
              </div>
              <Link
                href="/products"
                className="group/link inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-orange-600 bg-white ring-1 ring-slate-200 hover:ring-orange-300 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
              >
                View all <ArrowRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ─── Guides (educational authority) ─── */}
      <section className="py-16 lg:py-20 bg-white border-t border-slate-100" aria-labelledby="guides-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-xs font-bold text-orange-600 uppercase tracking-[0.18em] mb-2">Guides</p>
              <h2 id="guides-heading" className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Buy the right tarp the first time</h2>
            </div>
            <Link href="/resources" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-orange-600">
              All guides <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid md:grid-cols-4 gap-5">
            <Link
              href={CALCULATOR.path}
              className="group flex flex-col rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 shadow-lg shadow-orange-500/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300"
            >
              <Calculator className="w-8 h-8 mb-4" aria-hidden="true" />
              <p className="text-xl font-black tracking-tight">{CALCULATOR.title}</p>
              <p className="text-orange-50/90 text-sm mt-2 flex-1">Area, height and overhang in. Right standard size out.</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold group-hover:gap-2.5 transition-all">
                Size my tarp <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </span>
            </Link>
            {guides.map((g) => (
              <Link
                key={g.slug}
                href={`/resources/${g.slug}`}
                className="group flex flex-col rounded-2xl ring-1 ring-slate-200 hover:ring-orange-300 hover:shadow-lg p-6 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <BookOpen className="w-6 h-6 text-orange-500 mb-4" aria-hidden="true" />
                <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wider mb-1">{g.topic}</p>
                <p className="font-black text-slate-900 leading-snug group-hover:text-orange-700 flex-1">{g.title}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 group-hover:text-orange-600">
                  Read guide <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Two-column promo ─── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="group/promo relative rounded-3xl overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-8 lg:p-10 text-white min-h-[280px]">
            <div className="absolute inset-0 opacity-25">
              <Image src="/images/pallet-30x40.jpg" alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-700/80 via-orange-600/40 to-transparent" />
            <div className="relative h-full flex flex-col">
              <p className="inline-flex w-fit items-center gap-1.5 bg-white/15 ring-1 ring-white/20 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4">
                Full pallets &amp; mixed loads
              </p>
              <h2 className="text-3xl lg:text-4xl font-black mb-3 tracking-tight">Get a pallet quote</h2>
              <p className="text-orange-50/90 text-sm lg:text-base mb-6 leading-relaxed max-w-md">
                Tell us the sizes, weights and delivery ZIP. We&apos;ll price the tarps and the freight together. {site.responseTime}
              </p>
              <Link
                href="/bulk-quote"
                className="mt-auto inline-flex w-fit items-center gap-2 bg-white text-orange-600 font-black px-6 py-3 rounded-xl hover:bg-orange-50 hover:gap-3 transition-all text-sm shadow-lg shadow-orange-900/20"
              >
                Request a quote <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black p-8 lg:p-10 text-white min-h-[280px] ring-1 ring-white/5">
            <div className="absolute right-0 top-0 w-48 h-48 bg-red-500/20 rounded-full -translate-y-12 translate-x-12 blur-2xl" />
            <div className="relative h-full flex flex-col">
              <div className="inline-flex w-fit items-center gap-1.5 bg-red-600/20 ring-1 ring-red-500/40 text-red-200 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4">
                <Flame className="w-3 h-3" aria-hidden="true" /> Scaffolding &amp; heated enclosures
              </div>
              <h2 className="text-3xl lg:text-4xl font-black mb-3 tracking-tight">Fire-retardant tarps</h2>
              <p className="text-slate-400 text-sm lg:text-base mb-6 leading-relaxed max-w-md">
                Flame-retardant tarps for enclosures near heaters and hot work. Ask us for the test documentation your
                inspector needs.
              </p>
              <Link
                href="/products?type=fire-retardant"
                className="mt-auto inline-flex w-fit items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black px-6 py-3 rounded-xl hover:gap-3 transition-all text-sm shadow-lg shadow-red-600/30"
              >
                Shop fire-retardant <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Email capture ─── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <NewsletterSignup source="homepage" />
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative bg-slate-950 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgb(249_115_22_/_0.12),_transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 tracking-tight">
            Buying tarps for a crew? <span className="bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent">Set up wholesale.</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            One short application for tier pricing, tax-exempt purchasing and net terms for qualified buyers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/apply"
              className="group/cta inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black text-base px-8 py-4 rounded-xl transition-all shadow-xl shadow-orange-500/40 hover:-translate-y-0.5"
            >
              Open a wholesale account <ArrowRight className="w-5 h-5 group-hover/cta:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
            <a
              href={telHref()}
              className="inline-flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.12] text-white font-bold text-base px-8 py-4 rounded-xl transition-all ring-1 ring-white/15 hover:ring-white/30"
            >
              <Phone className="w-5 h-5" aria-hidden="true" /> {site.phoneDisplay}
            </a>
          </div>
          <p className="text-slate-500 text-sm mt-6">{site.hours}</p>
        </div>
      </section>
    </div>
  )
}
