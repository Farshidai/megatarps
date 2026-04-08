import Link from 'next/link'
import { ArrowRight, Shield, Truck, Clock, Award, CheckCircle, Phone } from 'lucide-react'
import { getFeaturedProducts } from '@/lib/products'
import { ProductCard } from '@/components/products/ProductCard'

export default async function HomePage() {
  const featured = await getFeaturedProducts(8)

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f97316' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-1.5 text-orange-300 text-sm font-semibold mb-6">
              <Shield className="w-4 h-4" />
              Authorized Xpose Safety Distributor
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
              Heavy-Duty Tarps<br />
              <span className="text-orange-500">Built for the Job</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl">
              5-mil to 20-mil poly tarps, canvas, mesh, and fire-retardant — for contractors,
              farmers, and industry. Retail pricing online. Bulk pricing by quote.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products" className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors">
                Shop All Tarps <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/bulk-quote" className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors">
                Get Bulk Pricing
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /><span>Ships nationwide</span></div>
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /><span>Bulk quotes within 4 hours</span></div>
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /><span>5-mil to 20-mil thickness</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Shop by Use</h2>
          <p className="text-slate-500 mb-8">Find the right tarp for your job</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { href: '/products/construction-roofing', title: 'Construction & Roofing', desc: 'Emergency roof cover, jobsite protection', icon: '🏗️', color: 'bg-blue-50 border-blue-200 hover:border-blue-400', textColor: 'text-blue-700' },
              { href: '/products/agriculture-farming', title: 'Agriculture & Farming', desc: 'Hay cover, grain storage, equipment', icon: '🌾', color: 'bg-green-50 border-green-200 hover:border-green-400', textColor: 'text-green-700' },
              { href: '/products/industrial-warehouse', title: 'Industrial & Warehouse', desc: 'Heavy equipment, pallet covers, storage', icon: '🏭', color: 'bg-purple-50 border-purple-200 hover:border-purple-400', textColor: 'text-purple-700' },
              { href: '/products/general-purpose', title: 'General Purpose', desc: 'Camping, painting, temporary cover', icon: '🔧', color: 'bg-orange-50 border-orange-200 hover:border-orange-400', textColor: 'text-orange-700' },
            ].map((cat) => (
              <Link key={cat.href} href={cat.href} className={`p-6 rounded-xl border-2 transition-all group ${cat.color}`}>
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className={`font-bold text-lg mb-1 group-hover:underline ${cat.textColor}`}>{cat.title}</h3>
                <p className="text-slate-600 text-sm">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Thickness Strip */}
      <section className="bg-slate-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-white font-black text-xl">Shop by Thickness</h2>
            <Link href="/resources/mil-thickness-explained" className="text-orange-400 text-sm hover:text-orange-300">What does mil mean? →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { mil: 5, label: '5-Mil', sub: 'Multipurpose', href: '/products/thickness/5-mil' },
              { mil: 10, label: '10-Mil', sub: 'Heavy Duty', href: '/products/thickness/10-mil' },
              { mil: 12, label: '12-Mil', sub: 'Extra Heavy', href: '/products/thickness/12-mil' },
              { mil: 16, label: '16-Mil', sub: 'Super Heavy', href: '/products/thickness/16-mil', popular: true },
              { mil: 20, label: '20-Mil', sub: 'Ultra Heavy', href: '/products/thickness/20-mil' },
            ].map((t) => (
              <Link key={t.mil} href={t.href} className={`relative rounded-lg p-4 text-center transition-all ${ t.popular ? 'bg-orange-500 text-white ring-2 ring-orange-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                {t.popular && <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-0.5 rounded-full">BEST SELLER</span>}
                <div className="text-2xl font-black text-white">{t.label}</div>
                <div className={`text-sm mt-0.5 ${t.popular ? 'text-orange-100' : 'text-slate-400'}`}>{t.sub}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Popular Products</h2>
                <p className="text-slate-500 mt-1">Contractor favorites</p>
              </div>
              <Link href="/products" className="text-orange-600 font-semibold hover:text-orange-700 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Trust Signals */}
      <section className="bg-slate-50 py-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Truck className="w-8 h-8 text-orange-500" />, title: 'Ships Nationwide', desc: 'Direct from warehouse to your jobsite or farm. Pallet-sized orders available.' },
              { icon: <Clock className="w-8 h-8 text-orange-500" />, title: '4-Hour Quote Response', desc: 'Bulk quote requests answered within 4 business hours, Monday–Friday.' },
              { icon: <Shield className="w-8 h-8 text-orange-500" />, title: 'Authorized Distributor', desc: 'Authorized Xpose Safety distributor. Genuine products, guaranteed quality.' },
              { icon: <Award className="w-8 h-8 text-orange-500" />, title: 'Premium Construction', desc: 'Brass grommets, reinforced corners, UV-treated poly on all heavy-duty lines.' },
            ].map((t) => (
              <div key={t.title} className="flex gap-4">
                <div className="flex-shrink-0">{t.icon}</div>
                <div><h3 className="font-bold text-slate-900 mb-1">{t.title}</h3><p className="text-sm text-slate-600">{t.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bulk CTA */}
      <section className="bg-orange-500 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black text-white mb-4">Ordering 5 or More Units?</h2>
          <p className="text-orange-100 text-xl mb-8 max-w-2xl mx-auto">Get wholesale pricing on bulk tarp orders. We quote within 4 business hours. Contractors, roofers, and farmers — this is built for you.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/bulk-quote" className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 font-black text-lg px-8 py-4 rounded-xl hover:bg-orange-50 transition-colors">
              Request Bulk Quote <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="tel:+18000000000" className="inline-flex items-center justify-center gap-2 bg-orange-600 text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-orange-700 transition-colors">
              <Phone className="w-5 h-5" /> Call Us
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
