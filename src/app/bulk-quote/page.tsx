import { Suspense } from 'react'
import { BulkQuoteForm } from '@/components/forms/BulkQuoteForm'
import { getPublicPickerCatalog } from '@/lib/quotes/catalog'
import { priceOptionsFor } from '@/lib/cart/server'
import { getAccountPricing } from '@/lib/accounts'
import { Clock, Truck, BadgeDollarSign } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Request a Wholesale Quote — Pallets & Bulk Tarps',
  description:
    'Get wholesale pricing on bulk and pallet tarp orders, with LTL freight to your dock, jobsite or farm. Priced quote, usually within one business day.',
}

export default async function BulkQuotePage() {
  const account = await getAccountPricing()
  const { products } = await getPublicPickerCatalog(priceOptionsFor(account))

  return (
    <div className="bg-slate-50 min-h-screen py-10 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">Wholesale & pallet orders</p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Request a quote</h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Tell us what you need and where it&apos;s going. We&apos;ll send a priced quote, freight included, that you can accept and pay online.
          </p>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {[
            { icon: Clock, title: 'Fast quote turnaround', desc: 'We aim to reply within one business day' },
            { icon: Truck, title: 'LTL freight quoted', desc: 'Dock, liftgate or jobsite delivery' },
            { icon: BadgeDollarSign, title: 'Accept & pay online', desc: 'Card, or Net terms for approved accounts' },
          ].map(({ icon: Icon, title, desc }) => (
            <li key={title} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3 items-start">
              <Icon className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="font-bold text-slate-900 text-sm">{title}</p>
                <p className="text-slate-500 text-xs">{desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8">
          <Suspense>
            <BulkQuoteForm products={products} defaultEmail={account.email} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
