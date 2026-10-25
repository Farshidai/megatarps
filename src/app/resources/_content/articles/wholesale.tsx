import type { Article } from '../types'
import { H2, P, UL, OL, A, Table, Callout } from '../prose'

export const wholesale: Article = {
  slug: 'buying-tarps-wholesale',
  title: 'Buying Tarps Wholesale: Cases, Pallets and LTL Freight',
  shortTitle: 'Buying wholesale & LTL',
  metaTitle: 'Buying Tarps Wholesale: Cases, Pallets & LTL Freight',
  description:
    'How wholesale tarp buying works: case and pallet pricing, tax-exempt purchasing, net terms, and what to know about LTL freight, liftgates and jobsite delivery.',
  excerpt:
    'Buying by the case or pallet lowers your cost per tarp, but freight can eat the savings if you do not plan for it. Here is how wholesale pricing, LTL shipping and receiving a pallet actually work.',
  topic: 'Wholesale',
  published: '2026-10-25',
  updated: '2026-10-25',
  readingMinutes: 7,
  toc: [
    { id: 'units', label: 'Each, case or pallet' },
    { id: 'account', label: 'Wholesale accounts, tax exemption and terms' },
    { id: 'ltl', label: 'How LTL freight works' },
    { id: 'accessorials', label: 'Liftgates and other extra charges' },
    { id: 'receiving', label: 'Receiving a pallet' },
    { id: 'seasons', label: 'Lead times and seasonal demand' },
    { id: 'planning', label: 'Planning tips' },
  ],
  shop: [
    { label: 'Open a wholesale account', href: '/apply', note: 'Tier pricing, tax-exempt, net terms' },
    { label: 'Request a pallet quote', href: '/bulk-quote' },
    { label: 'Shipping & freight policy', href: '/shipping' },
    { label: 'All tarps', href: '/products' },
  ],
  related: ['tarp-mil-thickness-explained', 'roofing-tarp-for-storm-damage', 'how-to-size-a-tarp'],
  body: () => (
    <>
      <P>
        If your company goes through more than a few tarps a month, buying them one at a time from a hardware store is
        the most expensive way to get them. Wholesale buying lowers the unit price, but it brings freight, receiving
        and paperwork with it. This guide walks through how it works so there are no surprises when the truck shows up.
      </P>

      <H2 id="units">Each, case or pallet</H2>
      <Table
        caption="Order units compared"
        head={['Unit', 'Typical buyer', 'How it ships', 'Pricing']}
        rows={[
          ['Each', 'Small jobs, trying a new size', 'Parcel (UPS/FedEx)', 'Standard price'],
          ['Case / multi-pack', 'Crews restocking trucks', 'Parcel or LTL', 'Tier pricing by quantity'],
          ['Half or full pallet', 'Contractors, farms, resellers', 'LTL freight', 'Best unit price; larger pallets quoted'],
        ]}
      />
      <P>
        Pricing steps down as quantity goes up, and the price breaks are shown on each product page. Some pallet-only
        items are quote-only because freight and stock vary; for those, <A href="/bulk-quote">request a quote</A> and we
        will price the product and freight together.
      </P>

      <H2 id="account">Wholesale accounts, tax exemption and terms</H2>
      <UL>
        <li>
          <strong>Wholesale account.</strong> <A href="/apply">Apply</A> with your business details. Once approved,
          your account pricing applies automatically when you are signed in.
        </li>
        <li>
          <strong>Tax-exempt purchasing.</strong> Resellers and exempt organizations can buy without sales tax by
          providing a valid resale or exemption certificate for the ship-to state. Without a certificate on file, sales
          tax is charged where required.
        </li>
        <li>
          <strong>Net terms.</strong> Qualified buyers can be approved for invoice terms after a credit review. Card
          payment through secure Stripe checkout is always available.
        </li>
      </UL>

      <H2 id="ltl">How LTL freight works</H2>
      <P>
        LTL (less-than-truckload) carriers combine pallets from many shippers on one trailer and move them through a
        network of terminals. It is the standard way to ship one to several pallets, generally anything over about 150
        lb. The freight cost depends on:
      </P>
      <UL>
        <li><strong>Weight and dimensions</strong> of the pallet. Standard US pallets are 48&times;40 in.</li>
        <li><strong>Freight class,</strong> a rating under the NMFC system based mainly on density and handling. Dense, well-stacked tarps ship efficiently.</li>
        <li><strong>Distance</strong> and the lanes the carrier serves.</li>
        <li><strong>Accessorial services</strong> at pickup or delivery (below).</li>
      </UL>
      <P>
        From the Kansas City area, most Midwest destinations are short LTL lanes. Transit times vary by carrier and
        destination; see the <A href="/shipping">shipping and freight policy</A> for how we quote and ship.
      </P>

      <H2 id="accessorials">Liftgates and other extra charges</H2>
      <P>
        Most surprise freight bills come from accessorial charges that were not on the original quote. Tell us about
        your delivery site up front so the quote is accurate:
      </P>
      <UL>
        <li><strong>Liftgate:</strong> needed if there is no loading dock or forklift to unload.</li>
        <li><strong>Limited access:</strong> carriers often classify jobsites, farms, schools and churches as limited-access locations.</li>
        <li><strong>Residential delivery:</strong> applies to homes and home-based businesses.</li>
        <li><strong>Appointment or call-ahead:</strong> if someone has to be there to receive.</li>
        <li><strong>Redelivery:</strong> charged if nobody is there to take the freight.</li>
      </UL>
      <Callout title="Cheapest option">
        Delivering to a business address with a dock or forklift, during business hours, is almost always the lowest
        freight cost. Many contractors ship to the yard and move tarps to jobsites on their own trucks.
      </Callout>

      <H2 id="receiving">Receiving a pallet</H2>
      <OL>
        <li>Count the pallets against the delivery receipt before the driver leaves.</li>
        <li>Check the wrap for tears, crushed corners, forklift punctures and wet spots.</li>
        <li>
          Write any damage or shortage on the delivery receipt, specifically (&quot;1 pallet, corner crushed&quot;), then
          sign. A clean signature makes a freight claim much harder.
        </li>
        <li>Take photos, and report problems to us quickly as described in our <A href="/returns">returns policy</A>.</li>
      </OL>

      <H2 id="seasons">Lead times and seasonal demand</H2>
      <P>
        Tarp demand is seasonal and spikes without warning. Roofing tarps sell out after hail and windstorms, enclosure
        and cold-weather tarps move fast before the first hard freeze, and farm covers peak around haying and harvest.
        Imported stock is replenished in container loads, so a size that sells out in a storm week can take weeks to
        come back. The contractors who are never caught short keep a working stock of their core sizes and place their
        seasonal pallet orders a month or two ahead of the rush, when stock and freight capacity are easy to get.
      </P>

      <H2 id="planning">Planning tips</H2>
      <UL>
        <li>Standardize on a few sizes and weights so every order is a repeat order. The <A href="/resources/tarp-size-calculator">size calculator</A> helps.</li>
        <li>Order seasonal stock early: roofing tarps before hail season, enclosure tarps before the first freeze.</li>
        <li>If you need several sizes, ask whether they can ship together to save on freight.</li>
        <li>Keep your resale or exemption certificate current so invoices come out right the first time.</li>
      </UL>
      <P>
        Ready to set up? <A href="/apply">Open a wholesale account</A> or <A href="/products">browse tarps</A>.
      </P>
    </>
  ),
}
