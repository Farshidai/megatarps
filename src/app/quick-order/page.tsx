import type { Metadata } from 'next'
import { connection } from 'next/server'
import { Zap } from 'lucide-react'
import { getPricingRules } from '@/lib/products'
import { getAccountPricing } from '@/lib/accounts'
import { getCartCatalog } from '@/lib/cart/server'
import { QuickOrderGrid } from '@/components/cart/QuickOrderGrid'
import { getFreightConfig } from '@/lib/freight-server'

export const metadata: Metadata = {
  title: 'Quick Order: order tarps by SKU',
  description: 'Contractor fast-entry order pad. Type or paste SKUs and quantities, see volume pricing instantly, and add everything to your cart.',
}

export default async function QuickOrderPage() {
  await connection() // per-request: live catalog + the buyer's wholesale discount
  const [rules, account, freight] = await Promise.all([getPricingRules(), getAccountPricing(), getFreightConfig()])
  // prices arrive as per-SKU schedules computed on the server for this buyer (no floor / cost in the browser)
  const catalog = await getCartCatalog(undefined, account, rules)
  const wholesaleDiscountPercent = account.status === 'approved' ? account.wholesaleDiscountPercent : 0

  return (
    <div className="bg-slate-50 min-h-[70vh]">
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <p className="inline-flex items-center gap-1.5 text-orange-400 text-xs font-bold uppercase tracking-wider"><Zap className="w-4 h-4" aria-hidden />Contractor order pad</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-2">Quick Order</h1>
          <p className="text-slate-300 mt-2 max-w-2xl">
            Know what you need? Type a SKU or a size like <span className="font-mono text-white">20x30 10 mil</span>, set the quantity,
            or paste your whole list. Volume pricing updates as you type.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuickOrderGrid catalog={catalog} wholesaleDiscountPercent={wholesaleDiscountPercent} accountApproved={account.status === 'approved'} freight={freight} />
      </div>
    </div>
  )
}
