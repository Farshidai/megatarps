import { Shield, Truck, Users, Award } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About MegaTarps',
  description: 'Learn about MegaTarps — your source for heavy-duty tarps for construction, agriculture, and industry.',
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-14">
        <h1 className="text-4xl font-black text-slate-900 mb-4">Built for the Trades</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          MegaTarps supplies heavy-duty tarps to contractors, farmers, and industrial buyers across the United States.
          We stock the same tarps the pros rely on — and ship them direct.
        </p>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-14">
        {[
          {
            icon: Shield,
            title: 'Industrial-Grade Quality',
            desc: 'We only carry tarps built to work — 5-mil through 20-mil poly, canvas, fire retardant, and mesh. Every tarp is sourced from verified manufacturers with real specs.',
          },
          {
            icon: Truck,
            title: 'Ships Nationwide',
            desc: 'We dropship direct from warehouse to your jobsite or facility. No middlemen, no storage fees for you — just fast delivery wherever you need it.',
          },
          {
            icon: Users,
            title: 'Contractor-Friendly',
            desc: 'Bulk pricing for 5+ units, net terms for qualified contractors, and a dedicated team that responds within 4 business hours on quote requests.',
          },
          {
            icon: Award,
            title: 'Honest Specs',
            desc: 'We list actual mil thickness, weave count, weight, and grommet spacing — not marketing fluff. What you see is what you get.',
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-xl border border-slate-200 p-6 flex gap-4">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Product lines */}
      <div className="mb-14">
        <h2 className="text-2xl font-black text-slate-900 mb-6">What We Carry</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {[
            ['5–7 Mil Poly', 'Light duty. Ground cloths, camping, home projects, temporary covers.'],
            ['10 Mil Poly', 'Medium duty. Construction debris, equipment storage, truck bed liners.'],
            ['12 Mil Poly', 'Heavy duty. Roofing, scaffold covers, long-term outdoor storage.'],
            ['16 Mil Super Heavy Duty', 'Industrial. Farm equipment, permanent outdoor covers, extreme weather.'],
            ['20 Mil Ultra Heavy Duty', 'Commercial. The toughest tarp in our lineup. Built for permanent use.'],
            ['Fire Retardant', 'Meets NFPA 701. Required for welding, electrical work, regulated job sites.'],
            ['Canvas', 'Breathable. Drop cloths, auto covers, antique equipment.'],
            ['Mesh / Shade', 'Wind screens, privacy fences, shade structures.'],
          ].map(([label, desc], i) => (
            <div key={label} className={`flex gap-4 px-5 py-3 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
              <span className="font-bold text-slate-900 w-48 flex-shrink-0">{label}</span>
              <span className="text-slate-600">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-slate-900 rounded-2xl p-8 text-center text-white">
        <h2 className="text-2xl font-black mb-3">Ready to order?</h2>
        <p className="text-slate-300 mb-6">Browse our full catalog or request bulk pricing for 5+ units.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/products"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Browse Products
          </a>
          <a href="/bulk-quote"
            className="border-2 border-white/30 hover:border-white text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Get Bulk Pricing
          </a>
        </div>
      </div>
    </div>
  )
}
