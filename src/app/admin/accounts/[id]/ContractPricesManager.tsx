'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Handshake, Pencil, Trash2, Plus, Check, X, Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { addContractPrice, deleteContractPrice, updateContractPrice, type ContractActionResult } from '../contract-actions'

export interface ContractTableRow {
  id: string
  sku: string
  product_name: string | null
  product_slug: string | null
  unit_price_cents: number
  guest_price_cents: number | null
  cost_price_cents: number | null
  min_quantity: number
  valid_until: string | null
  expired: boolean
  quote_only: boolean
  source_quote_id: string | null
  source_quote_number: string | null
  note: string | null
}

interface Props {
  contractorId: string
  rows: ContractTableRow[]
  defaultValidUntil: string
  approved: boolean
}

const pct = (n: number) => `${Math.round(n * 1000) / 10}%`
const fmtDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { dateStyle: 'medium' })
const inputCls = 'border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400'

export function ContractPricesManager({ contractorId, rows, defaultValidUntil, approved }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState({ price: '', minQuantity: '1', validUntil: '' })
  const [add, setAdd] = useState({ sku: '', price: '', minQuantity: '1', validUntil: defaultValidUntil })
  const [result, setResult] = useState<{ ok: boolean; demo?: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  const run = (fn: () => Promise<ContractActionResult>, after?: () => void) => {
    setResult(null)
    start(async () => {
      const r = await fn()
      setResult(r.ok ? { ok: true, demo: r.demo, text: r.message } : { ok: false, text: r.error })
      if (r.ok) {
        after?.()
        if (!r.demo) router.refresh()
      }
    })
  }

  const startEdit = (r: ContractTableRow) => {
    setEditing(r.id)
    setDraft({ price: (r.unit_price_cents / 100).toFixed(2), minQuantity: String(r.min_quantity), validUntil: r.valid_until ?? '' })
  }

  return (
    <section id="contract-prices" className="bg-white rounded-xl border border-slate-200 scroll-mt-28" aria-labelledby="cp-h" data-testid="contract-prices-section">
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="cp-h" className="font-bold text-slate-900 flex items-center gap-2"><Handshake className="w-5 h-5 text-emerald-600" aria-hidden /> Contract prices</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Negotiated unit prices for this client. Online orders pay the lower of the contract price and their normal price.
            Contract prices ignore the cost floor, so check the margin.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500">{rows.length} on file</span>
      </div>
      {!approved && (
        <p className="mx-5 sm:mx-6 mt-4 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          This account isn&apos;t approved, so contract prices won&apos;t apply until it is.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <caption className="sr-only">Contract prices for this account</caption>
          <thead>
            <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <th scope="col" className="text-left font-semibold px-4 py-2">SKU / product</th>
              <th scope="col" className="text-right font-semibold px-3 py-2">Contract</th>
              <th scope="col" className="text-right font-semibold px-3 py-2">Guest price</th>
              <th scope="col" className="text-right font-semibold px-3 py-2">Savings</th>
              <th scope="col" className="text-right font-semibold px-3 py-2">Cost · margin</th>
              <th scope="col" className="text-right font-semibold px-3 py-2">Min qty</th>
              <th scope="col" className="text-left font-semibold px-3 py-2">Valid until</th>
              <th scope="col" className="text-left font-semibold px-3 py-2">Source</th>
              <th scope="col" className="px-3 py-2"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!rows.length && (
              <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-400">No contract prices yet. Save them from a quote, or add one by SKU below.</td></tr>
            )}
            {rows.map((r) => {
              const isEditing = editing === r.id
              const savings = r.guest_price_cents ? 1 - r.unit_price_cents / r.guest_price_cents : null
              const margin = r.cost_price_cents ? 1 - r.cost_price_cents / r.unit_price_cents : null
              return (
                <tr key={r.id} className={r.expired ? 'bg-slate-50 text-slate-400' : undefined} data-testid="contract-row">
                  <td className="px-4 py-3 align-top">
                    <p className="font-mono text-xs text-slate-500">{r.sku}</p>
                    {r.product_slug ? (
                      <Link href={`/product/${r.product_slug}`} className="font-semibold text-slate-900 hover:text-orange-600">{r.product_name}</Link>
                    ) : (
                      <span className="font-semibold">{r.product_name ?? 'Unknown product'}</span>
                    )}
                    {r.quote_only && <span className="block text-[11px] text-orange-700">Quote-only SKU: used for quote suggestions, not online checkout</span>}
                    {r.note && <span className="block text-[11px] text-slate-400">{r.note}</span>}
                  </td>
                  <td className="px-3 py-3 text-right align-top tabular-nums">
                    {isEditing ? (
                      <>
                        <label htmlFor={`cp-e-price-${r.id}`} className="sr-only">Contract price for {r.sku}</label>
                        <input id={`cp-e-price-${r.id}`} inputMode="decimal" value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))} className={`${inputCls} w-24 text-right`} />
                      </>
                    ) : (
                      <span className="font-black text-emerald-700">{formatPrice(r.unit_price_cents)}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right align-top tabular-nums">{r.guest_price_cents ? formatPrice(r.guest_price_cents) : <span className="text-slate-400">Quote</span>}</td>
                  <td className="px-3 py-3 text-right align-top tabular-nums">{savings != null ? <span className={savings > 0 ? 'font-semibold text-green-700' : 'text-slate-500'}>{pct(savings)}</span> : '—'}</td>
                  <td className="px-3 py-3 text-right align-top tabular-nums">
                    {r.cost_price_cents ? (
                      <>
                        <span className="text-slate-600">{formatPrice(r.cost_price_cents)}</span>
                        <span className={`block text-xs font-semibold ${margin != null && margin < 0.15 ? 'text-red-600' : 'text-slate-500'}`}>{margin != null ? pct(margin) : '—'}</span>
                      </>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-3 py-3 text-right align-top tabular-nums">
                    {isEditing ? (
                      <>
                        <label htmlFor={`cp-e-min-${r.id}`} className="sr-only">Min quantity for {r.sku}</label>
                        <input id={`cp-e-min-${r.id}`} type="number" min={1} value={draft.minQuantity} onChange={(e) => setDraft((d) => ({ ...d, minQuantity: e.target.value }))} className={`${inputCls} w-20 text-right`} />
                      </>
                    ) : `${r.min_quantity}+`}
                  </td>
                  <td className="px-3 py-3 align-top whitespace-nowrap">
                    {isEditing ? (
                      <>
                        <label htmlFor={`cp-e-valid-${r.id}`} className="sr-only">Valid until for {r.sku}</label>
                        <input id={`cp-e-valid-${r.id}`} type="date" value={draft.validUntil} onChange={(e) => setDraft((d) => ({ ...d, validUntil: e.target.value }))} className={inputCls} />
                      </>
                    ) : r.valid_until ? (
                      <span className={r.expired ? 'font-semibold text-red-600' : undefined}>{fmtDate(r.valid_until)}{r.expired ? ' (expired)' : ''}</span>
                    ) : 'No end date'}
                  </td>
                  <td className="px-3 py-3 align-top whitespace-nowrap">
                    {r.source_quote_id ? (
                      <Link href={`/admin/rfqs/${r.source_quote_id}`} className="font-mono text-xs text-orange-600 hover:underline">{r.source_quote_number ?? 'Quote'}</Link>
                    ) : <span className="text-xs text-slate-400">Manual</span>}
                  </td>
                  <td className="px-3 py-3 align-top whitespace-nowrap text-right">
                    {isEditing ? (
                      <div className="inline-flex gap-1">
                        <button type="button" disabled={pending} onClick={() => run(() => updateContractPrice({ contractorId, id: r.id, ...draft }), () => setEditing(null))}
                          className="p-1.5 rounded-md text-emerald-700 hover:bg-emerald-50" aria-label={`Save ${r.sku}`}>
                          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100" aria-label="Cancel edit"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="inline-flex gap-1">
                        <button type="button" onClick={() => startEdit(r)} className="p-1.5 rounded-md text-slate-500 hover:text-orange-600 hover:bg-orange-50" aria-label={`Edit ${r.sku}`}><Pencil className="w-4 h-4" /></button>
                        <button type="button" disabled={pending}
                          onClick={() => window.confirm(`Delete the contract price for ${r.sku}?`) && run(() => deleteContractPrice({ contractorId, id: r.id }))}
                          className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50" aria-label={`Delete ${r.sku}`}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <form
        className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-xl grid grid-cols-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_6rem_minmax(0,1fr)_auto] gap-3 items-end"
        onSubmit={(e) => {
          e.preventDefault()
          run(() => addContractPrice({ contractorId, ...add }), () => setAdd((a) => ({ ...a, sku: '', price: '' })))
        }}
        aria-label="Add a contract price by SKU"
      >
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="cp-add-sku" className="block text-xs font-semibold text-slate-600 mb-1">SKU</label>
          <input id="cp-add-sku" value={add.sku} onChange={(e) => setAdd((a) => ({ ...a, sku: e.target.value }))} placeholder="MT-30X40-10MIL" required className={`${inputCls} w-full font-mono`} />
        </div>
        <div>
          <label htmlFor="cp-add-price" className="block text-xs font-semibold text-slate-600 mb-1">Contract price ($/unit)</label>
          <input id="cp-add-price" inputMode="decimal" value={add.price} onChange={(e) => setAdd((a) => ({ ...a, price: e.target.value }))} placeholder="74.50" required className={`${inputCls} w-full text-right`} />
        </div>
        <div>
          <label htmlFor="cp-add-min" className="block text-xs font-semibold text-slate-600 mb-1">Min qty</label>
          <input id="cp-add-min" type="number" min={1} value={add.minQuantity} onChange={(e) => setAdd((a) => ({ ...a, minQuantity: e.target.value }))} className={`${inputCls} w-full text-right`} />
        </div>
        <div>
          <label htmlFor="cp-add-valid" className="block text-xs font-semibold text-slate-600 mb-1">Valid until</label>
          <input id="cp-add-valid" type="date" value={add.validUntil} onChange={(e) => setAdd((a) => ({ ...a, validUntil: e.target.value }))} className={`${inputCls} w-full`} />
        </div>
        <button type="submit" disabled={pending} className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-sm px-4 py-2 rounded-lg">
          {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Plus className="w-4 h-4" aria-hidden />} Add
        </button>
      </form>

      <div aria-live="polite" className="px-5 sm:px-6">
        {result && (
          <p className={`mb-4 flex items-start gap-2 text-sm rounded-lg px-3 py-2 ${!result.ok ? 'bg-red-50 text-red-700' : result.demo ? 'bg-sky-50 text-sky-800' : 'bg-emerald-50 text-emerald-800'}`} data-testid="contract-result">
            {!result.ok ? <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden /> : result.demo ? <Info className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden /> : <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />}
            <span>{result.text}</span>
          </p>
        )}
      </div>
    </section>
  )
}
