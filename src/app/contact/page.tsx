import Link from 'next/link'
import { Phone, Mail, Clock, MapPin, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import { site, telHref, mailHref } from '@/lib/site'
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'Contact MegaTarps',
  description: `Call ${site.phoneDisplay} or email ${site.name} for wholesale tarp pricing, pallet quotes, freight and product questions. ${site.hours}.`,
  alternates: { canonical: '/contact' },
}

interface PageProps {
  searchParams: Promise<{ sent?: string; error?: string }>
}

const field = 'w-full ring-1 ring-slate-300 rounded-lg px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white'

export default async function ContactPage({ searchParams }: PageProps) {
  const { sent, error } = await searchParams

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }])} />
      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">Talk to a tarp supplier</h1>
      <p className="text-slate-600 mb-8 max-w-2xl">
        Pricing, pallet quotes, freight to your site, or which mil and size fits the job. Call during business hours or send
        a message. {site.responseTime}
      </p>

      {sent && (
        <div role="status" className="mb-6 bg-green-50 ring-1 ring-green-200 text-green-800 rounded-xl p-4 text-sm">
          <strong>Message sent.</strong> {site.responseTime}
        </div>
      )}
      {error === 'missing' && (
        <div role="alert" className="mb-6 bg-red-50 ring-1 ring-red-200 text-red-700 rounded-xl p-4 text-sm">
          Please fill in all required fields.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <ul className="rounded-2xl ring-1 ring-slate-200 p-6 space-y-5">
            <li className="flex gap-4">
              <span className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0"><Phone className="w-5 h-5 text-orange-500" aria-hidden="true" /></span>
              <span>
                <span className="block font-bold text-slate-900">Phone</span>
                <a href={telHref()} className="text-orange-700 font-semibold hover:underline">{site.phoneDisplay}</a>
              </span>
            </li>
            <li className="flex gap-4">
              <span className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0"><Mail className="w-5 h-5 text-orange-500" aria-hidden="true" /></span>
              <span>
                <span className="block font-bold text-slate-900">Email</span>
                <a href={mailHref()} className="text-orange-700 font-semibold hover:underline break-all">{site.email}</a>
              </span>
            </li>
            <li className="flex gap-4">
              <span className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5 text-orange-500" aria-hidden="true" /></span>
              <span>
                <span className="block font-bold text-slate-900">Hours</span>
                <span className="text-slate-600 text-sm">{site.hours}</span>
              </span>
            </li>
            <li className="flex gap-4">
              <span className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-orange-500" aria-hidden="true" /></span>
              <span>
                <span className="block font-bold text-slate-900">Based in</span>
                <span className="text-slate-600 text-sm">{site.baseLocation}. Serving the {site.serviceAreaSummary.replace('Kansas City metro and the ', '')}.</span>
              </span>
            </li>
          </ul>

          <div className="bg-orange-50 rounded-2xl ring-1 ring-orange-200 p-5">
            <p className="font-bold text-orange-900 mb-1">Ordering by the case or pallet?</p>
            <p className="text-sm text-orange-900/80 mb-4">
              Open a wholesale account for tier pricing, or send a pallet quote with sizes and your delivery ZIP.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/apply" className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors">
                Wholesale account <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link href="/bulk-quote" className="inline-flex items-center ring-1 ring-orange-300 hover:ring-orange-500 text-orange-900 font-bold text-sm px-4 py-2 rounded-lg transition-colors">
                Pallet quote
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-2xl ring-1 ring-slate-200 p-6">
          <h2 className="font-black text-slate-900 text-lg mb-4">Send a message</h2>
          <form action="/api/contact" method="POST" className="space-y-4">
            <div>
              <label htmlFor="c-name" className="block text-sm font-semibold text-slate-700 mb-1">Name <span aria-hidden="true">*</span></label>
              <input id="c-name" required name="name" autoComplete="name" className={field} />
            </div>
            <div>
              <label htmlFor="c-email" className="block text-sm font-semibold text-slate-700 mb-1">Email <span aria-hidden="true">*</span></label>
              <input id="c-email" required type="email" name="email" autoComplete="email" className={field} />
            </div>
            <div>
              <label htmlFor="c-subject" className="block text-sm font-semibold text-slate-700 mb-1">Topic</label>
              <select id="c-subject" name="subject" className={field}>
                <option value="bulk">Wholesale / pallet pricing</option>
                <option value="product">Which tarp do I need?</option>
                <option value="order">Order or delivery status</option>
                <option value="return">Return or damage</option>
                <option value="general">Something else</option>
              </select>
            </div>
            <div>
              <label htmlFor="c-message" className="block text-sm font-semibold text-slate-700 mb-1">Message <span aria-hidden="true">*</span></label>
              <textarea id="c-message" required name="message" rows={5} className={`${field} resize-none`} placeholder="Sizes, quantities, delivery ZIP, timeline…" />
            </div>
            <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
              Send message
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
