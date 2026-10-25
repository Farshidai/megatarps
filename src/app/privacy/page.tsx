// REVIEW: Farshid must confirm. Reflects what the code does today (Stripe, Supabase,
// Resend, Anthropic chat, newsletter, no third-party analytics). Update it if you add
// analytics, ad pixels or a new vendor. Not legal advice.
import type { Metadata } from 'next'
import { PolicyPage, Placeholder } from '@/components/seo/PolicyPage'
import { site, mailHref } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${site.name} (${site.legalName}) collects, uses and protects information from customers and website visitors.`,
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      path="/privacy"
      updated="October 25, 2026"
      intro={
        <p>
          This policy explains what information {site.legalName} (&quot;{site.name}&quot;) collects through MegaTarps.com
          and how we use it. We do not sell personal information.
        </p>
      }
    >
      <section>
        <h2>Information we collect</h2>
        <ul>
          <li><strong>Account and application details:</strong> name, company, email, phone, business type, addresses and tax-exemption certificates you provide.</li>
          <li><strong>Orders and quotes:</strong> products, quantities, shipping and jobsite addresses, and delivery notes.</li>
          <li><strong>Payments:</strong> processed by Stripe. We receive the payment status and the card brand and last four digits, never the full card number.</li>
          <li><strong>Newsletter:</strong> your email address and where you signed up.</li>
          <li><strong>Messages:</strong> contact forms, emails and chat-assistant conversations.</li>
          <li><strong>Technical data:</strong> standard server logs (IP address, browser, pages requested) kept for security and troubleshooting.</li>
        </ul>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To process orders, quotes, freight and returns, and to review wholesale and credit applications.</li>
          <li>To apply tax exemptions and keep the records tax law requires.</li>
          <li>To answer your questions and send order, quote and account emails.</li>
          <li>To send the newsletter if you subscribed. Every newsletter has an unsubscribe link.</li>
          <li>To secure the site and prevent fraud.</li>
        </ul>
      </section>

      <section>
        <h2>Who we share it with</h2>
        <p>Only service providers who need it to run the business, under their own privacy terms:</p>
        <ul>
          <li><strong>Stripe</strong> for payments.</li>
          <li><strong>Supabase</strong> for our database and account login.</li>
          <li><strong>Resend</strong> for sending email.</li>
          <li><strong>Anthropic</strong> to power the chat assistant. Please don&apos;t enter sensitive personal information in chat.</li>
          <li><strong>Freight and parcel carriers</strong>, which receive delivery names, addresses and phone numbers.</li>
          <li>Accountants, lawyers or authorities when required by law.</li>
        </ul>
      </section>

      <section>
        <h2>Cookies and analytics</h2>
        <p>
          We use essential cookies to keep you signed in and to remember your cart. We do not currently use advertising
          cookies or third-party analytics. If that changes, we will update this policy first.
        </p>
      </section>

      <section>
        <h2>Retention</h2>
        <p>
          Order, invoice and tax-exemption records are kept as long as tax and accounting rules require (
          <Placeholder>retention period, e.g. 7 years</Placeholder>). Newsletter addresses are kept until you unsubscribe.
          Other account data is kept while your account is active, or until you ask us to delete it.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You can ask to see, correct or delete your personal information, or unsubscribe from email, by contacting{' '}
          <a href={mailHref('Privacy request')}>{site.email}</a>. We may keep records we are legally required to keep.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>This site is for business buyers and is not directed to children under 13.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          {site.legalName} · {site.baseLocation} · <a href={mailHref('Privacy question')}>{site.email}</a> · {site.phoneDisplay}
        </p>
      </section>
    </PolicyPage>
  )
}
