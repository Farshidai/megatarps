import type { Article } from '../types'
import { H2, P, UL, OL, A, Table, Callout } from '../prose'

export const coldWeather: Article = {
  slug: 'concrete-curing-blankets-cold-weather-tarps',
  title: 'Concrete Curing Blankets and Cold-Weather Tarps: A Contractor’s Guide',
  shortTitle: 'Cold-weather concrete',
  metaTitle: 'Concrete Curing Blankets & Cold-Weather Tarps',
  description:
    'How insulated curing blankets and heated tarp enclosures protect fresh concrete in cold weather, the temperatures that matter, and the mistakes that cause scaling and lost strength.',
  excerpt:
    'Fresh concrete that freezes before it gains strength can be permanently damaged. Here is when cold-weather protection is needed, how curing blankets and tarp enclosures work, and how to avoid the common mistakes.',
  topic: 'Cold weather',
  published: '2026-10-25',
  updated: '2026-10-25',
  readingMinutes: 7,
  toc: [
    { id: 'why', label: 'Why cold weather matters' },
    { id: 'temperatures', label: 'The temperatures that matter' },
    { id: 'blankets', label: 'Insulated curing blankets' },
    { id: 'enclosures', label: 'Tarp enclosures and heaters' },
    { id: 'mistakes', label: 'Mistakes to avoid' },
    { id: 'stocking', label: 'Stocking for winter' },
  ],
  shop: [
    { label: 'Construction tarps', href: '/products?job=construction', note: 'Enclosures and material cover' },
    { label: '16-mil super heavy tarps', href: '/products?thickness=16' },
    { label: 'Clear vinyl tarps', href: '/products?type=clear-vinyl', note: 'Let daylight into enclosures' },
    { label: 'Fire-retardant tarps', href: '/products?type=fire-retardant', note: 'For heated enclosures' },
    { label: 'Request a quote for curing blankets', href: '/bulk-quote' },
  ],
  related: ['poly-vs-canvas-vs-vinyl-tarps', 'tarp-mil-thickness-explained', 'buying-tarps-wholesale'],
  body: () => (
    <>
      <P>
        Every Midwest contractor knows the pour schedule does not stop in November. Concrete can be placed in cold
        weather, but it has to be protected until it is strong enough to resist freezing. Insulated curing blankets and
        tarp enclosures are the two tools that make that possible. This guide covers when you need them and how to use
        them well. Always follow the project specification and your engineer of record, which take precedence over
        general guidance.
      </P>

      <H2 id="why">Why cold weather matters</H2>
      <P>
        Concrete gains strength through hydration, a chemical reaction that slows sharply as temperature drops and
        nearly stops near freezing. Worse, the water in fresh concrete expands when it freezes. If that happens before
        the concrete has gained enough strength, it can cause permanent loss of strength, surface scaling and poor
        durability that no amount of later curing will fix.
      </P>
      <P>
        ACI 306, the American Concrete Institute&apos;s cold-weather guidance, defines cold weather as when the air
        temperature has fallen to, or is expected to fall below, 40&deg;F during the protection period. A widely used
        rule from the same guidance is to protect concrete from freezing until it reaches about 500 psi compressive
        strength.
      </P>

      <H2 id="temperatures">The temperatures that matter</H2>
      <P>
        Thin sections lose heat fastest, so they need warmer concrete. ACI guidance lists minimum concrete temperatures
        as placed and maintained during the protection period, roughly as follows:
      </P>
      <Table
        caption="Typical minimum concrete temperature by section size"
        head={['Least section dimension', 'Minimum concrete temperature']}
        rows={[
          ['Less than 12 in (slabs, thin walls)', '55°F'],
          ['12 to 36 in', '50°F'],
          ['36 to 72 in', '45°F'],
          ['Over 72 in (mass concrete)', '40°F'],
        ]}
      />
      <P>
        Use maturity sensors or field-cured cylinders to know when the concrete has actually reached the strength you
        need, rather than guessing from the calendar.
      </P>

      <H2 id="blankets">Insulated curing blankets</H2>
      <P>
        A curing blanket is closed-cell foam insulation sealed between layers of polyethylene film or woven poly. It
        does not add heat; it traps the heat that hydration produces and holds moisture in the slab. Blankets are rated
        by R-value, and colder conditions call for higher R-values or doubled layers.
      </P>
      <OL>
        <li>Remove snow and ice from forms and reinforcing. Never place concrete on frozen subgrade.</li>
        <li>Place blankets as soon as finishing allows without marking the surface.</li>
        <li>Overlap seams generously and weight the edges so wind cannot lift them.</li>
        <li>Double up at edges and corners, which lose heat from more than one face.</li>
        <li>Keep blankets dry and undamaged. Wet or torn foam insulates poorly.</li>
      </OL>
      <P>
        Blankets are also used ahead of the pour to thaw frozen ground and to keep subgrade from freezing overnight.
      </P>

      <H2 id="enclosures">Tarp enclosures and heaters</H2>
      <P>
        For walls, columns, elevated decks and work that has to continue inside, crews frame a temporary enclosure and
        wrap it in heavy tarps, then heat the space. Use 12–16 mil reinforced poly or vinyl, and clear panels where you
        want daylight inside. Seal the bottom edges to the ground or deck, since that is where most heat escapes.
      </P>
      <Callout tone="warn" title="Vent combustion heaters">
        Unvented propane or kerosene heaters release carbon monoxide, a serious hazard to workers, and carbon dioxide,
        which can react with fresh concrete and leave a soft, dusting surface. Use indirect-fired heaters that exhaust
        outside the enclosure, keep the tarps clear of heater surfaces, and use flame-retardant tarps where heaters run.
        See <A href="/resources/poly-vs-canvas-vs-vinyl-tarps">fire-retardant and clear tarps</A>.
      </Callout>

      <H2 id="mistakes">Mistakes to avoid</H2>
      <UL>
        <li><strong>Pulling protection off all at once.</strong> A sudden temperature drop can crack the surface. Remove blankets gradually and avoid doing it in the coldest part of the day.</li>
        <li><strong>Letting the slab dry out.</strong> Heated enclosures are dry. Keep the surface moist or covered so it cures, not just stays warm.</li>
        <li><strong>Gaps at seams and edges.</strong> A blanket with an open seam lets a cold strip freeze.</li>
        <li><strong>Reusing torn tarps on enclosures.</strong> Wind finds the hole, and the whole wall comes loose.</li>
      </UL>

      <H2 id="stocking">Stocking for winter</H2>
      <P>
        Cold-weather work burns through tarps fast. Plan your enclosure tarps and blankets before the first hard freeze
        and order them by the case or pallet so you are not paying rush freight in December. We sell heavy poly,
        clear and fire-retardant tarps; for insulated curing blankets, send a{' '}
        <A href="/bulk-quote">quote request</A> with sizes and quantities and we will tell you what we can supply. See
        also <A href="/resources/buying-tarps-wholesale">how wholesale ordering and LTL freight work</A>.
      </P>
    </>
  ),
}
