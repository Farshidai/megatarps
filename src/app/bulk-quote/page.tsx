import { Suspense } from 'react'
import { BulkQuoteForm } from '@/components/forms/BulkQuoteForm'
import { Clock, Shield, Phone } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Request Bulk Tarp Pricing',
  description: 'Get wholesale pricing on bulk tarp orders (5+ units). We respond within 4 business hours.',
}

export default function BulkQuotePage() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-3">Request Bulk Pricing</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Ordering 5 or more units? Get wholesale pricing. We respond within 4 business hours.
          </p>
        </div>

        {/* Trust bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: <Clock className="w-5 h-5 text-orange-500" />, title: '4-Hour Response', desc: 'Business hours, Mon–Fri' },
            { icon: <Shield className="w-5 h-5 text-orange-500" />, title: 'No Obligation', desc: 'Get a quote, decide later' },
            { icon: <Phone className="w-5 h-5 text-orange-500" />, title: 'Personal Service', desc: 'Direct line to our team' },
          ].map((t) => (
            <div key={t.title} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3 items-start">
              {t.icon}
              <div>
                <p className="font-bold text-slate-900 text-sm">{t.title}</p>
                <p className="text-slate-500 text-xs">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
          <Suspense>
            <BulkQuoteForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
