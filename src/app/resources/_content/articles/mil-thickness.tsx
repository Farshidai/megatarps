import type { Article } from '../types'
import { H2, P, UL, A, Table, Callout } from '../prose'

export const milThickness: Article = {
  slug: 'tarp-mil-thickness-explained',
  title: 'Tarp Mil Thickness Explained: 5 vs 10 vs 12 vs 16 vs 20 Mil',
  shortTitle: 'Mil thickness explained',
  metaTitle: 'Tarp Mil Thickness Explained (5, 10, 12, 16, 20 Mil)',
  description:
    'What "mil" means on a poly tarp, how 5, 10, 12, 16 and 20 mil compare for strength and outdoor life, and which thickness fits roofing, farm, warehouse and site work.',
  excerpt:
    'A mil is a thousandth of an inch, but thickness alone does not make a tarp strong. Here is how 5 through 20 mil poly tarps compare, what else to check on the spec sheet, and which weight to buy for each job.',
  topic: 'Materials',
  published: '2026-10-25',
  updated: '2026-10-25',
  readingMinutes: 6,
  toc: [
    { id: 'what-is-a-mil', label: 'What a mil actually measures' },
    { id: 'comparison', label: '5 vs 10 vs 12 vs 16 vs 20 mil' },
    { id: 'beyond-mil', label: 'What matters besides mil' },
    { id: 'by-job', label: 'Which mil for which job' },
    { id: 'buying', label: 'Buying by the case or pallet' },
  ],
  shop: [
    { label: '10-mil heavy-duty tarps', href: '/products?thickness=10', note: 'Everyday site and storage cover' },
    { label: '12-mil extra heavy tarps', href: '/products?thickness=12', note: 'Roofing and scaffold work' },
    { label: '16-mil super heavy tarps', href: '/products?thickness=16', note: 'Long-term outdoor cover' },
    { label: '20-mil ultra heavy tarps', href: '/products?thickness=20', note: 'Semi-permanent and abrasive use' },
  ],
  related: ['poly-vs-canvas-vs-vinyl-tarps', 'how-to-size-a-tarp', 'roofing-tarp-for-storm-damage'],
  body: () => (
    <>
      <P>
        Walk into any supply house and you will see tarps labeled 5 mil, 10 mil, 12 mil and up. The number is the
        first thing most buyers compare, and it is a useful one. It is not the whole story, though, and two tarps with
        the same mil rating can perform very differently on a windy roof. This guide explains what the number means,
        how the common weights compare, and what to check before you order a pallet.
      </P>

      <H2 id="what-is-a-mil">What a mil actually measures</H2>
      <P>
        A mil is one thousandth of an inch (0.001&Prime;, about 25 microns). It is not a millimeter. A 10-mil tarp is
        roughly 0.010&Prime; thick, about the thickness of two or three sheets of printer paper.
      </P>
      <P>
        Most heavy-duty &quot;poly&quot; tarps are not a single plastic sheet. They are a woven scrim of high-density
        polyethylene (HDPE) tapes, laminated on both sides with a low-density polyethylene (LDPE) coating that makes
        them waterproof and carries the UV inhibitors. The mil rating is the thickness of that whole laminate. A thicker
        laminate generally means more coating, more UV protection and better puncture and abrasion resistance.
      </P>
      <Callout title="Mil ratings are not standardized">
        There is no single industry test that every manufacturer uses to state mil thickness, and labels are sometimes
        rounded up. Treat mil as a starting point and compare it with the weave count and weight on the spec sheet. If
        a supplier cannot give you those numbers, ask why.
      </Callout>

      <H2 id="comparison">5 vs 10 vs 12 vs 16 vs 20 mil</H2>
      <P>
        The ranges below are typical for UV-treated woven poly tarps used outdoors in full sun. Real-world life depends
        heavily on wind, how well the tarp is tied down, sharp edges underneath it and how much sun it sees, so use
        these as relative guidance, not a warranty.
      </P>
      <Table
        caption="Comparison of common poly tarp thicknesses"
        head={['Thickness', 'Typical weave', 'Duty', 'Typical outdoor life*', 'Good for']}
        rows={[
          ['5 mil', '8×8 to 10×10', 'Light', 'Weeks to a few months', 'Painting, short-term cover, ground cloths, indoor dust cover'],
          ['10 mil', '12×12', 'Heavy', 'About a season to a year', 'Site cover, debris, lumber and material storage, truck loads'],
          ['12 mil', '14×14', 'Extra heavy', 'About 1–2 years', 'Storm roof cover, scaffold wrap, hay and equipment cover'],
          ['16 mil', '14×14', 'Super heavy', 'Multiple seasons', 'Long-term farm cover, winter enclosures, heavy equipment'],
          ['20 mil', '16×16', 'Ultra heavy', 'Several years with care', 'Semi-permanent covers, abrasive loads, high-wind sites'],
        ]}
      />
      <P>
        <em className="text-sm text-slate-500">
          *Continuous outdoor exposure. Life drops sharply if a tarp flaps in the wind or rubs on a sharp edge.
        </em>
      </P>
      <P>
        Each step up adds weight. That matters for one person dragging a 40&times;60 across a roof, and it matters for
        freight: heavier tarps mean fewer units per pallet and a higher shipping weight per tarp.
      </P>

      <H2 id="beyond-mil">What matters besides mil</H2>
      <UL>
        <li>
          <strong>Weave count.</strong> Strands per square inch in each direction (for example 14&times;14). A tighter
          weave resists tearing and holds grommets better. A thick coating on a loose weave can still rip.
        </li>
        <li>
          <strong>Weight.</strong> Ounces per square yard is a more honest comparison than mil because it is easy to
          verify on a scale. Compare weights between suppliers for the same nominal mil.
        </li>
        <li>
          <strong>Edges and grommets.</strong> Look for rope-reinforced hems, reinforced corners and rust-resistant
          grommets about every 18 to 36 inches. Most tarps fail at the grommets, not in the middle of the panel.
        </li>
        <li>
          <strong>UV treatment.</strong> Untreated poly breaks down fast in direct sun. For anything outdoors longer than
          a few weeks, UV treatment matters more than a couple of extra mil.
        </li>
        <li>
          <strong>Color.</strong> Silver/black or white-faced tarps reflect heat and are often heavier-duty product
          lines. Black faces block light completely, which helps for hay and silage.
        </li>
      </UL>

      <H2 id="by-job">Which mil for which job</H2>
      <UL>
        <li>
          <strong>Roofing and storm dry-in:</strong> 12 mil minimum, 16 mil if it will stay up for weeks. See{' '}
          <A href="/resources/roofing-tarp-for-storm-damage">how to choose a roofing tarp</A> and{' '}
          <A href="/products?job=roofing">roofing tarps</A>.
        </li>
        <li>
          <strong>General construction:</strong> 10 mil covers most material storage and debris work; step up to 12–16
          mil for winter enclosures. Browse <A href="/products?job=construction">construction tarps</A>.
        </li>
        <li>
          <strong>Agriculture:</strong> 12–20 mil, UV-treated, for hay, grain and equipment that sit outside all season.
          Browse <A href="/products?job=agriculture">agriculture tarps</A>.
        </li>
        <li>
          <strong>Warehouse and indoor:</strong> 5–10 mil is usually enough for dust and pallet cover where there is no
          sun or wind. Browse <A href="/products?job=warehouse">warehouse tarps</A>.
        </li>
        <li>
          <strong>Scaffolding near hot work:</strong> thickness is secondary; you likely need a fire-retardant rated
          tarp. Browse <A href="/products?job=scaffolding">scaffolding tarps</A>.
        </li>
      </UL>

      <H2 id="buying">Buying by the case or pallet</H2>
      <P>
        If your crews go through tarps every month, standardize on one or two weights and buy them by the case or
        pallet. Unit price drops with volume, and your foremen stop guessing. A common contractor setup is a pallet of
        10 mil in the sizes you use most, plus a smaller stock of 16 mil for long-duration jobs.
      </P>
      <P>
        Not sure what size you need first? Use the <A href="/resources/tarp-size-calculator">tarp size calculator</A>,
        then read <A href="/resources/buying-tarps-wholesale">how wholesale ordering and LTL freight work</A>.
      </P>
    </>
  ),
}
