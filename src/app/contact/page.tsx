import { Phone, Mail, Clock, MapPin } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with MegaTarps for bulk pricing, custom orders, or product questions.',
}

interface PageProps {
  searchParams: Promise<{ sent?: string; error?: string }>
}

export default async function ContactPage({ searchParams }: PageProps) {
  const { sent, error } = await searchParams

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-black text-slate-900 mb-3">Contact Us</h1>
      <p className="text-slate-600 mb-6">We&apos;re here to help with product questions, bulk pricing, and custom orders.</p>

      {sent && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-sm">
          <strong>Message sent!</strong> We&apos;ll get back to you within 4 business hours.
        </div>
      )}
      {error === 'missing' && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          Please fill in all required fields.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* Contact info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Phone</p>
                <a href="tel:+18000000000" className="text-orange-600 hover:underline">(800) 000-0000</a>
                <p className="text-xs text-slate-400 mt-0.5">Mon–Fri, 8am–5pm CT</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Email</p>
                <a href="mailto:orders@megatarps.com" className="text-orange-600 hover:underline">orders@megatarps.com</a>
                <p className="text-xs text-slate-400 mt-0.5">Replies within 4 business hours</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Business Hours</p>
                <p className="text-slate-600 text-sm">Monday – Friday</p>
                <p className="text-slate-600 text-sm">8:00 AM – 5:00 PM Central</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Ships From</p>
                <p className="text-slate-600 text-sm">Nationwide warehouses</p>
                <p className="text-slate-600 text-sm">Drop-shipped to your door</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl border border-orange-100 p-5">
            <p className="font-bold text-orange-800 mb-1">Need bulk pricing?</p>
            <p className="text-sm text-orange-700 mb-3">For orders of 5+ units, use our bulk quote form — we respond within 4 business hours with custom wholesale pricing.</p>
            <a href="/bulk-quote"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors">
              Request Bulk Quote →
            </a>
          </div>
        </div>

        {/* Contact form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-4">Send a Message</h2>
          <form action="/api/contact" method="POST" className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Name *</label>
              <input required name="name"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                placeholder="John Smith" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
              <input required type="email" name="email"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                placeholder="john@company.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Subject</label>
              <select name="subject"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 bg-white">
                <option value="general">General Question</option>
                <option value="order">Order Status</option>
                <option value="product">Product Question</option>
                <option value="return">Return / Warranty</option>
                <option value="bulk">Bulk Pricing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Message *</label>
              <textarea required name="message" rows={5}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 resize-none"
                placeholder="How can we help?" />
            </div>
            <button type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
