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
  const [catalog, rules, account, freight] = await Promise.all([getCartCatalog(), getPricingRules(), getAccountPricing(), getFreightConfig()])
  const wholesaleDiscountPercent = account.status === 'approved' ? account.wholesaleDiscountPercent : 0
  // only the fields the pricing engine needs reach the browser
  const publicRules = rules.map((r) => ({
    tarp_type: r.tarp_type,
    thickness_mil: r.thickness_mil,
    min_quantity: r.min_quantity,
    max_quantity: r.max_quantity,
    discount_from_retail_percent: r.discount_from_retail_percent,
    priority: r.priority,
    active: r.active,
    // pallet-first fields: without them the browser treats pallet rules as piece tiers
    unit: r.unit,
    price_multiplier: r.price_multiplier,
    requires_account: r.requires_account,
    label: r.label,
  }))

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
        <QuickOrderGrid catalog={catalog} rules={publicRules} wholesaleDiscountPercent={wholesaleDiscountPercent} accountApproved={account.status === 'approved'} contractPrices={account.status === 'approved' ? account.contractPrices ?? [] : []} freight={freight} />
      </div>
    </div>
  )
}
