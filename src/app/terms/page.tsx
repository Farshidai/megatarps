// REVIEW: Farshid must confirm. This is standard B2B wording, not legal advice.
// Have it reviewed by a Missouri business attorney before launch. Every
// <Placeholder> renders as a highlighted "[To be confirmed: …]" on the page.
import type { Metadata } from 'next'
import Link from 'next/link'
import { PolicyPage, Placeholder } from '@/components/seo/PolicyPage'
import { site, mailHref } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Terms of Sale & Website Terms',
  description: `Terms of sale for ${site.name} wholesale and online orders: accounts, pricing, payment, net terms, sales tax, shipping, returns and liability.`,
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms of Sale & Website Terms"
      path="/terms"
      updated="October 25, 2026"
      intro={
        <p>
          MegaTarps.com is operated by {site.legalName} (&quot;{site.name}&quot;, &quot;we&quot;, &quot;us&quot;). These
          terms apply to every order placed online, by quote, by phone or by email, and to use of this website. By placing
          an order or using the site you agree to them. A signed quote or written agreement with different terms controls
          where it conflicts with these terms.
        </p>
      }
    >
      <section>
        <h2>1. Accounts and wholesale eligibility</h2>
        <p>
          Anyone can buy online. Wholesale accounts, with account pricing, tax-exempt purchasing and net terms, are for
          businesses and organizations and are approved at our discretion. You are responsible for keeping your login
          secure and your company, tax and shipping information accurate. We may suspend an account for non-payment,
          misuse or false information.
        </p>
      </section>

      <section>
        <h2>2. Pricing and quotes</h2>
        <p>
          Prices are in US dollars and exclude sales tax and freight unless stated. Volume (tier) pricing is applied by
          quantity per product, and account pricing applies when you are signed in to an approved account. Prices can
          change without notice, but an accepted order keeps its price. Written quotes are valid for the period stated
          on the quote, or <Placeholder>30 days</Placeholder> if none is stated. We will correct obvious pricing or
          listing errors and may cancel an affected order with a full refund.
        </p>
      </section>

      <section>
        <h2>3. Orders and acceptance</h2>
        <p>
          Your order is an offer to buy. It is accepted when we confirm it in writing or ship it. We may decline or cancel
          an order, in whole or in part, for stock, credit, export or error reasons; if we cancel, we refund anything you
          paid for the cancelled items.
        </p>
      </section>

      <section>
        <h2>4. Payment and net terms</h2>
        <p>
          Online card payments are processed by Stripe; we do not see or store full card numbers. Net terms are available
          only to approved accounts after a credit review, up to the credit limit we set. Invoices are due by the date on
          the invoice. We may place past-due accounts on hold, require prepayment, and charge{' '}
          <Placeholder>late fee / interest on past-due balances, if any</Placeholder>.
        </p>
      </section>

      <section>
        <h2>5. Sales tax and exemption certificates</h2>
        <p>
          We collect sales tax where required by law. To buy tax-exempt, provide a valid resale or exemption certificate
          for the ship-to state before ordering. You are responsible for the validity of the certificate and for any tax
          due if an exemption is later disallowed.
        </p>
      </section>

      <section>
        <h2>6. Shipping, title and risk of loss</h2>
        <p>
          Shipping methods, freight charges, delivery and inspection are covered in our{' '}
          <Link href="/shipping">Shipping &amp; Freight Policy</Link>. Delivery dates are estimates and are not
          guaranteed. Title and risk of loss pass to you <Placeholder>on delivery to your ship-to address</Placeholder>.
        </p>
      </section>

      <section>
        <h2>7. Product information and suitability</h2>
        <p>
          We describe products as accurately as we can. Mil thickness, weight and weave are nominal manufacturer values,
          finished tarp sizes typically run about 3–5% smaller than the labeled cut size, and colors may vary between
          production runs. You are responsible for choosing a product suitable for your use and for installing and
          securing it safely. Tarps are not fall protection and are not fireproof; fire-retardant tarps resist ignition
          but can still burn.
        </p>
      </section>

      <section>
        <h2>8. Warranty</h2>
        <p>
          <Placeholder>
            warranty terms. State whether any manufacturer or MegaTarps warranty applies, for how long and what it
            covers. Until confirmed, no express warranty is offered beyond what is required by law.
          </Placeholder>
        </p>
        <p>
          Items that arrive damaged, defective or wrong are handled under our <Link href="/returns">Returns Policy</Link>.
        </p>
      </section>

      <section>
        <h2>9. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, {site.name} is not liable for indirect, incidental, special or
          consequential damages, including lost profits, delay or damage to property covered by a tarp. Our total
          liability for any claim relating to an order is limited to the amount you paid for the products involved.
        </p>
      </section>

      <section>
        <h2>10. Website use and content</h2>
        <p>
          Site content, including guides, photos and the size calculator, is provided for general information and is owned
          by or licensed to {site.legalName}. Calculator results are estimates; verify measurements before ordering. Do not
          copy or republish our content without permission, scrape the site, or interfere with its operation.
        </p>
      </section>

      <section>
        <h2>11. Governing law</h2>
        <p>
          These terms are governed by the laws of the State of <Placeholder>Missouri</Placeholder>, without regard to
          conflict-of-law rules. Disputes will be heard in the state or federal courts located in{' '}
          <Placeholder>Jackson County, Missouri</Placeholder>.
        </p>
      </section>

      <section>
        <h2>12. Changes and contact</h2>
        <p>
          We may update these terms; the version in effect when you place an order applies to that order. Questions:{' '}
          <a href={mailHref('Terms question')}>{site.email}</a> or {site.phoneDisplay}.
        </p>
      </section>
    </PolicyPage>
  )
}
