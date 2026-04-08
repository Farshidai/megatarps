import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tarp Buying Guide & Resources',
  description: 'Learn how to choose the right tarp for your project. Mil thickness guide, coverage calculator, and industry tips.',
}

export default function ResourcesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-black text-slate-900 mb-3">Tarp Buying Guide</h1>
      <p className="text-slate-600 mb-10">Everything you need to choose the right tarp for the job.</p>

      <div className="space-y-10">

        {/* Mil Thickness Guide */}
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-4">Mil Thickness Guide</h2>
          <p className="text-slate-600 text-sm mb-4">
            &quot;Mil&quot; refers to thousandths of an inch. Higher mil = thicker, heavier, more durable.
          </p>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {[
              ['5–7 Mil', 'Light Duty', 'Camping ground cloths, home projects, temporary furniture covers. Not for extended outdoor use.'],
              ['10 Mil', 'Medium Duty', 'Construction debris, equipment storage, truck bed liners. 1–2 season outdoor use.'],
              ['12 Mil', 'Heavy Duty', 'Roofing projects, scaffold enclosures, outdoor covers lasting 2–3 seasons.'],
              ['16 Mil', 'Super Heavy Duty', 'Farm equipment, industrial covers, commercial applications. Multi-year outdoor use.'],
              ['20 Mil', 'Ultra Heavy Duty', 'Permanent outdoor covers, extreme weather, commercial operations. Longest lifespan.'],
            ].map(([mil, level, desc], i) => (
              <div key={mil} className={`grid grid-cols-12 gap-4 px-5 py-4 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                <div className="col-span-2 font-black text-slate-900">{mil}</div>
                <div className="col-span-2 font-semibold text-orange-600">{level}</div>
                <div className="col-span-8 text-slate-600">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Material Guide */}
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-4">Material Types</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                material: 'Polyethylene (Poly)',
                props: ['Waterproof', 'UV resistant', 'Lightweight', 'Most affordable'],
                best: 'General purpose, roofing, storage, outdoor covers',
              },
              {
                material: 'Canvas',
                props: ['Breathable', 'Absorbs moisture', 'Heavy'],
                best: 'Drop cloths, auto/equipment covers, anywhere breathability matters',
              },
              {
                material: 'Fire Retardant Poly',
                props: ['NFPA 701 rated', 'Self-extinguishing', 'Waterproof'],
                best: 'Welding, electrical, construction near open flames, regulated sites',
              },
              {
                material: 'Mesh / Shade Cloth',
                props: ['Lets air through', 'Blocks UV', 'Lightweight'],
                best: 'Privacy fences, shade structures, wind screens, golf ranges',
              },
            ].map(({ material, props, best }) => (
              <div key={material} className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 mb-2">{material}</h3>
                <ul className="text-xs text-slate-500 mb-3 space-y-0.5">
                  {props.map(p => <li key={p}>✓ {p}</li>)}
                </ul>
                <p className="text-xs text-slate-600"><strong>Best for:</strong> {best}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sizing Guide */}
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-4">How to Measure</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-600 space-y-3">
            <p>
              <strong className="text-slate-900">For rectangular areas:</strong> Measure the item or area at its widest and longest points.
              Add 2–4 feet on each side for overlap and tie-downs.
            </p>
            <p>
              <strong className="text-slate-900">For roofing:</strong> Measure the roof width × pitch length. A 20×40 roof needs at least a 25×50 tarp
              to account for overhang.
            </p>
            <p>
              <strong className="text-slate-900">For irregular shapes:</strong> Use the bounding box (widest × longest). It&apos;s better to size up.
            </p>
            <p className="text-orange-700 font-medium">
              When in doubt, size up — a slightly oversized tarp is always better than one that&apos;s too small.
              Ask our AI assistant for help sizing your specific project.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-4">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'What does "finished size" mean?',
                a: 'Finished size is the usable area after hemming and grommets. The raw poly cut is slightly larger. All our sizes are finished sizes.',
              },
              {
                q: 'How often are grommets placed?',
                a: 'Our standard tarps have grommets every 18 inches along the perimeter. This gives you plenty of tie-down points for securing the tarp.',
              },
              {
                q: 'Do you carry custom sizes?',
                a: 'We stock standard sizes up to 40×60 ft. For custom sizes, submit a bulk quote request and we\'ll check availability with our supplier.',
              },
              {
                q: 'Is fire retardant the same as fireproof?',
                a: 'No. Fire retardant means the material self-extinguishes when the flame source is removed. It is not fireproof. It meets NFPA 701 for flame resistance.',
              },
              {
                q: 'Can I get net terms?',
                a: 'Yes, for qualified contractors. Submit a bulk quote and mention net terms in the special requirements. We\'ll set up an account.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="font-bold text-slate-900 mb-2">{q}</p>
                <p className="text-sm text-slate-600">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-slate-900 rounded-2xl p-6 text-center text-white">
          <p className="font-bold mb-2">Still not sure which tarp to get?</p>
          <p className="text-slate-300 text-sm mb-4">Use our AI chat assistant (bottom right) — describe your project and we&apos;ll recommend the right tarp.</p>
          <a href="/products"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors inline-block">
            Browse Products
          </a>
        </div>

      </div>
    </div>
  )
}
