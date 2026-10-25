'use client'
import { site } from '@/lib/site'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, Send, Truck, CalendarDays, MapPin, CheckCircle2, ShoppingCart, Bot, Loader2, Package } from 'lucide-react'
import { CART_STORAGE_KEY, type CartItem } from '@/lib/cart/types'
import { unitPriceCents, type PricingRule } from '@/lib/pricing'
import { formatPrice } from '@/lib/utils'
import { ProductPicker } from '@/components/quotes/ProductPicker'
import { DELIVERY_LABELS, DELIVERY_TYPES, type DeliveryType, type PickerProduct } from '@/lib/quotes/types'

interface Line {
  key: string
  product_id: string | null
  sku: string
  description: string
  quantity: number
}

let keySeq = 0
const newKey = () => `l${++keySeq}`
const blankLine = (qty = 10): Line => ({ key: newKey(), product_id: null, sku: '', description: '', quantity: qty })

const inputCls =
  'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 aria-[invalid=true]:border-red-400'

interface Props {
  products: PickerProduct[]
  rules: PricingRule[]
  defaultEmail?: string | null
}

type Source = 'form' | 'cart' | 'chat' | 'product'

export function BulkQuoteForm({ products, rules, defaultEmail }: Props) {
  const searchParams = useSearchParams()
  const bySku = useMemo(() => new Map(products.map((p) => [p.sku.toLowerCase(), p])), [products])
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  const [lines, setLines] = useState<Line[]>(() => [blankLine()])
  const [source, setSource] = useState<Source>('form')
  const [form, setForm] = useState({
    name: '', email: defaultEmail ?? '', phone: '', company: '',
    project_type: '', project_location: '', timeline: 'flexible', special_requirements: '',
    delivery_type: 'dock' as DeliveryType, delivery_zip: '', needed_by: '',
    shipping_name: '', shipping_line1: '', shipping_city: '', shipping_state: '',
    website: '', // honeypot
  })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ quote_number: string; token?: string } | null>(null)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const errorRef = useRef<HTMLDivElement>(null)

  // ---- prefill: ?from=cart, ?items=SKU:QTY,... (AI chat), ?sku=&name=&qty= (product page) ----
  useEffect(() => {
    const fromProduct = (sku: string, qty: number, fallbackName = ''): Line => {
      const p = bySku.get(sku.toLowerCase())
      return { key: newKey(), product_id: p?.id ?? null, sku: p?.sku ?? sku, description: p ? '' : fallbackName || sku, quantity: qty }
    }
    const from = searchParams.get('from')
    const itemsParam = searchParams.get('items')
    const sku = searchParams.get('sku')
    const name = searchParams.get('name')
    const qty = Math.max(1, parseInt(searchParams.get('qty') ?? '', 10) || 10)

    let next: Line[] | null = null
    let src: Source = 'form'
    if (from === 'cart') {
      try {
        const raw = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? 'null')
        const items: CartItem[] = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : []
        next = items
          .filter((i) => i && (i.sku || i.name) && i.quantity > 0)
          .map((i) => {
            const p = byId.get(i.product_id) ?? bySku.get(String(i.sku).toLowerCase())
            return { key: newKey(), product_id: p?.id ?? null, sku: p?.sku ?? i.sku, description: p ? '' : i.name, quantity: Math.floor(i.quantity) }
          })
        src = 'cart'
      } catch {
        next = null
      }
    } else if (itemsParam) {
      next = itemsParam
        .split(',')
        .map((pair) => pair.split(':'))
        .filter(([s]) => s?.trim())
        .slice(0, 20)
        .map(([s, q]) => fromProduct(s.trim(), Math.max(1, parseInt(q ?? '', 10) || 10)))
      src = from === 'chat' ? 'chat' : 'form'
    } else if (sku || name) {
      next = [fromProduct(sku ?? '', qty, name ?? '')]
      src = 'product'
    }
    if (next?.length) {
      setLines(next)
      setSource(src)
    }
  }, [searchParams, bySku, byId])

  const updateLine = (key: string, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const removeLine = (key: string) => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : [blankLine()]))
  const addLine = () => setLines((ls) => [...ls, blankLine()])

  // ---- live estimate at list tier pricing (display only; the quote is priced server-side) ----
  const estimate = useMemo(() => {
    let cents = 0
    let quoteOnly = 0
    let units = 0
    for (const l of lines) {
      const p = l.product_id ? byId.get(l.product_id) : undefined
      if (!l.product_id && !l.description.trim()) continue
      units += l.quantity
      if (!p || p.quote_only) quoteOnly++
      else cents += unitPriceCents(p, l.quantity, rules) * l.quantity
    }
    return { cents, quoteOnly, units }
  }, [lines, byId, rules])

  const filledLines = lines.filter((l) => l.product_id || l.description.trim())
  const today = new Date().toISOString().slice(0, 10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    if (!filledLines.length) {
      setFieldErrors({ items: 'Add at least one product' })
      setError('Add at least one product.')
      errorRef.current?.focus()
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source,
          items: filledLines.map((l) => ({ product_id: l.product_id, sku: l.sku, description: l.description, quantity: l.quantity })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFieldErrors(data.fields ?? {})
        setError(data.error ?? 'Something went wrong. Please try again or call us at ' + site.phoneDisplay + '.')
        setTimeout(() => errorRef.current?.focus(), 0)
        return
      }
      setResult({ quote_number: data.quote_number, token: data.token })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Network error. Please try again or call us at ' + site.phoneDisplay + '.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="text-center py-10" role="status">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" aria-hidden />
        <h2 className="text-2xl font-black text-slate-900 mb-2">Quote request received</h2>
        <p className="text-slate-600 mb-1">
          Request <span className="font-mono font-bold text-slate-900">{result.quote_number}</span> is with our team.
        </p>
        <p className="text-slate-600 mb-6">
          We&apos;ll email a priced quote with LTL freight to <strong>{form.email}</strong> within one business day.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {result.token && (
            <Link href={`/quote/${result.token}`} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl text-sm">
              Track this request
            </Link>
          )}
          <Link href="/products" className="border border-slate-300 hover:border-orange-400 text-slate-700 font-semibold px-6 py-3 rounded-xl text-sm">
            Continue browsing
          </Link>
        </div>
        <p className="text-slate-400 text-sm mt-6">Questions? Call {site.phoneDisplay}</p>
      </div>
    )
  }

  const fe = fieldErrors

  return (
    <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {source !== 'form' && (
          <div className="flex items-center gap-2 text-sm bg-orange-50 border border-orange-200 text-orange-800 rounded-lg px-3 py-2">
            {source === 'cart' ? <ShoppingCart className="w-4 h-4" aria-hidden /> : source === 'chat' ? <Bot className="w-4 h-4" aria-hidden /> : <Package className="w-4 h-4" aria-hidden />}
            {source === 'cart' && 'Pre-filled from your cart. Adjust quantities or add more lines.'}
            {source === 'chat' && 'Pre-filled from your chat with our tarp expert. Review and adjust.'}
            {source === 'product' && 'Pre-filled from the product page.'}
          </div>
        )}

        {/* Products */}
        <fieldset>
          <legend className="text-lg font-black text-slate-900 mb-1">Products</legend>
          <p className="text-sm text-slate-500 mb-4">Search by SKU or size. Pallet SKUs are quote-only and priced by the truckload.</p>
          <div className="space-y-3">
            {lines.map((l, i) => {
              const p = l.product_id ? byId.get(l.product_id) : undefined
              const unit = p && !p.quote_only ? unitPriceCents(p, l.quantity, rules) : 0
              return (
                <div key={l.key} className="grid grid-cols-12 gap-2 sm:gap-3 items-end bg-slate-50/60 sm:bg-transparent rounded-lg p-2 sm:p-0">
                  <div className="col-span-12 sm:col-span-7">
                    <ProductPicker
                      products={products}
                      label={`Product, line ${i + 1}`}
                      hideLabel={i > 0}
                      invalid={!!fe.items && !l.product_id && !l.description.trim()}
                      value={{ sku: l.sku, description: l.description, product_id: l.product_id }}
                      onSelect={(prod) => updateLine(l.key, { product_id: prod.id, sku: prod.sku, description: '' })}
                      onFreeText={(text) => updateLine(l.key, { product_id: null, sku: '', description: text })}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <label htmlFor={`qty-${l.key}`} className={i > 0 ? 'sr-only' : 'block text-xs font-semibold text-slate-600 mb-1'}>
                      Qty{i > 0 ? `, line ${i + 1}` : ''}
                    </label>
                    <input
                      id={`qty-${l.key}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={100000}
                      value={l.quantity}
                      onChange={(e) => updateLine(l.key, { quantity: Math.max(1, Math.min(100000, parseInt(e.target.value, 10) || 1)) })}
                      className={inputCls}
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2 text-right">
                    {i === 0 && <span className="hidden sm:block text-xs font-semibold text-slate-600 mb-1">Est. each</span>}
                    <span className="h-[42px] flex items-center justify-end text-sm text-slate-700 tabular-nums">
                      {p ? (p.quote_only ? <span className="text-orange-600 font-semibold text-xs">Quote</span> : formatPrice(unit)) : <span className="text-slate-400">—</span>}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeLine(l.key)}
                      className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      aria-label={`Remove line ${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {fe.items && <p className="text-sm text-red-600 mt-2">{fe.items}</p>}
          <button type="button" onClick={addLine} className="mt-3 inline-flex items-center gap-2 text-sm text-orange-600 font-semibold hover:text-orange-700 rounded">
            <Plus className="w-4 h-4" aria-hidden /> Add a line
          </button>
        </fieldset>

        {/* Delivery */}
        <fieldset>
          <legend className="text-lg font-black text-slate-900 mb-1">Delivery</legend>
          <p className="text-sm text-slate-500 mb-4">Pallets ship LTL truck freight. This is what we need to quote freight accurately.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4" role="radiogroup" aria-label="Delivery type">
            {DELIVERY_TYPES.map((t) => (
              <label
                key={t}
                className={`cursor-pointer rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-orange-400 ${form.delivery_type === t ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <input type="radio" name="delivery_type" value={t} checked={form.delivery_type === t} onChange={set('delivery_type')} className="sr-only" />
                <span className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <Truck className={`w-4 h-4 ${form.delivery_type === t ? 'text-orange-600' : 'text-slate-400'}`} aria-hidden />
                  {DELIVERY_LABELS[t].label}
                </span>
                <span className="block text-xs text-slate-500 mt-1">{DELIVERY_LABELS[t].hint}</span>
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="delivery_zip" className="block text-sm font-semibold text-slate-700 mb-1">Delivery ZIP *</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
                <input
                  id="delivery_zip" required inputMode="numeric" autoComplete="postal-code" maxLength={10}
                  value={form.delivery_zip} onChange={set('delivery_zip')} placeholder="64101"
                  aria-invalid={!!fe.delivery_zip} aria-describedby={fe.delivery_zip ? 'delivery_zip-err' : undefined}
                  className={`${inputCls} pl-9`}
                />
              </div>
              {fe.delivery_zip && <p id="delivery_zip-err" className="text-xs text-red-600 mt-1">{fe.delivery_zip}</p>}
            </div>
            <div>
              <label htmlFor="needed_by" className="block text-sm font-semibold text-slate-700 mb-1">Needed on site by</label>
              <div className="relative">
                <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
                <input id="needed_by" type="date" min={today} value={form.needed_by} onChange={set('needed_by')} aria-invalid={!!fe.needed_by} className={`${inputCls} pl-9`} />
              </div>
            </div>
          </div>
          <details className="mt-4 group">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700 hover:text-orange-600 select-none">
              Full ship-to address <span className="font-normal text-slate-400">(optional now, needed before we ship)</span>
            </summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <label htmlFor="shipping_name" className="block text-xs font-semibold text-slate-600 mb-1">Receiving contact</label>
                <input id="shipping_name" autoComplete="shipping name" value={form.shipping_name} onChange={set('shipping_name')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="shipping_line1" className="block text-xs font-semibold text-slate-600 mb-1">Street address</label>
                <input id="shipping_line1" autoComplete="shipping address-line1" value={form.shipping_line1} onChange={set('shipping_line1')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="shipping_city" className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                <input id="shipping_city" autoComplete="shipping address-level2" value={form.shipping_city} onChange={set('shipping_city')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="shipping_state" className="block text-xs font-semibold text-slate-600 mb-1">State</label>
                <input id="shipping_state" autoComplete="shipping address-level1" maxLength={2} value={form.shipping_state} onChange={set('shipping_state')} placeholder="MO" className={`${inputCls} uppercase`} />
              </div>
            </div>
          </details>
        </fieldset>

        {/* Contact */}
        <fieldset>
          <legend className="text-lg font-black text-slate-900 mb-4">Your details</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">Full name *</label>
              <input id="name" required autoComplete="name" value={form.name} onChange={set('name')} aria-invalid={!!fe.name} className={inputCls} placeholder="John Smith" />
              {fe.name && <p className="text-xs text-red-600 mt-1">{fe.name}</p>}
            </div>
            <div>
              <label htmlFor="company" className="block text-sm font-semibold text-slate-700 mb-1">Company</label>
              <input id="company" autoComplete="organization" value={form.company} onChange={set('company')} className={inputCls} placeholder="Smith Roofing LLC" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
              <input id="email" required type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={!!fe.email} className={inputCls} placeholder="john@smithroofing.com" />
              {fe.email && <p className="text-xs text-red-600 mt-1">{fe.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
              <input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} className={inputCls} placeholder="(555) 000-0000" />
            </div>
          </div>
          {/* honeypot */}
          <div className="hidden" aria-hidden>
            <label htmlFor="website">Website</label>
            <input id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
          </div>
        </fieldset>

        {/* Project */}
        <fieldset>
          <legend className="text-lg font-black text-slate-900 mb-4">Project <span className="text-sm font-normal text-slate-400">(optional)</span></legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="project_type" className="block text-sm font-semibold text-slate-700 mb-1">Project type</label>
              <select id="project_type" value={form.project_type} onChange={set('project_type')} className={`${inputCls} bg-white`}>
                <option value="">Select…</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="agricultural">Agricultural</option>
                <option value="industrial">Industrial</option>
                <option value="resale">Resale / distribution</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="project_location" className="block text-sm font-semibold text-slate-700 mb-1">Jobsite city</label>
              <input id="project_location" value={form.project_location} onChange={set('project_location')} className={inputCls} placeholder="Kansas City, MO" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="special_requirements" className="block text-sm font-semibold text-slate-700 mb-1">Notes for our team</label>
              <textarea
                id="special_requirements" rows={3} value={form.special_requirements} onChange={set('special_requirements')}
                className={`${inputCls} resize-y`} placeholder="Colors, fire-retardant certs, split delivery, delivery window…"
              />
            </div>
          </div>
        </fieldset>
      </div>

      {/* Summary */}
      <aside className="lg:col-span-1">
        <div className="lg:sticky lg:top-28 bg-slate-900 text-white rounded-2xl p-5 space-y-4">
          <h2 className="font-black text-lg">Request summary</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-slate-400">Lines</dt><dd className="tabular-nums">{filledLines.length}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Total units</dt><dd className="tabular-nums">{estimate.units.toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Delivery</dt><dd>{DELIVERY_LABELS[form.delivery_type].label}{form.delivery_zip ? ` · ${form.delivery_zip}` : ''}</dd></div>
            {form.needed_by && <div className="flex justify-between"><dt className="text-slate-400">Needed by</dt><dd>{new Date(form.needed_by + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</dd></div>}
          </dl>
          <div className="border-t border-slate-700 pt-4">
            <p className="text-xs text-slate-400">Est. at volume-tier pricing</p>
            <p className="text-3xl font-black tabular-nums">{formatPrice(estimate.cents)}</p>
            <p className="text-xs text-slate-400 mt-1">
              {estimate.quoteOnly > 0 && <>+ {estimate.quoteOnly} pallet/custom line{estimate.quoteOnly > 1 ? 's' : ''} priced in your quote. </>}
              Before freight and tax. Approved wholesale accounts get extra pricing.
            </p>
          </div>

          <div ref={errorRef} tabIndex={-1} aria-live="assertive" className="outline-none">
            {error && <div className="bg-red-500/15 border border-red-400/40 text-red-100 rounded-lg p-3 text-sm">{error}</div>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors focus-visible:outline-white"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : <Send className="w-5 h-5" aria-hidden />}
            {submitting ? 'Sending…' : 'Request quote'}
          </button>
          <p className="text-center text-xs text-slate-400">Priced quote within 1 business day · No obligation</p>
        </div>
      </aside>
    </form>
  )
}
