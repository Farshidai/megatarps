import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Shield, Truck, Clock, Award, CheckCircle, Phone, Star, Flame } from 'lucide-react'
import { getFeaturedProducts } from '@/lib/products'
import { ProductCard } from '@/components/products/ProductCard'

export default async function HomePage() {
  const featured = await getFeaturedProducts(8)

  return (
    <div>
      {/* ─── Hero ─── */}
      <section className="relative bg-slate-950 text-white min-h-[640px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-jobsite.png"
            alt="Heavy duty tarps on a commercial jobsite"
            fill
            priority
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgb(249_115_22_/_0.18),_transparent_55%)]" />
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/[0.07] backdrop-blur-sm ring-1 ring-white/15 rounded-full pl-1 pr-4 py-1 text-xs font-semibold mb-7">
              <span className="bg-orange-500 text-white text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full">New</span>
              <span className="text-slate-200">12-mil pallet drops — wholesale rates inside</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.98] tracking-tight mb-6">
              Heavy-Duty Tarps<br />
              <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-amber-300 bg-clip-text text-transparent">Built to Last.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300/90 mb-9 leading-relaxed max-w-xl">
              5-mil to 20-mil poly, canvas, mesh &amp; fire-retardant tarps.
              <span className="text-white font-semibold"> Retail prices online.</span> Bulk quotes within 4 hours.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Link
                href="/products"
                className="group/btn inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold text-base px-8 py-4 rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5"
              >
                Shop All Tarps
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/bulk-quote"
                className="inline-flex items-center justify-center gap-2 bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-sm ring-1 ring-white/20 hover:ring-white/35 text-white font-bold text-base px-8 py-4 rounded-xl transition-all"
              >
                Get Bulk Pricing
              </Link>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {[
                'Ships Nationwide',
                'Bulk Quote in 4 Hours',
                '5-Mil to 20-Mil',
                'Brass Grommets',
              ].map((text) => (
                <div key={text} className="flex items-center gap-1.5 bg-white/[0.06] backdrop-blur-sm ring-1 ring-white/10 rounded-full px-3 py-1.5 text-[13px] text-slate-300">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </section>

      {/* ─── Category Cards ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold text-orange-600 uppercase tracking-[0.18em] mb-2">Categories</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Shop by Application</h2>
              <p className="text-slate-500 mt-2">Built for the job. Sized for the truck.</p>
            </div>
            <Link href="/products" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                href: '/products/construction-roofing',
                title: 'Construction & Roofing',
                desc: 'Emergency roof cover, scaffold protection',
                img: '/images/category-construction.png',
              },
              {
                href: '/products/agriculture-farming',
                title: 'Agriculture & Farming',
                desc: 'Hay cover, grain storage, equipment',
                img: '/images/category-agriculture.png',
              },
              {
                href: '/products/industrial-warehouse',
                title: 'Industrial & Warehouse',
                desc: 'Equipment covers, pallet protection',
                img: '/images/category-industrial.png',
              },
              {
                href: '/products/general-purpose',
                title: 'General Purpose',
                desc: 'Camping, painting, temporary cover',
                img: '/images/category-general.png',
              },
            ].map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-md hover:shadow-2xl transition-all duration-500 ring-1 ring-slate-900/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-orange-900/0 via-transparent to-transparent group-hover:from-orange-900/40 transition-colors duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <h3 className="font-black text-base sm:text-lg leading-tight tracking-tight mb-1">{cat.title}</h3>
                  <p className="text-xs text-white/70 leading-relaxed mb-3 hidden sm:block">{cat.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-orange-300 text-xs font-bold uppercase tracking-wider group-hover:gap-2.5 transition-all">
                    Shop now <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Thickness Strip ─── */}
      <section className="relative bg-slate-950 py-14 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgb(249_115_22_/_0.08),_transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold text-orange-400 uppercase tracking-[0.18em] mb-2">Thickness</p>
              <h2 className="text-white font-black text-2xl sm:text-3xl tracking-tight">Pick your weight class</h2>
            </div>
            <Link href="/resources#mil-thickness" className="text-orange-400 text-sm font-semibold hover:text-orange-300 transition-colors whitespace-nowrap">
              What is mil? →
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {[
              { mil: 5, label: '5-Mil', sub: 'Multipurpose', href: '/products?thickness=5' },
              { mil: 10, label: '10-Mil', sub: 'Heavy Duty', href: '/products?thickness=10' },
              { mil: 12, label: '12-Mil', sub: 'Extra Heavy', href: '/products?thickness=12' },
              { mil: 16, label: '16-Mil', sub: 'Super Heavy', href: '/products?thickness=16', popular: true },
              { mil: 20, label: '20-Mil', sub: 'Ultra Heavy', href: '/products?thickness=20' },
            ].map((t) => (
              <Link
                key={t.mil}
                href={t.href}
                className={`group/mil relative rounded-2xl p-5 text-center transition-all hover:-translate-y-1 ${
                  t.popular
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-xl shadow-orange-500/30 ring-1 ring-orange-300/40'
                    : 'bg-slate-900/80 ring-1 ring-white/5 hover:ring-white/15 hover:bg-slate-800'
                }`}
              >
                {t.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap shadow-md">
                    Best Seller
                  </span>
                )}
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">{t.label}</div>
                <div className={`text-[11px] mt-1 font-semibold uppercase tracking-wider ${t.popular ? 'text-orange-100' : 'text-slate-500 group-hover/mil:text-slate-400'}`}>
                  {t.sub}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Products ─── */}
      {featured.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10 gap-4">
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-[0.18em] mb-2">Bestsellers</p>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Popular Products</h2>
                <p className="text-slate-500 mt-2">Contractor favorites — in stock &amp; ready to ship.</p>
              </div>
              <Link
                href="/products"
                className="group/link inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-orange-600 bg-white ring-1 ring-slate-200 hover:ring-orange-300 px-4 py-2.5 rounded-xl transition-all"
              >
                View all <ArrowRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ─── Social Proof ─── */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-50 ring-1 ring-amber-200/60 rounded-full px-4 py-1.5 mb-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <span className="text-amber-900 text-xs font-bold">4.9 / 5</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Trusted by 200+ contractors</h2>
            <p className="text-slate-500 mt-2 max-w-md">From the first reorder to the fifth — they keep coming back.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { text: 'These tarps held up through an entire roofing season. The grommets didn’t budge. We’ve reordered three times.', name: 'Mike T.', role: 'Roofing Contractor, TX', initials: 'MT' },
              { text: 'Bulk pricing saved us 30% vs. the hardware store. Fast quote response — had pricing same day.', name: 'Sarah L.', role: 'Farm Manager, IA', initials: 'SL' },
              { text: 'The 16-mil tarp covered our entire construction site. Lasted two winters with zero tearing.', name: 'James R.', role: 'General Contractor, OH', initials: 'JR' },
            ].map((review) => (
              <figure key={review.name} className="relative bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 ring-1 ring-slate-200/70 hover:ring-orange-200 hover:shadow-lg transition-all">
                <div className="absolute -top-2 left-6 text-orange-500/20 text-7xl font-serif leading-none select-none">&ldquo;</div>
                <div className="relative">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <blockquote className="text-slate-700 text-[15px] leading-relaxed mb-5">{review.text}</blockquote>
                  <figcaption className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-sm font-black flex items-center justify-center">
                      {review.initials}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{review.name}</p>
                      <p className="text-slate-500 text-xs">{review.role}</p>
                    </div>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trust Signals ─── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {[
              { icon: <Truck className="w-6 h-6 text-orange-500" />, title: 'Ships Nationwide', desc: 'Direct delivery to your jobsite, farm, or warehouse. Pallet orders welcome.' },
              { icon: <Clock className="w-6 h-6 text-orange-500" />, title: '4-Hour Quote Response', desc: 'Bulk quote requests answered within 4 business hours, Mon–Fri.' },
              { icon: <Shield className="w-6 h-6 text-orange-500" />, title: 'Genuine Quality', desc: '100% genuine heavy-duty tarps, inspected and guaranteed.' },
              { icon: <Award className="w-6 h-6 text-orange-500" />, title: 'Premium Build Quality', desc: 'Brass grommets, UV-treated poly, reinforced corners — made to last.' },
            ].map((t) => (
              <div key={t.title} className="group/trust flex flex-col items-start gap-3 p-5 rounded-2xl ring-1 ring-slate-100 hover:ring-orange-200 hover:bg-orange-50/30 transition-all">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-2.5 rounded-xl ring-1 ring-orange-100 group-hover/trust:scale-110 transition-transform">{t.icon}</div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1 text-sm sm:text-base">{t.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Two-column promo ─── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Bulk pricing CTA */}
          <div className="group/promo relative rounded-3xl overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-8 lg:p-10 text-white min-h-[280px]">
            <div className="absolute inset-0 opacity-25 group-hover/promo:opacity-30 transition-opacity">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/bulk-cta.png" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-700/80 via-orange-600/40 to-transparent" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
            <div className="relative h-full flex flex-col">
              <p className="inline-flex w-fit items-center gap-1.5 bg-white/15 backdrop-blur-sm ring-1 ring-white/20 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4">
                Buying 5+ units?
              </p>
              <h3 className="text-3xl lg:text-4xl font-black mb-3 tracking-tight">Get Wholesale Pricing</h3>
              <p className="text-orange-50/90 text-sm lg:text-base mb-6 leading-relaxed max-w-md">
                Contractors, roofers &amp; farmers get wholesale rates. Quoted within 4 business hours.
              </p>
              <Link
                href="/bulk-quote"
                className="mt-auto inline-flex w-fit items-center gap-2 bg-white text-orange-600 font-black px-6 py-3 rounded-xl hover:bg-orange-50 hover:gap-3 transition-all text-sm shadow-lg shadow-orange-900/20"
              >
                Request Bulk Quote <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Fire retardant */}
          <div className="group/promo relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black p-8 lg:p-10 text-white min-h-[280px] ring-1 ring-white/5">
            <div className="absolute right-0 top-0 w-48 h-48 bg-red-500/20 rounded-full -translate-y-12 translate-x-12 blur-2xl" />
            <div className="absolute right-10 bottom-0 w-32 h-32 bg-red-600/15 rounded-full translate-y-10 blur-xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgb(220_38_38_/_0.15),_transparent_50%)]" />
            <div className="relative h-full flex flex-col">
              <div className="inline-flex w-fit items-center gap-1.5 bg-red-600/20 ring-1 ring-red-500/40 text-red-200 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4">
                <Flame className="w-3 h-3" /> NFPA 701 Compliant
              </div>
              <h3 className="text-3xl lg:text-4xl font-black mb-3 tracking-tight">Fire Retardant Tarps</h3>
              <p className="text-slate-400 text-sm lg:text-base mb-6 leading-relaxed max-w-md">
                Self-extinguishing tarps for construction sites, events &amp; rental yards.
              </p>
              <Link
                href="/products?type=fire-retardant"
                className="mt-auto inline-flex w-fit items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black px-6 py-3 rounded-xl hover:gap-3 transition-all text-sm shadow-lg shadow-red-600/30"
              >
                Shop Fire Retardant <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative bg-slate-950 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgb(249_115_22_/_0.12),_transparent_60%)]" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 tracking-tight">
            Ready to <span className="bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent">order?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Shop retail online or request a bulk quote. Either way, we ship fast.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/products"
              className="group/cta inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black text-base px-8 py-4 rounded-xl transition-all shadow-xl shadow-orange-500/40 hover:shadow-orange-500/60 hover:-translate-y-0.5"
            >
              Shop All Products <ArrowRight className="w-5 h-5 group-hover/cta:translate-x-1 transition-transform" />
            </Link>
            <a
              href="tel:+19133132691"
              className="inline-flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-sm text-white font-bold text-base px-8 py-4 rounded-xl transition-all ring-1 ring-white/15 hover:ring-white/30"
            >
              <Phone className="w-5 h-5" /> (913) 313-2691
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
