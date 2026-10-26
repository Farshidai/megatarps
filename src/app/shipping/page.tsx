// REVIEW: Farshid must confirm. Standard B2B shipping/freight wording; check every
// <Placeholder> (processing time, pickup, claim window) against how you actually ship.
import { SHIP_WITHIN, DAMAGE_REPORT_WINDOW } from '@/lib/site'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PolicyPage, Placeholder } from '@/components/seo/PolicyPage'
import { site, mailHref } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Shipping & Freight Policy',
  description:
    'How MegaTarps ships: parcel for small orders, LTL freight for cases and pallets, liftgate and jobsite delivery, transit estimates, and how to inspect and report freight damage.',
  alternates: { canonical: '/shipping' },
}

export default function ShippingPage() {
  return (
    <PolicyPage
      title="Shipping & Freight Policy"
      path="/shipping"
      updated="October 25, 2026"
      intro={
        <p>
          We ship from the {site.baseLocation}. Small orders go by parcel carrier; cases and pallets go by LTL freight. For
          background on freight classes, liftgates and receiving, see our guide{' '}
          <Link href="/resources/buying-tarps-wholesale">Buying tarps wholesale: cases, pallets and LTL freight</Link>.
        </p>
      }
    >
      <section>
        <h2>Where we ship</h2>
        <ul>
          <li>Parcel orders: the contiguous United States.</li>
          <li>LTL freight: {site.serviceAreaSummary}.</li>
          <li>Alaska, Hawaii, US territories and international destinations: by quote only.</li>
        </ul>
      </section>

      <section>
        <h2>Order processing</h2>
        <p>
          In-stock orders placed on business days usually leave our facility within{' '}
          <Placeholder>{SHIP_WITHIN}</Placeholder>. Pallet and quote orders ship on the date confirmed with your order.
          We will tell you promptly if an item is back-ordered.
        </p>
      </section>

      <section>
        <h2>Parcel shipping</h2>
        <p>
          Smaller orders ship by UPS, FedEx or USPS at the rate shown at checkout. Tracking is emailed when the order
          ships. Delivery dates from carriers are estimates, not guarantees.
        </p>
      </section>

      <section>
        <h2>LTL freight (cases and pallets)</h2>
        <p>
          Pallet orders ship on standard 48&times;40 pallets by LTL carrier. Freight is quoted to your delivery ZIP code
          and site conditions, either at checkout or on your written quote. To keep the quote accurate, tell us before
          shipping if your delivery needs any of the following, since carriers charge extra for them:
        </p>
        <ul>
          <li>Liftgate (no loading dock or forklift)</li>
          <li>Residential or limited-access delivery (jobsites, farms, schools, churches, storage units)</li>
          <li>Delivery appointment or call-ahead</li>
          <li>Inside delivery</li>
        </ul>
        <p>
          Carrier charges that result from site information not given at the time of the quote, such as a liftgate,
          redelivery or storage fee, are billed to the buyer. LTL drivers deliver to the back of the trailer; unloading and
          moving freight on site is the receiver&apos;s responsibility.
        </p>
      </section>

      <section>
        <h2>Local pickup</h2>
        <p>
          <Placeholder>whether will-call / local pickup in the Kansas City area is offered, and how to schedule it</Placeholder>
        </p>
      </section>

      <section>
        <h2>Inspecting your delivery</h2>
        <p>Please inspect every delivery before the driver leaves:</p>
        <ul>
          <li>Count the pallets or cartons against the delivery receipt.</li>
          <li>Look for torn wrap, crushed corners, forklift punctures and water damage.</li>
          <li>
            Write any shortage or damage on the delivery receipt in specific terms (for example, &quot;1 pallet, wrap torn,
            corner crushed&quot;) before signing, and take photos.
          </li>
        </ul>
        <p>
          Report shortages, visible damage and concealed damage found after unpacking within{' '}
          <Placeholder>{DAMAGE_REPORT_WINDOW}</Placeholder> to <a href={mailHref('Freight damage report')}>{site.email}</a>{' '}
          with your order number and photos. We will file the carrier claim and arrange a replacement or credit. Freight
          signed for as clean, or reported late, may not be recoverable from the carrier.
        </p>
      </section>

      <section>
        <h2>Tax-exempt and wholesale orders</h2>
        <p>
          Sales tax is based on the ship-to address. Wholesale customers with a valid exemption certificate on file are
          not charged sales tax. <Link href="/apply">Apply for a wholesale account</Link> to set this up.
        </p>
      </section>

      <section>
        <h2>Questions</h2>
        <p>
          Call {site.phoneDisplay} ({site.hours}) or email <a href={mailHref('Shipping question')}>{site.email}</a>. See
          also our <Link href="/returns">Returns Policy</Link> and <Link href="/terms">Terms of Sale</Link>.
        </p>
      </section>
    </PolicyPage>
  )
}
