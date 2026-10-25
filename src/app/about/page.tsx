// REVIEW: Farshid must confirm the company description (importer, Kansas City metro,
// Midwest focus). Optionally add a short founder story where marked below.
import Link from 'next/link'
import type { Metadata } from 'next'
import { Ruler, Layers, PackageCheck, MapPin, ArrowRight } from 'lucide-react'
import { site } from '@/lib/site'
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  title: "About MegaTarps: The Contractor's Tarp Supplier",
  description:
    'MegaTarps is a Kansas City-area importer of heavy-duty tarps, selling by the case and pallet to contractors, roofers, farms and warehouses across the Midwest.',
  alternates: { canonical: '/about' },
}

const VALUES = [
  { icon: Ruler, title: 'The right size', desc: 'We list finished sizes honestly and built a calculator so you order the right size, not the nearest guess.' },
  { icon: Layers, title: 'The right mil', desc: 'Real thickness, weave and weight on every product, plus straight guidance on which weight each job needs.' },
  { icon: PackageCheck, title: 'By the pallet', desc: 'Case and pallet pricing, tax-exempt purchasing, and net terms for qualified accounts. Built for repeat orders.' },
  { icon: MapPin, title: 'Local and reachable', desc: `Based in the ${site.baseLocation}. Call or email and a person who knows tarps answers.` },
]

export default function AboutPage() {
  return (
    <div className="bg-white">
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }])} />
      <header className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgb(249_115_22_/_0.14),_transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-[0.18em] mb-3">About {site.name}</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">{site.tagline}.</h1>
          <p className="mt-5 text-xl text-slate-300 max-w-3xl leading-relaxed">{site.positioning}</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-3xl text-lg text-slate-700 leading-relaxed space-y-5 mb-14">
          <p>
            {site.name} is the tarp business of {site.legalName}, based in the {site.baseLocation}. We import heavy-duty
            tarps and sell them by the case and the pallet to contractors, roofers, farms and warehouses across the Midwest.
          </p>
          <p>
            Most tarps are sold like a commodity: a size, a color and a vague &quot;heavy duty&quot; label. That is how
            crews end up with tarps that tear at the grommets in the first storm, or a size that comes up a foot short. We
            do it differently: we tell you the real mil, weave and finished size, match the tarp to the job, and make
            volume buying simple.
          </p>
          {/* Optional: founder story (2–3 sentences) — Farshid to add if wanted. */}
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-14">
          {VALUES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl ring-1 ring-slate-200 p-6 flex gap-4">
              <div className="w-11 h-11 bg-orange-50 ring-1 ring-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-orange-500" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-black text-slate-900 mb-1">{title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-black text-slate-900 mb-5">What we carry</h2>
        <div className="rounded-2xl ring-1 ring-slate-200 overflow-hidden mb-14">
          {[
            ['5–7 mil poly', 'Light duty: painting, indoor dust cover, short-term cover.', '/products?thickness=5'],
            ['10 mil poly', 'Site cover, debris, material storage. The everyday contractor tarp.', '/products?thickness=10'],
            ['12 mil poly', 'Storm roof cover and scaffold wrap.', '/products?thickness=12'],
            ['16–20 mil poly', 'Long-term farm and equipment cover, winter enclosures.', '/products?thickness=16'],
            ['Fire-retardant', 'Enclosures near heaters and hot work.', '/products?type=fire-retardant'],
            ['Canvas, mesh & clear vinyl', 'Breathable cover, wind screens and daylight enclosures.', '/products?type=canvas'],
          ].map(([label, desc, href], i) => (
            <Link key={label} href={href} className={`group flex flex-col sm:flex-row gap-1 sm:gap-4 px-5 py-4 text-sm ${i % 2 ? 'bg-slate-50' : 'bg-white'} hover:bg-orange-50`}>
              <span className="font-bold text-slate-900 sm:w-52 flex-shrink-0 group-hover:text-orange-700">{label}</span>
              <span className="text-slate-600">{desc}</span>
            </Link>
          ))}
        </div>

        <div className="rounded-3xl bg-slate-950 p-8 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">Buying for a crew?</h2>
          <p className="text-slate-300 mb-6">Open a wholesale account for tier pricing, or browse by job.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply" className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              Open a wholesale account <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link href="/#shop-by-job" className="ring-1 ring-white/30 hover:ring-white text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Shop by job
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
