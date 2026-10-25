import Link from 'next/link'
import { Truck, Scale, FileText } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { formatLb, freightMethodLabel, type FreightResult } from '@/lib/freight'

/** Weight + freight rows for the cart summary and drawer. */
export function FreightRows({ freight }: { freight: FreightResult }) {
  return (
    <>
      <div className="flex justify-between">
        <dt className="text-slate-600 inline-flex items-center gap-1.5"><Scale className="w-3.5 h-3.5 text-slate-400" aria-hidden />Ship weight</dt>
        <dd className="font-semibold text-slate-900" data-testid="ship-weight">
          {freight.unknownWeightSkus.length ? 'Not listed for some items' : `${formatLb(freight.totalWeightLb)} lb`}
        </dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-slate-600 inline-flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-slate-400" aria-hidden />{freight.method === 'quote' ? 'Freight' : `Freight · ${freightMethodLabel(freight.method)}`}</dt>
        <dd className="font-semibold text-slate-900 text-right" data-testid="freight-amount">
          {freight.method === 'quote' ? 'Quoted separately' : freight.free ? 'FREE' : formatPrice(freight.freightCents ?? 0)}
        </dd>
      </div>
    </>
  )
}

/** Replaces the Checkout button when freight can't be priced online. `compact` (drawer) omits the button. */
export function FreightQuoteRequired({ freight, compact }: { freight: FreightResult; compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-orange-200 bg-orange-50 ${compact ? 'p-3' : 'p-4'}`} data-testid="freight-quote-required">
      <p className="font-bold text-orange-900 text-sm">Freight quote required</p>
      <p className="text-xs text-orange-800 mt-1">{freight.reason} Your item prices stay as shown; we&apos;ll add the freight to your quote.</p>
      {!compact && <Link href="/bulk-quote?from=cart" className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl inline-flex items-center justify-center gap-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200">
        <FileText className="w-4 h-4" aria-hidden /> Request a quote
      </Link>}
    </div>
  )
}
