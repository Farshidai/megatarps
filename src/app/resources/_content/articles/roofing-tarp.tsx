import type { Article } from '../types'
import { H2, P, UL, OL, A, Callout, Table } from '../prose'

export const roofingTarp: Article = {
  slug: 'roofing-tarp-for-storm-damage',
  title: 'How to Choose a Roofing Tarp for Storm Damage',
  shortTitle: 'Storm roof tarps',
  description:
    'Pick the right thickness, size and fastening method for an emergency roof tarp after hail or wind damage, plus what roofers should stock before storm season.',
  excerpt:
    'A storm tarp has one job: keep water out until the permanent repair. That depends less on the tarp itself than on how far it extends past the damage and how it is fastened. Here is what to buy and how to install it so it survives the next storm.',
  topic: 'Roofing',
  published: '2026-10-25',
  updated: '2026-10-25',
  readingMinutes: 6,
  toc: [
    { id: 'safety', label: 'Safety first' },
    { id: 'material', label: 'Thickness and construction' },
    { id: 'size', label: 'Sizing a roof tarp' },
    { id: 'install', label: 'Fastening it so it stays' },
    { id: 'insurance', label: 'Documentation and insurance' },
    { id: 'stocking', label: 'What roofers should stock' },
  ],
  shop: [
    { label: 'Roofing tarps', href: '/products?job=roofing', note: '12–16 mil, rope-reinforced' },
    { label: 'Construction & roofing category', href: '/products/construction-roofing' },
    { label: '12-mil extra heavy tarps', href: '/products?thickness=12' },
    { label: '16-mil super heavy tarps', href: '/products?thickness=16' },
  ],
  related: ['tarp-mil-thickness-explained', 'how-to-size-a-tarp', 'buying-tarps-wholesale'],
  body: () => (
    <>
      <P>
        After hail or a windstorm, a tarp is what stands between a damaged roof and a ruined ceiling, insulation and
        drywall. Insurers and homeowners expect the opening to be covered fast, and roofers often tarp dozens of houses
        in the days after a storm. The tarp you pick matters, but most failures we hear about come from tarps that were
        too small or tied down only through the grommets.
      </P>

      <H2 id="safety">Safety first</H2>
      <Callout tone="warn" title="Do not go on a roof during a storm">
        Wait until wind and lightning have passed and the surface is safe to walk. Wet shingles, debris and weakened
        decking are serious fall hazards. Use fall protection, work in pairs, and keep clear of damaged power lines. If
        you are not equipped for roof work, call a licensed roofer.
      </Callout>

      <H2 id="material">Thickness and construction</H2>
      <P>
        Use a woven, UV-treated poly tarp of at least 12 mil for storm cover. A 16-mil tarp is worth the extra weight if
        the permanent repair could be weeks away, which is common after a major storm when every crew in the area is
        booked. Light 5–6 mil tarps tear at the grommets in the first strong gust and are not worth the labor to
        install. For more on weights, see <A href="/resources/tarp-mil-thickness-explained">tarp mil thickness explained</A>.
      </P>
      <UL>
        <li><strong>Rope-reinforced hems and reinforced corners</strong> keep grommets from pulling out.</li>
        <li><strong>UV treatment</strong> matters because roofs get full sun.</li>
        <li><strong>Color</strong> is mostly preference. Blue is traditional, and silver/white reflects heat off the attic.</li>
      </UL>

      <H2 id="size">Sizing a roof tarp</H2>
      <P>
        Measure the damaged area, then add enough to shed water properly. Water runs down the slope, so the critical
        edge is the top one: if water can get under the upper edge, the tarp channels it straight into the hole.
      </P>
      <UL>
        <li>
          <strong>Top:</strong> carry the tarp over the ridge and roughly 3–4 ft down the other side, so the upper edge
          is fastened on the opposite slope.
        </li>
        <li><strong>Sides:</strong> extend at least 3–4 ft past the damage on each side.</li>
        <li><strong>Bottom:</strong> run it to the eave or just past it so water drains off the roof, not under the tarp.</li>
        <li><strong>Wrap allowance:</strong> add about 1 ft on each fastened edge to roll around a batten board.</li>
      </UL>
      <P>
        Remember that tarps are sold by nominal (cut) size and the finished size after hemming typically runs about
        3–5% smaller, so a 20&times;30 finishes closer to 19&times;29. The{' '}
        <A href="/resources/tarp-size-calculator">tarp size calculator</A> accounts for that.
      </P>
      <Table
        caption="Typical roof tarp sizes by damage area"
        head={['Damage area', 'Typical tarp size', 'Notes']}
        rows={[
          ['A few missing shingles', '12×16 or 16×20', 'Small patch near the eave or a valley'],
          ['One section of a slope', '20×30', 'The most common storm size'],
          ['Large area or ridge to eave', '30×40', 'Two people minimum to handle'],
          ['Most of a slope', '40×60 or overlapping tarps', 'Overlap upper over lower by 2–3 ft, like shingles'],
        ]}
      />

      <H2 id="install">Fastening it so it stays</H2>
      <P>
        Grommets alone are not enough on a roof. Wind gets under the edge, the tarp starts flapping, and it tears out
        grommet by grommet. The standard approach is to clamp the edges with lumber:
      </P>
      <OL>
        <li>Clear loose debris and nails so nothing punctures the tarp from below.</li>
        <li>
          Lay the tarp over the ridge and roll the top edge around a 2&times;4 two or three times. Fasten the board
          through the deck into the framing on the far slope with long screws or cap nails.
        </li>
        <li>Pull the tarp taut down the slope and batten the bottom and side edges the same way.</li>
        <li>Add a second board on top of each wrapped board (a &quot;sandwich&quot;) on high-wind exposures.</li>
        <li>Check that no edge can catch wind, and that water sheds off the tarp, not under it.</li>
      </OL>
      <P>
        Every fastener makes a hole, so keep them in the battens and note where they are for the permanent repair.
        Sandbags can hold a tarp on a low-slope roof for a short time, but they slide on pitched roofs and should not
        be the only restraint.
      </P>

      <H2 id="insurance">Documentation and insurance</H2>
      <P>
        Before covering the damage, take photos of it from the ground and the roof. Keep receipts for tarps, lumber and
        labor. Many property policies expect the owner to take reasonable steps to prevent further damage, and
        temporary repair costs are often part of the claim. Policies differ, so check yours or ask the adjuster.
      </P>
      <P>
        A tarp is a temporary measure. Inspect it after every windy day and plan the permanent repair as soon as you can.
      </P>

      <H2 id="stocking">What roofers should stock</H2>
      <P>
        Storm work is a volume business with no warning. Crews that keep a pallet of 20&times;30 and 30&times;40 tarps
        in 12–16 mil on hand before hail season can start tarping the day after a storm while others wait on
        back-ordered stock. Buying by the pallet also brings the per-tarp price down. Read{' '}
        <A href="/resources/buying-tarps-wholesale">how wholesale ordering works</A>, then{' '}
        <A href="/apply">open a wholesale account</A> or browse <A href="/products?job=roofing">roofing tarps</A>.
      </P>
    </>
  ),
}
