'use client'

import { useMemo, useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Check, X, AlertTriangle } from 'lucide-react'
import { priceTiers, applicableRules, applicablePalletRules, palletTiers, type PricingRule } from '@/lib/pricing'
import { formatPrice } from '@/lib/utils'
import { createRule, updateRule, deleteRule, type RuleResult } from './actions'
import { RULE_TARP_TYPES, ruleWarnings, scopeLabel, qtyLabel } from './_lib/rules'

export interface SampleProduct {
  sku: string
  name: string
  retail_price_cents: number
  tarp_type: string
  thickness_mil: number | null
  units_per_full_pallet?: number | null
  min_unit_price_cents?: number | null
}

interface Draft {
  tarp_type: string
  thickness_mil: string
  min_quantity: string
  max_quantity: string
  discount_from_retail_percent: string
  unit: 'each' | 'pallet'
  price_percent_of_guest: string
  requires_account: boolean
  priority: string
  active: boolean
}

const EMPTY: Draft = { tarp_type: '', thickness_mil: '', min_quantity: '', max_quantity: '', discount_from_retail_percent: '', priority: '0', active: true, unit: 'each', price_percent_of_guest: '', requires_account: false }
const pctOfGuest = (r: PricingRule) => Math.round(Number(r.price_multiplier ?? 1) * 10000) / 100
const toDraft = (r: PricingRule): Draft => ({
  tarp_type: r.tarp_type ?? '',
  thickness_mil: r.thickness_mil ? String(r.thickness_mil) : '',
  min_quantity: String(r.min_quantity),
  max_quantity: r.max_quantity == null ? '' : String(r.max_quantity),
  discount_from_retail_percent: String(Number(r.discount_from_retail_percent ?? 0)),
  unit: r.unit === 'pallet' ? 'pallet' : 'each',
  price_percent_of_guest: r.unit === 'pallet' ? String(pctOfGuest(r)) : '',
  requires_account: !!r.requires_account,
  priority: String(r.priority ?? 0),
  active: r.active !== false,
})
const fromDraft = (d: Draft) => ({
  tarp_type: d.tarp_type || null,
  thickness_mil: d.thickness_mil || null,
  min_quantity: d.min_quantity,
  max_quantity: d.max_quantity || null,
  discount_from_retail_percent: d.discount_from_retail_percent,
  unit: d.unit,
  price_percent_of_guest: d.price_percent_of_guest,
  requires_account: d.requires_account,
  priority: d.priority || 0,
  active: d.active,
})

export function RulesEditor({ initialRules, samples }: { initialRules: PricingRule[]; samples: SampleProduct[] }) {
  const [rules, setRules] = useState(initialRules)
  const [editing, setEditing] = useState<string | null>(null) // rule id or 'new'
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [msg, setMsg] = useState<RuleResult | null>(null)
  const [pending, start] = useTransition()
  const [sampleSku, setSampleSku] = useState(samples.find((s) => s.tarp_type === 'poly' && s.thickness_mil === 10)?.sku ?? samples[0]?.sku ?? '')

  const sorted = useMemo(
    () => [...rules].sort((a, b) => scopeLabel(a).localeCompare(scopeLabel(b)) || a.min_quantity - b.min_quantity),
    [rules],
  )
  const warnings = useMemo(() => ruleWarnings(rules), [rules])
  const sample = samples.find((s) => s.sku === sampleSku)
  const tiers = sample ? priceTiers(sample, rules) : []
  const pTiers = sample ? palletTiers(sample, rules) : []
  const used = sample ? new Set([...applicableRules(sample, rules), ...applicablePalletRules(sample, rules)].map((r) => r.id)) : new Set<string | undefined>()

  function begin(id: string, d: Draft) {
    setEditing(id)
    setDraft(d)
    setMsg(null)
  }

  function submit() {
    const payload = fromDraft(draft)
    const id = editing
    start(async () => {
      const res = id === 'new' ? await createRule(payload) : await updateRule(id!, payload)
      setMsg(res)
      if (res.ok && res.rule) {
        const saved = { ...res.rule, active: res.rule.active !== false } as PricingRule
        setRules((prev) => (id === 'new' ? [...prev, saved] : prev.map((r) => (r.id === id ? { ...r, ...saved } : r))))
        setEditing(null)
      }
    })
  }

  function remove(r: PricingRule) {
    if (!r.id || !confirm(`Delete the ${scopeLabel(r)} rule for ${r.min_quantity}${r.max_quantity == null ? '+' : `–${r.max_quantity}`} units?`)) return
    start(async () => {
      const res = await deleteRule(r.id!)
      setMsg(res)
      if (res.ok) setRules((prev) => prev.filter((x) => x.id !== r.id))
    })
  }

  const field = 'w-full py-1.5 px-2 rounded-md border border-slate-300 text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400'
  const editRow = (key: string) => (
    <tr key={key} className="bg-orange-50/60">
      <td className="px-3 py-2">
        <label className="sr-only" htmlFor={`${key}-type`}>Tarp type</label>
        <select id={`${key}-type`} value={draft.tarp_type} onChange={(e) => setDraft({ ...draft, tarp_type: e.target.value })} className={field}>
          <option value="">All types</option>
          {RULE_TARP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </td>
      <td className="px-3 py-2">
        <label className="sr-only" htmlFor={`${key}-mil`}>Thickness (mil)</label>
        <input id={`${key}-mil`} value={draft.thickness_mil} onChange={(e) => setDraft({ ...draft, thickness_mil: e.target.value })} placeholder="Any" inputMode="numeric" className={`${field} w-20`} />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <label className="sr-only" htmlFor={`${key}-min`}>Min quantity</label>
          <input id={`${key}-min`} value={draft.min_quantity} onChange={(e) => setDraft({ ...draft, min_quantity: e.target.value })} placeholder="min" inputMode="numeric" className={`${field} w-20`} />
          <span className="text-slate-400">–</span>
          <label className="sr-only" htmlFor={`${key}-max`}>Max quantity</label>
          <input id={`${key}-max`} value={draft.max_quantity} onChange={(e) => setDraft({ ...draft, max_quantity: e.target.value })} placeholder="∞" inputMode="numeric" className={`${field} w-20`} />
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-col gap-1">
          <label className="sr-only" htmlFor={`${key}-unit`}>Rule unit</label>
          <select id={`${key}-unit`} value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value as Draft['unit'], requires_account: e.target.value === 'pallet' })} className={`${field} w-32`}>
            <option value="each">% off retail (pieces)</option>
            <option value="pallet">% of guest (pallets)</option>
          </select>
          {draft.unit === 'pallet' ? (
            <>
              <label className="sr-only" htmlFor={`${key}-pog`}>Price as percent of guest price</label>
              <input id={`${key}-pog`} value={draft.price_percent_of_guest} onChange={(e) => setDraft({ ...draft, price_percent_of_guest: e.target.value })} placeholder="e.g. 94.74" inputMode="decimal" className={`${field} w-24`} />
              <label className="text-[11px] text-slate-600 flex items-center gap-1">
                <input type="checkbox" checked={draft.requires_account} onChange={(e) => setDraft({ ...draft, requires_account: e.target.checked })} className="w-3.5 h-3.5 accent-orange-500" /> Accounts only
              </label>
            </>
          ) : (
            <>
              <label className="sr-only" htmlFor={`${key}-disc`}>Discount percent</label>
              <input id={`${key}-disc`} value={draft.discount_from_retail_percent} onChange={(e) => setDraft({ ...draft, discount_from_retail_percent: e.target.value })} placeholder="%" inputMode="decimal" className={`${field} w-20`} />
            </>
          )}
        </div>
      </td>
      <td className="px-3 py-2">
        <label className="sr-only" htmlFor={`${key}-prio`}>Priority</label>
        <input id={`${key}-prio`} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })} inputMode="numeric" className={`${field} w-16`} />
      </td>
      <td className="px-3 py-2 text-center">
        <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} aria-label="Active" className="w-4 h-4 accent-orange-500" />
      </td>
      <td className="px-3 py-2">
        <div className="flex justify-end gap-1">
          <button type="button" onClick={submit} disabled={pending} className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-md bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50">
            <Check className="w-3.5 h-3.5" aria-hidden /> {pending ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-md hover:bg-slate-100" aria-label="Cancel"><X className="w-4 h-4" /></button>
        </div>
      </td>
    </tr>
  )

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-4 min-w-0">
        {msg && (
          <p role="status" className={`text-sm rounded-lg px-3 py-2 ${msg.ok ? (msg.demo ? 'bg-amber-50 text-amber-900' : 'bg-green-50 text-green-800') : 'bg-red-50 text-red-800'}`}>{msg.message}</p>
        )}
        <div className="bg-white rounded-xl ring-1 ring-slate-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <caption className="sr-only">Volume pricing rules</caption>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-3 py-2.5 font-semibold">Tarp type</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Mil</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Quantity</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Price</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Priority</th>
                <th scope="col" className="px-3 py-2.5 font-semibold text-center">Active</th>
                <th scope="col" className="px-3 py-2.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length === 0 && editing !== 'new' && (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">No rules yet — every product sells at retail at any quantity.</td></tr>
              )}
              {sorted.map((r) =>
                editing === r.id ? editRow(r.id!) : (
                  <tr key={r.id} className={`${r.active === false ? 'opacity-50' : ''} ${used.has(r.id) ? 'bg-sky-50/50' : ''}`}>
                    <td className="px-3 py-2.5 text-slate-800">{r.tarp_type ?? <span className="text-slate-500">All types</span>}</td>
                    <td className="px-3 py-2.5 text-slate-700">{r.thickness_mil ? `${r.thickness_mil} mil` : <span className="text-slate-400">Any</span>}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900 tabular-nums">{qtyLabel(r)}</td>
                    <td className="px-3 py-2.5 font-bold text-green-700 tabular-nums">
                      {r.unit === 'pallet' ? (
                        <>{pctOfGuest(r)}% of guest{r.requires_account && <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">Accounts</span>}</>
                      ) : (
                        <>−{Number(r.discount_from_retail_percent ?? 0)}%</>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 tabular-nums">{r.priority ?? 0}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.active !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{r.active !== false ? 'On' : 'Off'}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => begin(r.id!, toDraft(r))} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600" aria-label={`Edit ${scopeLabel(r)} ${r.min_quantity}+ rule`}><Pencil className="w-4 h-4" /></button>
                        <button type="button" onClick={() => remove(r)} disabled={pending} className="p-1.5 rounded-md hover:bg-red-50 text-red-600" aria-label={`Delete ${scopeLabel(r)} ${r.min_quantity}+ rule`}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
              {editing === 'new' && editRow('new')}
            </tbody>
          </table>
        </div>
        {editing !== 'new' && (
          <button type="button" onClick={() => begin('new', EMPTY)} className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800">
            <Plus className="w-4 h-4" aria-hidden /> Add rule
          </button>
        )}
        {warnings.length > 0 && (
          <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 p-4">
            <p className="text-sm font-bold text-amber-900 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" aria-hidden /> Check these ranges</p>
            <ul className="mt-1.5 text-sm text-amber-900 list-disc pl-5 space-y-0.5">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
          </div>
        )}
      </div>

      {/* Live preview */}
      <aside className="bg-white rounded-xl ring-1 ring-slate-200 p-4 self-start xl:sticky xl:top-6" aria-label="Tier preview">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Preview on a product</p>
        <label className="sr-only" htmlFor="sample">Sample product</label>
        <select id="sample" value={sampleSku} onChange={(e) => setSampleSku(e.target.value)} className="mt-2 w-full py-1.5 px-2 rounded-md border border-slate-300 text-sm bg-white">
          {samples.map((s) => <option key={s.sku} value={s.sku}>{s.name}</option>)}
        </select>
        {sample ? (
          <table className="mt-3 w-full text-sm">
            <thead><tr className="text-xs text-slate-500"><th className="text-left py-1 font-semibold">Qty</th><th className="text-right py-1 font-semibold">Unit</th><th className="text-right py-1 font-semibold">Save</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {tiers.map((t) => (
                <tr key={t.label}>
                  <td className="py-1.5 font-semibold text-slate-800">{t.label}</td>
                  <td className="py-1.5 text-right tabular-nums font-bold">{formatPrice(t.unit_price_cents)}</td>
                  <td className="py-1.5 text-right tabular-nums text-green-700">{t.discount_percent ? `${t.discount_percent}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {sample && pTiers.length > 0 && (
          <table className="mt-3 w-full text-sm">
            <caption className="text-left text-xs font-semibold text-slate-500 pb-1">Wholesale accounts · {sample.units_per_full_pallet} per pallet</caption>
            <tbody className="divide-y divide-slate-100">
              {pTiers.map((t) => (
                <tr key={t.label}>
                  <td className="py-1.5 font-semibold text-slate-800">{t.label}</td>
                  <td className="py-1.5 text-right tabular-nums font-bold">{formatPrice(t.unit_price_cents)}</td>
                  <td className="py-1.5 text-right tabular-nums text-slate-500">{formatPrice(t.pallet_total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!sample && (
          <p className="mt-3 text-sm text-slate-500">No priced products yet — set retail prices in Products first.</p>
        )}
        <p className="mt-3 text-xs text-slate-500">Rows highlighted in blue are the rules this product uses.</p>
      </aside>
    </div>
  )
}
