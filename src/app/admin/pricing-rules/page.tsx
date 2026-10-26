import type { Metadata } from 'next'
import { connection } from 'next/server'
import { ShieldAlert } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { demoPricingRules, demoProducts } from '@/lib/demo'
import type { PricingRule } from '@/lib/pricing'
import { checkAdmin } from '../products/_lib/admin-auth'
import { RulesEditor, type SampleProduct } from './RulesEditor'

export const metadata: Metadata = { title: 'Pricing Rules' }

export default async function AdminPricingRulesPage() {
  await connection() // always render per request: admin data must be fresh
  const auth = await checkAdmin()
  if (!auth.ok) {
    return (
      <div className="p-8 max-w-lg">
        <div className="flex items-start gap-3 bg-white ring-1 ring-red-200 rounded-xl p-5">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden />
          <div>
            <h1 className="font-bold text-slate-900">Admin access required</h1>
            <p className="text-sm text-slate-600 mt-1">{auth.reason}</p>
          </div>
        </div>
      </div>
    )
  }

  let rules: PricingRule[] = []
  let samples: SampleProduct[] = []
  let loadError: string | null = null
  if (auth.demo) {
    rules = demoPricingRules
    samples = demoProducts.filter((p) => p.retail_price_cents > 0).map((p) => { const x = p as typeof p & { min_unit_price_cents?: number | null }; return { sku: x.xpose_sku, name: x.name, retail_price_cents: x.retail_price_cents, tarp_type: x.tarp_type, thickness_mil: x.thickness_mil, units_per_full_pallet: x.units_per_full_pallet, min_unit_price_cents: x.min_unit_price_cents } })
  } else {
    const supabase = await createAdminClient()
    const [r, p] = await Promise.all([
      supabase.from('pricing_rules').select('*').order('min_quantity'),
      supabase.from('products').select('xpose_sku, name, retail_price_cents, tarp_type, thickness_mil, units_per_full_pallet, min_unit_price_cents').gt('retail_price_cents', 0).eq('active', true).order('name').limit(500),
    ])
    if (r.error) loadError = r.error.message
    rules = (r.data as PricingRule[]) ?? []
    samples = (p.data ?? []).map((x) => ({ sku: x.xpose_sku, name: x.name, retail_price_cents: x.retail_price_cents, tarp_type: x.tarp_type, thickness_mil: x.thickness_mil, units_per_full_pallet: x.units_per_full_pallet, min_unit_price_cents: x.min_unit_price_cents }))
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="text-2xl font-black text-slate-900">Pricing rules</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          Volume tiers are <strong>live</strong>: they set the tier table on every product page, the &ldquo;as low as&rdquo; price on cards,
          and what checkout charges. Each rule takes a % off retail for a quantity range. Scope a rule to a tarp type and/or
          thickness to override the &ldquo;All types&rdquo; tier with the same min quantity (more specific / higher priority wins).
        </p>
      </div>
      {auth.demo && (
        <div role="status" className="mb-5 rounded-xl bg-amber-50 ring-1 ring-amber-300 px-4 py-3 text-sm text-amber-900">
          <strong>Demo mode — changes are not saved.</strong> Edits apply on this page so you can preview tiers, then reset on reload.
        </div>
      )}
      {loadError && <div role="alert" className="mb-5 rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-800">Couldn&apos;t load rules: {loadError}</div>}
      <RulesEditor initialRules={rules} samples={samples} />
    </div>
  )
}
