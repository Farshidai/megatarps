// REVIEW: Farshid must confirm. Standard B2B returns wording; the return window,
// restocking fee and refund timing are placeholders until you confirm them.
import type { Metadata } from 'next'
import Link from 'next/link'
import { PolicyPage, Placeholder } from '@/components/seo/PolicyPage'
import { site, mailHref } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Returns Policy',
  description:
    'MegaTarps returns policy for parcel and pallet orders: what can be returned, how to get a return authorization, damaged or wrong items, and refunds.',
  alternates: { canonical: '/returns' },
}

export default function ReturnsPage() {
  return (
    <PolicyPage
      title="Returns Policy"
      path="/returns"
      updated="October 25, 2026"
      intro={
        <p>
          If something is wrong with your order, contact us first. Most problems are solved fastest by phone at{' '}
          {site.phoneDisplay} or by email at <a href={mailHref('Return request')}>{site.email}</a>.
        </p>
      }
    >
      <section>
        <h2>Damaged, defective or wrong items</h2>
        <p>
          If an item arrives damaged or defective, or we shipped the wrong item or quantity, report it within{' '}
          <Placeholder>5 business days of delivery</Placeholder> with your order number and photos. We will replace the
          item or issue a refund or credit, and we cover the return freight. For freight damage, please also follow the
          inspection steps in our <Link href="/shipping">Shipping &amp; Freight Policy</Link>.
        </p>
      </section>

      <section>
        <h2>Returning items you no longer need</h2>
        <ul>
          <li>
            Unused items in their original, unopened packaging can be returned within{' '}
            <Placeholder>30 days of delivery</Placeholder>.
          </li>
          <li>You need a return authorization (RA) number from us before sending anything back. Returns without an RA may be refused.</li>
          <li>The buyer pays return shipping unless the return is due to our error.</li>
          <li>
            Restocking fee: <Placeholder>whether a restocking fee applies, and how much, for case and pallet returns</Placeholder>
          </li>
        </ul>
      </section>

      <section>
        <h2>Items that cannot be returned</h2>
        <ul>
          <li>Tarps that have been opened, used, cut, written on or exposed to weather.</li>
          <li>Custom-size, special-order and quote-only pallet orders, unless defective or shipped in error.</li>
          <li>Clearance items marked final sale.</li>
        </ul>
      </section>

      <section>
        <h2>Refunds</h2>
        <p>
          Once we receive and inspect the return, we refund the original payment method or, for net-terms accounts, credit
          the account, within <Placeholder>5–10 business days</Placeholder>. Original shipping and freight charges are not
          refunded unless the return is due to our error.
        </p>
      </section>

      <section>
        <h2>Warranty claims</h2>
        <p>
          Warranty coverage, if any, is described in our <Link href="/terms">Terms of Sale</Link>.
        </p>
      </section>
    </PolicyPage>
  )
}
