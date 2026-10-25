import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { AlertTriangle, Info } from 'lucide-react'
import { isDemoMode } from '@/lib/demo'
import { createAdminClient } from '@/lib/supabase/server'
import { getCartCatalog } from '@/lib/cart/server'
import { normalizeFreightConfig, PLACEHOLDER_FREIGHT_CONFIG, XPOSE_OZ_PER_SQYD_BY_MIL, type FreightConfig } from '@/lib/freight'
import { FreightCalculator } from '@/components/cart/FreightCalculator'
import { currentAdminEmail } from './auth'
import { saveFreightSettings, saveFreightRate, deleteFreightRate } from './actions'

export const metadata: Metadata = { title: 'Freight' }

const dollars = (c: number | null | undefined) => (c == null ? '' : (c / 100).toFixed(2))
const input = 'w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 disabled:bg-slate-50 disabled:text-slate-500'

export default async function AdminFreightPage() {
  await connection()
  const demo = isDemoMode()
  let config: FreightConfig = PLACEHOLDER_FREIGHT_CONFIG
  let loadError: string | null = null

  if (!demo) {
    if (!(await currentAdminEmail())) redirect('/account/login?redirect=/admin/freight')
    const supabase = await createAdminClient()
    const [rates, settings] = await Promise.all([
      supabase.from('freight_rates').select('*').order('method').order('sort').order('min_lb'),
      supabase.from('freight_settings').select('*').eq('id', 1).maybeSingle(),
    ])
    if (rates.error || settings.error) loadError = (rates.error ?? settings.error)!.message
    else config = normalizeFreightConfig(rates.data, settings.data)
  }
  const readOnly = demo || !!loadError
  const catalog = await getCartCatalog()
  const s = config.settings

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Freight</h1>
        <p className="text-sm text-slate-500 mt-1">
          Weight-based freight. Orders up to the parcel limit ship parcel; heavier orders ship by truck (LTL) and need a freight quote unless LTL checkout is on.
        </p>
      </div>

      {demo && (
        <div className="flex gap-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-sm">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
          <p><strong>Demo mode: read-only.</strong> Showing the built-in placeholder rates. Connect Supabase and apply <code>supabase/migrations/0006_freight.sql</code> to edit.</p>
        </div>
      )}
      {loadError && (
        <div className="flex gap-2 bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm" role="alert">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
          <p>Could not load freight tables ({loadError}). Apply migration <code>0006_freight.sql</code>. Until then every order goes to a freight quote.</p>
        </div>
      )}
      <div className="flex gap-2 bg-orange-50 border border-orange-200 text-orange-900 rounded-xl p-4 text-sm">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
        <p><strong>Placeholder rates.</strong> The seeded brackets are placeholders, not carrier quotes. Replace them with your real parcel and LTL rates before taking orders.</p>
      </div>

      {/* Settings */}
      <section className="bg-white rounded-xl border border-slate-200 p-5" aria-labelledby="fs-h">
        <h2 id="fs-h" className="font-bold text-slate-900 mb-4">Settings</h2>
        <form action={saveFreightSettings} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <fieldset disabled={readOnly} className="contents">
            <label className="text-sm">
              <span className="block font-semibold text-slate-700 mb-1">Parcel limit per order (lb)</span>
              <input name="parcel_max_order_lb" type="number" step="1" min="1" defaultValue={s.parcel_max_order_lb} className={input} required />
            </label>
            <label className="text-sm">
              <span className="block font-semibold text-slate-700 mb-1">Handling per order ($)</span>
              <input name="handling" type="number" step="0.01" min="0" defaultValue={dollars(s.handling_cents)} className={input} />
            </label>
            <label className="text-sm">
              <span className="block font-semibold text-slate-700 mb-1">Free parcel freight over ($)</span>
              <input name="free_freight_threshold" type="number" step="0.01" min="0" placeholder="Off" defaultValue={dollars(s.free_freight_threshold_cents)} className={input} />
            </label>
            <label className="text-sm flex items-center gap-2 pb-2">
              <input name="ltl_checkout_enabled" type="checkbox" defaultChecked={s.ltl_checkout_enabled} className="w-4 h-4 accent-orange-500" />
              <span className="font-semibold text-slate-700">Allow LTL orders to check out online</span>
            </label>
            <div className="sm:col-span-2 lg:col-span-4">
              <button className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-sm px-4 py-2 rounded-lg">Save settings</button>
            </div>
          </fieldset>
        </form>
      </section>

      {/* Rates */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 overflow-x-auto" aria-labelledby="fr-h">
        <h2 id="fr-h" className="font-bold text-slate-900">Rate brackets</h2>
        <p className="text-xs text-slate-500 mb-4">Freight = base + per-lb × order weight (rounded up to whole lb) + handling. A bracket matches when min &lt; weight ≤ max.</p>
        <div className="min-w-[760px] space-y-2">
          <div className="grid grid-cols-[6rem_6rem_6rem_7rem_7rem_4rem_5rem_auto] gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            <span>Method</span><span>Min lb</span><span>Max lb</span><span>Base $</span><span>Per lb $</span><span>Sort</span><span>Active</span><span />
          </div>
          {[...config.rates, null].map((r, i) => (
            <div key={r?.id ?? `new-${i}`} className="flex gap-2 items-center">
              <form action={saveFreightRate} className="grid grid-cols-[6rem_6rem_6rem_7rem_7rem_4rem_5rem_auto] gap-2 items-center flex-1">
                <fieldset disabled={readOnly} className="contents">
                  <input type="hidden" name="id" value={r?.id ?? ''} />
                  <select name="method" defaultValue={r?.method ?? 'parcel'} aria-label="Method" className={input}>
                    <option value="parcel">Parcel</option>
                    <option value="ltl">LTL</option>
                  </select>
                  <input name="min_lb" type="number" step="0.01" min="0" defaultValue={r?.min_lb ?? ''} aria-label="Min lb" className={input} required />
                  <input name="max_lb" type="number" step="0.01" min="0" defaultValue={r?.max_lb ?? ''} placeholder="no max" aria-label="Max lb" className={input} />
                  <input name="base" type="number" step="0.01" min="0" defaultValue={dollars(r?.base_cents)} aria-label="Base dollars" className={input} required />
                  <input name="per_lb" type="number" step="0.01" min="0" defaultValue={dollars(r?.per_lb_cents)} aria-label="Per lb dollars" className={input} required />
                  <input name="sort" type="number" step="1" defaultValue={r?.sort ?? ''} aria-label="Sort" className={input} />
                  <input name="active" type="checkbox" defaultChecked={r?.active ?? true} aria-label="Active" className="w-4 h-4 accent-orange-500 justify-self-center" />
                  <button className="text-sm font-semibold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-lg whitespace-nowrap">{r ? 'Save' : 'Add bracket'}</button>
                </fieldset>
              </form>
              {r?.id && !readOnly && (
                <form action={deleteFreightRate}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="text-sm text-red-600 hover:underline px-2">Delete</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Calculator */}
      <section className="bg-white rounded-xl border border-slate-200 p-5" aria-labelledby="fc-h">
        <h2 id="fc-h" className="font-bold text-slate-900">Test calculator</h2>
        <p className="text-xs text-slate-500 mb-4">
          Uses the same weight and freight functions as checkout. Poly weights use the Xpose spec (oz/sq yd by mil:{' '}
          {Object.entries(XPOSE_OZ_PER_SQYD_BY_MIL).map(([m, oz]) => `${m} mil ${oz}`).join(', ')}) unless a product has a <code>shipping_weight_lb</code> override.
        </p>
        <FreightCalculator catalog={catalog} config={config} />
      </section>
    </div>
  )
}
