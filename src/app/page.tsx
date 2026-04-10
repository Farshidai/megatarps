import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Shield, Truck, Clock, Award, CheckCircle, Phone, Star } from 'lucide-react'
import { getFeaturedProducts } from '@/lib/products'
import { ProductCard } from '@/components/products/ProductCard'

export default async function HomePage() {
  const featured = await getFeaturedProducts(8)

  return (
    <div>
      {/* ─── Hero ─── */}
      <section className="relative bg-slate-900 text-white min-h-[580px] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-jobsite.png"
            alt="Heavy duty tarps on a commercial jobsite"
            fill
            priority
            className="object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 rounded-full px-4 py-1.5 text-orange-300 text-sm font-semibold mb-6">
              <Shield className="w-4 h-4" />
              Authorized Xpose Safety Distributor
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] mb-5">
              Heavy-Duty Tarps<br />
              <span className="text-orange-400">Built to Last</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed">
              5-mil to 20-mil poly, canvas, mesh & fire-retardant tarps.
              Retail prices online. Bulk quotes in 4 hours.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base px-8 py-4 rounded-xl transition-colors shadow-lg shadow-orange-500/30"
              >
                Shop All Tarps <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/bulk-quote"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-base px-8 py-4 rounded-xl transition-colors"
              >
                Get Bulk Pricing
              </Link>
            </div>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: <CheckCircle className="w-4 h-4 text-green-400" />, text: 'Ships Nationwide' },
                { icon: <CheckCircle className="w-4 h-4 text-green-400" />, text: 'Bulk Quote in 4 Hours' },
                { icon: <CheckCircle className="w-4 h-4 text-green-400" />, text: '5-Mil to 20-Mil' },
                { icon: <CheckCircle className="w-4 h-4 text-green-400" />, text: 'Brass Grommets' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 text-sm text-slate-300">
                  {icon} {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Category Cards ─── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Shop by Application</h2>
            <p className="text-slate-500 mt-1">Find the right tarp for your job</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                href: '/products/construction-roofing',
                title: 'Construction & Roofing',
                desc: 'Emergency roof cover, scaffold protection',
                img: '/images/category-construction.png',
                color: 'from-blue-900/70',
              },
              {
                href: '/products/agriculture-farming',
                title: 'Agriculture & Farming',
                desc: 'Hay cover, grain storage, equipment',
                img: '/images/category-agriculture.png',
                color: 'from-green-900/70',
              },
              {
                href: '/products/industrial-warehouse',
                title: 'Industrial & Warehouse',
                desc: 'Equipment covers, pallet protection',
                img: '/images/category-industrial.png',
                color: 'from-slate-900/70',
              },
              {
                href: '/products/general-purpose',
                title: 'General Purpose',
                desc: 'Camping, painting, temporary cover',
                img: '/images/category-general.png',
                color: 'from-orange-900/70',
              },
            ].map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] shadow-md hover:shadow-xl transition-shadow"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} to-transparent`} />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-bold text-sm sm:text-base leading-snug">{cat.title}</h3>
                  <p className="text-xs text-white/75 mt-0.5 hidden sm:block">{cat.desc}</p>
                  <span className="inline-flex items-center gap-1 text-orange-300 text-xs font-semibold mt-1 group-hover:gap-2 transition-all">
                    Shop now <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Thickness Strip ─── */}
      <section className="bg-slate-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-white font-black text-lg sm:text-xl">Shop by Thickness</h2>
            <Link href="/resources" className="text-orange-400 text-sm hover:text-orange-300 transition-colors">
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
                className={`relative rounded-xl p-4 text-center transition-all hover:scale-105 ${
                  t.popular
                    ? 'bg-orange-500 ring-2 ring-orange-400 ring-offset-2 ring-offset-slate-900'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                {t.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-0.5 rounded-full whitespace-nowrap">
                    BEST SELLER
                  </span>
                )}
                <div className="text-xl sm:text-2xl font-black text-white">{t.label}</div>
                <div className={`text-xs mt-0.5 ${t.popular ? 'text-orange-100' : 'text-slate-400'}`}>{t.sub}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Products ─── */}
      {featured.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Popular Products</h2>
                <p className="text-slate-500 mt-1">Contractor favorites — in stock & ready to ship</p>
              </div>
              <Link href="/products" className="text-orange-600 font-semibold hover:text-orange-700 flex items-center gap-1 text-sm sm:text-base transition-colors">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ─── Social Proof ─── */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-2 text-slate-600 font-semibold">4.9 / 5 from 200+ contractors</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { text: '"These tarps held up through an entire roofing season. The grommets didn\'t budge. We\'ve reordered three times."', name: 'Mike T.', role: 'Roofing Contractor, TX' },
              { text: '"Bulk pricing saved us 30% vs. the hardware store. Fast quote response — had pricing same day."', name: 'Sarah L.', role: 'Farm Manager, IA' },
              { text: '"The 16-mil tarp covered our entire construction site. Lasted two winters with zero tearing."', name: 'James R.', role: 'General Contractor, OH' },
            ].map((review) => (
              <div key={review.name} className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-3 italic">"{review.text}"</p>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{review.name}</p>
                  <p className="text-slate-500 text-xs">{review.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trust Signals ─── */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { icon: <Truck className="w-8 h-8 text-orange-500" />, title: 'Ships Nationwide', desc: 'Direct delivery to your jobsite, farm, or warehouse. Pallet orders welcome.' },
              { icon: <Clock className="w-8 h-8 text-orange-500" />, title: '4-Hour Quote Response', desc: 'Bulk quote requests answered within 4 business hours, Mon–Fri.' },
              { icon: <Shield className="w-8 h-8 text-orange-500" />, title: 'Authorized Distributor', desc: 'Official Xpose Safety distributor. 100% genuine products, guaranteed.' },
              { icon: <Award className="w-8 h-8 text-orange-500" />, title: 'Premium Build Quality', desc: 'Brass grommets, UV-treated poly, reinforced corners — made to last.' },
            ].map((t) => (
              <div key={t.title} className="flex flex-col items-center text-center lg:items-start lg:text-left gap-3">
                <div className="bg-orange-50 p-3 rounded-xl">{t.icon}</div>
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
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bulk pricing CTA */}
          <div className="relative rounded-2xl overflow-hidden bg-orange-500 p-8 text-white">
            <div className="absolute inset-0 opacity-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/bulk-cta.png" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-orange-500/70" />
            <div className="relative">
              <p className="text-orange-100 text-sm font-semibold uppercase tracking-wider mb-2">Buying 5+ units?</p>
              <h3 className="text-2xl font-black mb-3">Get Wholesale Pricing</h3>
              <p className="text-orange-100 text-sm mb-6 leading-relaxed">
                Contractors, roofers & farmers get wholesale rates. We quote within 4 business hours.
              </p>
              <Link
                href="/bulk-quote"
                className="inline-flex items-center gap-2 bg-white text-orange-600 font-black px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors text-sm"
              >
                Request Bulk Quote <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Fire retardant */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 p-8 text-white">
            <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/20 rounded-full -translate-y-8 translate-x-8" />
            <div className="absolute right-6 bottom-0 w-20 h-20 bg-red-600/20 rounded-full translate-y-6" />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                🔥 NFPA Compliant
              </div>
              <h3 className="text-2xl font-black mb-3">Fire Retardant Tarps</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                NFPA 701-compliant fire retardant tarps for construction sites, events & rental yards.
              </p>
              <Link
                href="/products?type=fire-retardant"
                className="inline-flex items-center gap-2 bg-red-600 text-white font-black px-6 py-3 rounded-xl hover:bg-red-700 transition-colors text-sm"
              >
                Shop Fire Retardant <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Ready to Order?
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Shop retail online or request a bulk quote. Either way, we ship fast.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-base px-8 py-4 rounded-xl transition-colors"
            >
              Shop All Products <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="tel:+18000000000"
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-base px-8 py-4 rounded-xl transition-colors border border-slate-700"
            >
              <Phone className="w-5 h-5" /> Call Us
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
