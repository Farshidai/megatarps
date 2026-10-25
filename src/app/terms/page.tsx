import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'MegaTarps Terms of Service.',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose prose-slate max-w-none">
      <h1 className="text-3xl font-black text-slate-900 mb-2">Terms of Service</h1>
      <p className="text-slate-400 text-sm mb-8">Last updated: January 1, 2025</p>

      <div className="space-y-8 text-slate-600 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>By accessing or using MegaTarps.com ("Site"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Site.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">2. Products & Orders</h2>
          <p>All orders are subject to availability and acceptance. Prices are listed in USD and may change without notice. We reserve the right to refuse or cancel any order at our discretion.</p>
          <p className="mt-2">Retail orders (1–4 units) are processed via Stripe. Bulk orders (5+ units) require a quote request and are subject to review before pricing is provided.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">3. Shipping</h2>
          <p>We ship to the contiguous United States. Shipping is calculated at checkout. Delivery estimates are not guaranteed. We are not responsible for carrier delays.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">4. Returns & Refunds</h2>
          <p>Unused items in original packaging may be returned within 30 days of delivery for a refund minus shipping. Custom or bulk pallet orders are final sale unless defective. Contact mfirooz@megatarps.com to initiate a return.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">5. Limitation of Liability</h2>
          <p>MegaTarps is not liable for any indirect, incidental, or consequential damages arising from product use. Our tarps are described accurately to the best of our knowledge; verify specifications for safety-critical applications.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">6. Intellectual Property</h2>
          <p>All content on this Site is owned by or licensed to MegaTarps. You may not reproduce, copy, or redistribute our content without written permission.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">7. Contact</h2>
          <p>Questions about these terms? Email <a href="mailto:mfirooz@megatarps.com" className="text-orange-600 hover:underline">mfirooz@megatarps.com</a>.</p>
        </section>
      </div>
    </div>
  )
}
