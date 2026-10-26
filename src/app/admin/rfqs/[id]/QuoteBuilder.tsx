'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, RotateCcw, Save, Send, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import type { PricingRule, ContractPrice } from '@/lib/pricing'
import { suggestedUnitPrice } from '@/lib/quotes/suggest'
import { formatPrice } from '@/lib/utils'
import { computeTotals, type PickerProduct, type QuoteStatus } from '@/lib/quotes/types'
import { ProductPicker } from '@/components/quotes/ProductPicker'
import { saveQuoteDraft, sendQuote, type BuilderInput } from '../actions'

export interface BuilderLine {
  key: string
  product_id: string | null
  sku: string
  name: string
  quantity: number
  unit_price_cents: number
  quote_only: boolean
}

interface Props {
  quoteId: string
  status: QuoteStatus
  products: PickerProduct[]
  rules: PricingRule[]
  wholesalePct: number
  accountApproved?: boolean
  /** The client's active contract prices (used in suggestions when the account is approved). */
  contractPrices?: ContractPrice[]
  costs: Record<string, number>
  customerEmail: string | null
  sentAt: string | null
  initial: {
    lines: BuilderLine[]
    freight_cents: number
    tax_cents: number
    discount_cents: number
    valid_until: string
    customer_message: string
    admin_notes: string
  }
}

const EDITABLE: QuoteStatus[] = ['pending', 'quoted', 'expired', 'declined']

function MoneyInput({ id, cents, onChange, disabled, label, className = '' }: {
  id: string; cents: number; onChange: (c: number) => void; disabled?: boolean; label: string; className?: string
}) {
  const [text, setText] = useState<string | null>(null)
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" aria-hidden>$</span>
      <input
        id={id}
        aria-label={label}
        inputMode="decimal"
        disabled={disabled}
        value={text ?? (cents / 100).toFixed(2)}
        onFocus={(e) => { setText((cents / 100).toFixed(2)); requestAnimationFrame(() => e.target.select()) }}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9.]/g, '')
          setText(v)
          const n = Math.round(parseFloat(v || '0') * 100)
          if (Number.isFinite(n) && n >= 0) onChange(n)
        }}
        onBlur={() => setText(null)}
        className="w-full border border-slate-300 rounded-lg pl-6 pr-2 py-2 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </div>
  )
}

export function QuoteBuilder({ quoteId, status, products, rules, wholesalePct, accountApproved = false, contractPrices = [], costs, customerEmail, sentAt, initial }: Props) {
  const router = useRouter()
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const editable = EDITABLE.includes(status)

  const [lines, setLines] = useState<BuilderLine[]>(initial.lines)
  const [freight, setFreight] = useState(initial.freight_cents)
  const [tax, setTax] = useState(initial.tax_cents)
  const [discount, setDiscount] = useState(initial.discount_cents)
  const [validUntil, setValidUntil] = useState(initial.valid_until)
  const [message, setMessage] = useState(initial.customer_message)
  const [notes, setNotes] = useState(initial.admin_notes)
  const [pickerKey, setPickerKey] = useState(0)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<'draft' | 'send' | null>(null)

  const suggestion = (l: Pick<BuilderLine, 'product_id' | 'quantity'>, qty = l.quantity) => {
    const p = l.product_id ? byId.get(l.product_id) : undefined
    return p ? suggestedUnitPrice(p, qty, rules, { wholesaleDiscountPercent: wholesalePct, accountApproved, contractPrices }) : { cents: 0, contract: false }
  }
  const suggested = (l: Pick<BuilderLine, 'product_id' | 'quantity'>, qty = l.quantity) => suggestion(l, qty).cents

  const update = (key: string, patch: Partial<BuilderLine>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  const setQty = (l: BuilderLine, qty: number) => {
    // follow the volume tier unless the price was overridden by hand
    const followTier = l.unit_price_cents === suggested(l)
    update(l.key, { quantity: qty, ...(followTier ? { unit_price_cents: suggested(l, qty) } : {}) })
  }

  const totals = computeTotals(lines, { freight_cents: freight, tax_cents: tax, discount_cents: discount })
  const cost = lines.reduce((s, l) => s + (l.product_id && costs[l.product_id] ? costs[l.product_id] * l.quantity : 0), 0)
  const costCovered = lines.every((l) => l.product_id && costs[l.product_id])
  const unpriced = lines.filter((l) => l.unit_price_cents <= 0).length

  const payload = (): BuilderInput => ({
    id: quoteId,
    lines: lines.map(({ product_id, sku, name, quantity, unit_price_cents, quote_only }) => ({ product_id, sku, name, quantity, unit_price_cents, quote_only })),
    freight_cents: freight,
    tax_cents: tax,
    discount_cents: discount,
    valid_until: validUntil,
    customer_message: message,
    admin_notes: notes,
  })

  const run = (mode: 'draft' | 'send') => {
    if (mode === 'send' && !window.confirm(`Email this quote (${formatPrice(totals.total_cents)}) to ${customerEmail}?`)) return
    setResult(null)
    setPendingAction(mode)
    startTransition(async () => {
      const r = await (mode === 'send' ? sendQuote(payload()) : saveQuoteDraft(payload()))
      setResult(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error })
      setPendingAction(null)
      if (r.ok) router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {!editable && (
        <div className="flex items-center gap-2 text-sm bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-3 py-2">
          <Lock className="w-4 h-4" aria-hidden /> This quote is {status}; pricing is locked.
        </div>
      )}

      <section className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-black text-slate-900">Line items</h2>
          <p className="text-xs text-slate-500">
            Prices pre-filled from volume tiers{wholesalePct ? ` + ${wholesalePct}% account discount` : ''}{accountApproved && contractPrices.length ? ' or the client’s contract price, whichever is lower' : ''}. Edit any price.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {lines.map((l, i) => {
            const sugInfo = suggestion(l)
            const sug = sugInfo.cents
            const overridden = l.product_id && sug > 0 && sug !== l.unit_price_cents
            const lineCost = l.product_id ? costs[l.product_id] : 0
            const margin = lineCost && l.unit_price_cents ? Math.round((1 - lineCost / l.unit_price_cents) * 100) : null
            return (
              <div key={l.key} className="px-5 py-4 grid grid-cols-12 gap-3 items-start">
                <div className="col-span-12 md:col-span-5 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{l.name || <span className="italic text-slate-400">Unnamed item</span>}</p>
                  <p className="text-xs text-slate-500 font-mono">
                    {l.sku || 'custom'}
                    {l.quote_only && <span className="ml-2 font-sans text-[11px] font-semibold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">Quote-only — set price</span>}
                  </p>
                  {sug > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      {sugInfo.contract ? <span className="font-semibold text-emerald-700">Client contract price</span> : 'Tier price'} {formatPrice(sug)}
                      {overridden && editable && (
                        <button type="button" onClick={() => update(l.key, { unit_price_cents: sug })} className="ml-2 inline-flex items-center gap-0.5 text-orange-600 hover:underline">
                          <RotateCcw className="w-3 h-3" aria-hidden /> reset
                        </button>
                      )}
                    </p>
                  )}
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label htmlFor={`q-${l.key}`} className="block text-[11px] font-semibold text-slate-500 mb-1">Qty</label>
                  <input
                    id={`q-${l.key}`} type="number" min={1} max={100000} disabled={!editable} value={l.quantity}
                    onChange={(e) => setQty(l, Math.max(1, Math.min(100000, parseInt(e.target.value, 10) || 1)))}
                    className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 disabled:bg-slate-50"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <span className="block text-[11px] font-semibold text-slate-500 mb-1">Unit price</span>
                  <MoneyInput id={`p-${l.key}`} label={`Unit price for ${l.name}`} cents={l.unit_price_cents} disabled={!editable}
                    onChange={(c) => update(l.key, { unit_price_cents: c })} />
                  {l.unit_price_cents <= 0 && <p className="text-[11px] text-red-600 mt-1">Needs a price</p>}
                </div>
                <div className="col-span-4 md:col-span-2 text-right">
                  <span className="block text-[11px] font-semibold text-slate-500 mb-1">Line total</span>
                  <p className="py-2 text-sm font-bold text-slate-900 tabular-nums">{formatPrice(l.unit_price_cents * l.quantity)}</p>
                  {margin !== null && <p className={`text-[11px] ${margin < 15 ? 'text-red-600' : 'text-slate-400'}`}>{margin}% margin</p>}
                </div>
                <div className="col-span-1 flex justify-end pt-5">
                  {editable && (
                    <button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" aria-label={`Remove line ${i + 1}: ${l.name}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {editable && (
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-xl">
            <ProductPicker
              key={pickerKey}
              products={products}
              label="Add a product to this quote"
              value={{ sku: '', description: '' }}
              onFreeText={() => {}}
              onSelect={(p) => {
                const line = { key: `n${Date.now()}`, product_id: p.id, sku: p.sku, name: p.name, quantity: 10, quote_only: p.quote_only, unit_price_cents: 0 }
                line.unit_price_cents = suggested(line)
                setLines((ls) => [...ls, line])
                setPickerKey((k) => k + 1)
              }}
            />
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-black text-slate-900">Terms &amp; message</h2>
          <div>
            <label htmlFor="valid_until" className="block text-xs font-semibold text-slate-600 mb-1">Valid until</label>
            <input id="valid_until" type="date" disabled={!editable} value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 disabled:bg-slate-50" />
          </div>
          <div>
            <label htmlFor="customer_message" className="block text-xs font-semibold text-slate-600 mb-1">Message to customer <span className="font-normal text-slate-400">(shown on the quote and in the email)</span></label>
            <textarea id="customer_message" rows={4} disabled={!editable} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Thanks for the opportunity — freight is LTL with liftgate, ships within 2 business days of acceptance."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 disabled:bg-slate-50" />
          </div>
          <div>
            <label htmlFor="admin_notes" className="block text-xs font-semibold text-slate-600 mb-1">Internal notes <span className="font-normal text-slate-400">(never shown to the customer)</span></label>
            <textarea id="admin_notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-amber-200 bg-amber-50/40 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400" />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-black text-slate-900 mb-4">Totals</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between items-center"><dt className="text-slate-600">Subtotal</dt><dd className="font-semibold tabular-nums">{formatPrice(totals.subtotal_cents)}</dd></div>
            <div className="flex justify-between items-center gap-4"><dt><label htmlFor="freight" className="text-slate-600">LTL freight</label></dt><dd className="w-36"><MoneyInput id="freight" label="Freight" cents={freight} onChange={setFreight} disabled={!editable} /></dd></div>
            <div className="flex justify-between items-center gap-4"><dt><label htmlFor="tax" className="text-slate-600">Sales tax</label></dt><dd className="w-36"><MoneyInput id="tax" label="Sales tax" cents={tax} onChange={setTax} disabled={!editable} /></dd></div>
            <div className="flex justify-between items-center gap-4"><dt><label htmlFor="discount" className="text-slate-600">Discount</label></dt><dd className="w-36"><MoneyInput id="discount" label="Discount" cents={discount} onChange={setDiscount} disabled={!editable} /></dd></div>
            <div className="flex justify-between items-baseline border-t border-slate-200 pt-3">
              <dt className="font-black text-slate-900">Total</dt>
              <dd className="text-2xl font-black text-slate-900 tabular-nums" aria-live="polite">{formatPrice(totals.total_cents)}</dd>
            </div>
            {costCovered && cost > 0 && totals.subtotal_cents > 0 && (
              <div className="flex justify-between text-xs text-slate-500"><dt>Merchandise margin</dt><dd>{Math.round((1 - cost / (totals.subtotal_cents - totals.discount_cents)) * 100)}%</dd></div>
            )}
          </dl>

          <div className="mt-5 space-y-2">
            {unpriced > 0 && editable && <p className="text-xs text-amber-700">{unpriced} line{unpriced > 1 ? 's need' : ' needs'} a price before sending.</p>}
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={() => run('draft')} disabled={pending || !editable}
                className="flex-1 inline-flex items-center justify-center gap-2 border border-slate-300 hover:border-slate-400 bg-white text-slate-800 font-bold rounded-xl px-4 py-3 text-sm disabled:opacity-50">
                {pendingAction === 'draft' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Save className="w-4 h-4" aria-hidden />} Save draft
              </button>
              <button type="button" onClick={() => run('send')} disabled={pending || !editable || unpriced > 0 || !lines.length}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-4 py-3 text-sm disabled:bg-orange-300">
                {pendingAction === 'send' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Send className="w-4 h-4" aria-hidden />}
                {sentAt && status !== 'pending' ? 'Re-send quote' : 'Send quote'}
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center">Emails {customerEmail ?? 'the customer'} a link to review, accept and pay.</p>
            <div aria-live="polite">
              {result && (
                <p className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${result.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                  {result.ok ? <CheckCircle2 className="w-4 h-4" aria-hidden /> : <AlertCircle className="w-4 h-4" aria-hidden />} {result.text}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
