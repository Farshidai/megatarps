import type { Article } from '../types'
import { H2, P, UL, A, Table, Callout } from '../prose'

export const materials: Article = {
  slug: 'poly-vs-canvas-vs-vinyl-tarps',
  title: 'Poly vs Canvas vs Vinyl Tarps: Which Material for Which Job',
  shortTitle: 'Poly vs canvas vs vinyl',
  metaTitle: 'Poly vs Canvas vs Vinyl Tarps',
  description:
    'Compare poly, canvas, vinyl, mesh, clear and fire-retardant tarps on waterproofing, breathability, weight, durability and cost, and see which material fits each job.',
  excerpt:
    'Poly is cheap and waterproof, canvas breathes, vinyl lasts for years, and mesh lets the wind through. Choosing the right material matters more than adding mil. Here is how they compare in the field.',
  topic: 'Materials',
  published: '2026-10-25',
  updated: '2026-10-25',
  readingMinutes: 6,
  toc: [
    { id: 'at-a-glance', label: 'At a glance' },
    { id: 'poly', label: 'Poly tarps' },
    { id: 'canvas', label: 'Canvas tarps' },
    { id: 'vinyl', label: 'Vinyl tarps' },
    { id: 'specialty', label: 'Mesh, clear and fire-retardant' },
    { id: 'cost', label: 'Cost over the life of the tarp' },
    { id: 'choosing', label: 'How to choose' },
  ],
  shop: [
    { label: 'Poly tarps', href: '/products?type=poly' },
    { label: 'Canvas tarps', href: '/products?type=canvas' },
    { label: 'Mesh tarps', href: '/products?type=mesh' },
    { label: 'Clear vinyl tarps', href: '/products?type=clear-vinyl' },
    { label: 'Fire-retardant tarps', href: '/products?type=fire-retardant' },
  ],
  related: ['tarp-mil-thickness-explained', 'concrete-curing-blankets-cold-weather-tarps', 'how-to-size-a-tarp'],
  body: () => (
    <>
      <P>
        The word &quot;tarp&quot; covers very different materials. A blue poly tarp, a cotton canvas drop cloth and an
        18-oz vinyl truck tarp do not do the same job, and the wrong one costs more over a season than the price
        difference at purchase. Here is how the common materials compare.
      </P>

      <H2 id="at-a-glance">At a glance</H2>
      <Table
        caption="Tarp materials compared"
        head={['Material', 'Waterproof', 'Breathes', 'Weight', 'Durability', 'Relative cost']}
        rows={[
          ['Poly (woven PE)', 'Yes', 'No', 'Light', 'Good; depends on mil and UV treatment', '$'],
          ['Canvas (cotton duck)', 'Water-resistant when treated', 'Yes', 'Heavy', 'Good; can mildew if stored wet', '$$'],
          ['Vinyl (PVC-coated polyester)', 'Yes', 'No', 'Heavy', 'Excellent; multi-year', '$$$'],
          ['Mesh', 'No', 'Air passes', 'Light', 'Good', '$–$$'],
          ['Clear vinyl / clear poly', 'Yes', 'No', 'Medium', 'Good', '$$'],
          ['Fire-retardant', 'Yes (poly or vinyl base)', 'No', 'Varies', 'Same as base material', '$$'],
        ]}
      />

      <H2 id="poly">Poly tarps</H2>
      <P>
        Poly tarps are a woven polyethylene scrim laminated on both sides. They are fully waterproof, light, cheap per
        square foot, and available in every size and thickness from 5 to 20 mil. UV-treated versions last a season or
        more outdoors. They are the default for roofing, site cover, material storage and hay.
      </P>
      <P>
        The downside is that poly does not breathe. Moisture trapped under it condenses, which can cause mildew on
        stored lumber or equipment, so leave air gaps where you can. Poly is also slick, so it is a poor drop cloth on
        ladders and floors. Choosing a weight? See <A href="/resources/tarp-mil-thickness-explained">mil thickness explained</A>.
      </P>

      <H2 id="canvas">Canvas tarps</H2>
      <P>
        Canvas tarps are cotton duck, typically 10 to 18 oz per square yard. Their big advantage is breathability: water
        vapor escapes, so canvas is better for covering machinery, vehicles, furniture and anything that would sweat
        under plastic. Canvas lies flat, does not slip, and is the painter&apos;s choice for drop cloths.
      </P>
      <P>
        Treated canvas sheds rain but is water-resistant rather than waterproof, and untreated canvas absorbs water and
        gets very heavy. Canvas should be dried before storage or it can mildew. It also costs more and weighs much
        more than poly of the same size.
      </P>

      <H2 id="vinyl">Vinyl tarps</H2>
      <P>
        Vinyl tarps are polyester fabric coated or laminated with PVC, commonly 10 to 22 oz per square yard. They are
        waterproof, tear- and abrasion-resistant, resist oils and many chemicals, and can be repaired by heat welding.
        That is why flatbed truckers, rental yards and long-term enclosures use them. A good vinyl tarp can outlast
        several poly tarps, which often makes it cheaper over time for daily use.
      </P>
      <P>
        Vinyl is heavy and costs more up front. In hard cold it stiffens, so check the cold-crack rating if you will
        handle it below freezing.
      </P>

      <H2 id="specialty">Mesh, clear and fire-retardant</H2>
      <UL>
        <li>
          <strong>Mesh:</strong> an open weave that lets air through. It cuts wind load on scaffolding and fences,
          contains debris, and provides shade. It does not keep rain out.
        </li>
        <li>
          <strong>Clear vinyl or clear reinforced poly:</strong> lets daylight into winter enclosures so crews can work
          without as much temporary lighting, and is useful for greenhouses and porch enclosures.
        </li>
        <li>
          <strong>Fire-retardant:</strong> treated to resist ignition and to self-extinguish when the flame is removed.
          It is <em>not</em> fireproof. Many owners, specifications and fire codes call for flame-retardant materials
          on temporary enclosures and near heaters or hot work.
        </li>
      </UL>
      <Callout tone="warn" title="Ask for the paperwork">
        If a job requires a flame-retardant tarp, ask the supplier for the test certificate showing which standard it
        was tested to (NFPA 701 is common in the US) and keep a copy on site for the inspector.
      </Callout>

      <H2 id="cost">Cost over the life of the tarp</H2>
      <P>
        Sticker price is a poor guide on its own. Compare cost per month of service: a poly tarp that lasts one season
        outdoors may cost less in total than a vinyl tarp only if you would not have replaced it two or three times
        over the vinyl tarp&apos;s life. Count the labor too, because re-tarping a roof or a stack takes a crew&apos;s
        time every time a tarp fails. For short jobs and one-time cover, poly almost always wins. For daily handling,
        trucks and equipment that stays covered year-round, vinyl usually pays for itself.
      </P>

      <H2 id="choosing">How to choose</H2>
      <UL>
        <li><strong>Need waterproof at the lowest cost?</strong> Poly. Pick the mil by how long it stays outside.</li>
        <li><strong>Covering something that sweats or must not slip?</strong> Canvas.</li>
        <li><strong>Daily handling, abrasion or multi-year use?</strong> Vinyl.</li>
        <li><strong>Wind on scaffolding or fences?</strong> Mesh.</li>
        <li><strong>Winter enclosure crews work inside?</strong> Clear, and fire-retardant if heaters are running. See <A href="/resources/concrete-curing-blankets-cold-weather-tarps">cold-weather tarps</A>.</li>
      </UL>
      <P>
        Browse by job instead: <A href="/products?job=roofing">roofing</A>, <A href="/products?job=construction">construction</A>,{' '}
        <A href="/products?job=agriculture">agriculture</A>, <A href="/products?job=warehouse">warehouse</A> and{' '}
        <A href="/products?job=scaffolding">scaffolding</A>.
      </P>
    </>
  ),
}
