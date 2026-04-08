import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'MegaTarps Privacy Policy.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-black text-slate-900 mb-2">Privacy Policy</h1>
      <p className="text-slate-400 text-sm mb-8">Last updated: January 1, 2025</p>

      <div className="space-y-8 text-slate-600 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-slate-900">Information We Collect</h2>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Contact information:</strong> Name, email, phone, company — when you submit a quote request or create an account.</li>
            <li><strong>Order data:</strong> Shipping address and payment information — processed securely via Stripe (we never store card numbers).</li>
            <li><strong>Usage data:</strong> Pages visited, time on site — via PostHog analytics (anonymous).</li>
            <li><strong>Chat sessions:</strong> Messages you send to our AI assistant — used to improve responses.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">How We Use Your Information</h2>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Process and fulfill orders and quote requests</li>
            <li>Send order confirmations and quote responses via email (Resend)</li>
            <li>Improve our product recommendations and site experience</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p className="mt-3">We do not sell your personal information to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">Third-Party Services</h2>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Stripe:</strong> Payment processing. <a href="https://stripe.com/privacy" className="text-orange-600 hover:underline" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a></li>
            <li><strong>Supabase:</strong> Database and authentication. Data stored in US region.</li>
            <li><strong>Resend:</strong> Transactional email delivery.</li>
            <li><strong>Anthropic (Claude):</strong> AI chat assistant. Messages are processed per <a href="https://www.anthropic.com/privacy" className="text-orange-600 hover:underline" target="_blank" rel="noopener noreferrer">Anthropic&apos;s policy</a>.</li>
            <li><strong>PostHog:</strong> Anonymous usage analytics.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">Data Retention</h2>
          <p>Order and quote records are retained for 7 years for accounting purposes. Account data is retained until you request deletion. Contact us to delete your account data.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">Cookies</h2>
          <p>We use essential cookies for authentication. We do not use tracking cookies or advertising cookies.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data by emailing <a href="mailto:orders@megatarps.com" className="text-orange-600 hover:underline">orders@megatarps.com</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">Contact</h2>
          <p>Privacy questions: <a href="mailto:orders@megatarps.com" className="text-orange-600 hover:underline">orders@megatarps.com</a></p>
        </section>
      </div>
    </div>
  )
}
