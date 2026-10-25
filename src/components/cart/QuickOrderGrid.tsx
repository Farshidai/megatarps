'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, ClipboardPaste, ShoppingCart, CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { unitPriceCents, type PricingRule } from '@/lib/pricing'
import type { CatalogEntry } from '@/lib/cart/catalog-types'
import { cartItemFromEntry } from '@/lib/cart/catalog-types'
import { parsePastedList, resolveEntry } from '@/lib/cart/quick-order'
import { nextTier } from '@/lib/cart/tiers'
import { useCart } from '@/lib/cart/useCart'
import { MAX_LINE_QUANTITY } from '@/lib/cart/constants'
import { calculateFreight, formatLb, freightMethodLabel, type FreightConfig } from '@/lib/freight'
import { SkuCombobox } from './SkuCombobox'

interface Row {
  id: number
  query: string
  entry: CatalogEntry | null
  qty: string
  error?: string
}

interface Props {
  catalog: CatalogEntry[]
  rules: PricingRule[]
  wholesaleDiscountPercent: number
  freight: FreightConfig
}

let nextId = 1
const blank = (): Row => ({ id: nextId++, query: '', entry: null, qty: '1' })

function rowQty(r: Row): number | null {
  const n = Number(r.qty)
  return Number.isInteger(n) && n >= 1 && n <= MAX_LINE_QUANTITY ? n : null
}

export function QuickOrderGrid({ catalog, rules, wholesaleDiscountPercent, freight: freightConfig }: Props) {
  const cart = useCart()
  const opts = { wholesaleDiscountPercent }
  const [rows, setRows] = useState<Row[]>(() => [blank(), blank(), blank(), blank(), blank()])
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [notice, setNotice] = useState<{ kind: 'ok' | 'warn'; text: string } | null>(null)
  const inputs = useRef(new Map<number, HTMLInputElement>())

  const update = (id: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const resolveRow = (r: Row) => {
    if (r.entry || !r.query.trim()) return
    const e = resolveEntry(catalog, r.query)
    update(r.id, e ? { entry: e, query: e.sku, error: undefined } : { error: 'No exact match. Pick from the list.' })
  }

  const importList = (text: string) => {
    const parsed = parsePastedList(text)
    if (!parsed.length) return
    const imported: Row[] = parsed.map((p) => {
      const entry = p.error ? null : resolveEntry(catalog, p.query)
      return {
        id: nextId++,
        query: entry?.sku ?? p.query,
        entry,
        qty: String(p.quantity),
        error: p.error ?? (entry ? undefined : `Line ${p.line}: "${p.query}" not found`),
      }
    })
    setRows((rs) => [...rs.filter((r) => r.query.trim() || r.entry), ...imported])
    const bad = imported.filter((r) => r.error).length
    setNotice(
      bad
        ? { kind: 'warn', text: `Imported ${imported.length - bad} of ${imported.length} lines. Fix the ${bad} highlighted row${bad > 1 ? 's' : ''}.` }
        : { kind: 'ok', text: `Imported ${imported.length} line${imported.length > 1 ? 's' : ''}.` },
    )
    setPasteText('')
    setPasteOpen(false)
  }

  const ready = rows.filter((r) => r.entry && rowQty(r) && (r.entry.quote_only || r.entry.in_stock))
  const subtotal = ready.reduce((s, r) => (r.entry!.quote_only ? s : s + unitPriceCents(r.entry!, rowQty(r)!, rules, opts) * rowQty(r)!), 0)
  const quoteCount = ready.filter((r) => r.entry!.quote_only).length
  const pricedReady = ready.filter((r) => !r.entry!.quote_only)
  const freight = pricedReady.length
    ? calculateFreight(pricedReady.map((r) => ({ sku: r.entry!.sku, quantity: rowQty(r)!, unitWeightLb: r.entry!.unit_weight_lb })), freightConfig, subtotal)
    : null

  const addAll = () => {
    if (!ready.length) return
    cart.addItems(ready.map((r) => cartItemFromEntry(r.entry!, rowQty(r)!)))
    const units = ready.reduce((s, r) => s + rowQty(r)!, 0)
    const leftovers = rows.filter((r) => !ready.includes(r) && (r.query.trim() || r.entry))
    setRows(leftovers.length ? leftovers : [blank(), blank(), blank(), blank(), blank()])
    setNotice({ kind: 'ok', text: `Added ${ready.length} line${ready.length > 1 ? 's' : ''} (${units.toLocaleString()} units) to your cart.` })
    cart.openDrawer()
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div role="status" className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${notice.kind === 'ok' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-amber-50 border border-amber-200 text-amber-900'}`}>
          {notice.kind === 'ok' ? <CheckCircle2 className="w-4 h-4 mt-0.5" aria-hidden /> : <AlertTriangle className="w-4 h-4 mt-0.5" aria-hidden />}
          <span className="flex-1">
            {notice.text} {notice.kind === 'ok' && cart.lineCount > 0 && <Link href="/cart" className="font-semibold underline">View cart</Link>}
          </span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setPasteOpen((o) => !o)} aria-expanded={pasteOpen} className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:border-orange-400 text-slate-800 font-semibold text-sm px-4 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
          <ClipboardPaste className="w-4 h-4 text-orange-500" aria-hidden /> Paste a list
        </button>
        <button type="button" onClick={() => setRows((rs) => [...rs, blank(), blank(), blank(), blank(), blank()])} className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm px-4 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
          <Plus className="w-4 h-4" aria-hidden /> Add 5 rows
        </button>
        <button type="button" onClick={() => { setRows([blank(), blank(), blank(), blank(), blank()]); setNotice(null) }} className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2">
          Clear all
        </button>
      </div>

      {pasteOpen && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <label htmlFor="paste-list" className="block font-semibold text-slate-900">Paste from Excel, email or a PO</label>
          <p className="text-sm text-slate-500 mt-1">One item per line: <span className="font-mono">SKU, qty</span>. Tabs and spaces work too (<span className="font-mono">MT-20X30-10MIL 12</span>).</p>
          <textarea
            id="paste-list"
            rows={6}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={'MT-20X30-10MIL, 12\nMT-30X40-12MIL, 4\nBB-9B-10, 20'}
            className="mt-3 w-full font-mono text-sm border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
          />
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => importList(pasteText)} disabled={!pasteText.trim()} className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-sm px-5 py-2.5 rounded-lg">Import lines</button>
            <button type="button" onClick={() => setPasteOpen(false)} className="text-sm text-slate-500 px-3">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="hidden md:grid grid-cols-[2rem_minmax(14rem,1.2fr)_1.5fr_7rem_7rem_7rem_2.5rem] gap-3 px-5 py-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400 rounded-t-2xl bg-slate-50">
          <span>#</span><span>SKU / size</span><span>Product</span><span>Qty</span><span className="text-right">Unit</span><span className="text-right">Line total</span><span />
        </div>
        <ol className="divide-y divide-slate-100">
          {rows.map((r, idx) => {
            const q = rowQty(r)
            const e = r.entry
            const unit = e && q && !e.quote_only ? unitPriceCents(e, q, rules, opts) : 0
            const nudge = e && q && !e.quote_only ? nextTier(e, q, rules, opts) : null
            const rowError = r.error ?? (e && !e.quote_only && !e.in_stock ? 'Out of stock' : r.qty !== '' && !q ? `Qty 1–${MAX_LINE_QUANTITY}` : undefined)
            return (
              <li key={r.id} className="grid grid-cols-[1fr_auto] md:grid-cols-[2rem_minmax(14rem,1.2fr)_1.5fr_7rem_7rem_7rem_2.5rem] gap-x-3 gap-y-2 px-4 md:px-5 py-3 items-start" data-testid="qo-row">
                <span className="hidden md:block text-sm text-slate-400 pt-2">{idx + 1}</span>
                <div className="col-span-1">
                  <SkuCombobox
                    catalog={catalog}
                    label={`Row ${idx + 1} SKU or size`}
                    value={r.query}
                    invalid={!!r.error}
                    inputRef={(el) => (el ? inputs.current.set(r.id, el) : inputs.current.delete(r.id))}
                    onChange={(text) => update(r.id, { query: text, entry: null, error: undefined })}
                    onSelect={(entry) => {
                      update(r.id, { query: entry.sku, entry, error: undefined })
                      if (idx === rows.length - 1) setRows((rs) => [...rs, blank()])
                    }}
                    onPasteList={importList}
                  />
                </div>
                <button type="button" onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.id !== r.id) : [blank()]))} aria-label={`Remove row ${idx + 1}`} className="md:hidden p-2 text-slate-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="col-span-2 md:col-span-1 min-w-0 md:pt-1.5 text-sm">
                  {e ? (
                    <Link href={`/product/${e.slug}`} className="text-slate-900 hover:text-orange-600 line-clamp-2">{e.name}</Link>
                  ) : r.query && !r.error ? (
                    <button type="button" onClick={() => resolveRow(r)} className="text-slate-400 hover:text-orange-600">Match “{r.query}”</button>
                  ) : null}
                  {rowError && <p className="text-xs text-red-600 mt-0.5" role="alert">{rowError}</p>}
                  {nudge && <button type="button" onClick={() => update(r.id, { qty: String(nudge.atQty) })} className="block text-xs text-orange-700 hover:underline mt-0.5">Add {nudge.addQty} more to save {nudge.discountPercent}%</button>}
                </div>
                <div className="flex items-center gap-2 md:block">
                  <label htmlFor={`qo-qty-${r.id}`} className="md:sr-only text-xs text-slate-500">Qty</label>
                  <input
                    id={`qo-qty-${r.id}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_LINE_QUANTITY}
                    value={r.qty}
                    onFocus={() => resolveRow(r)}
                    onChange={(ev) => update(r.id, { qty: ev.target.value })}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter') {
                        ev.preventDefault()
                        const nextRow = rows[idx + 1]
                        if (nextRow) inputs.current.get(nextRow.id)?.focus()
                        else {
                          const nb = blank()
                          setRows((rs) => [...rs, nb])
                          setTimeout(() => inputs.current.get(nb.id)?.focus(), 0)
                        }
                      }
                    }}
                    className="w-24 md:w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
                  />
                </div>
                <p className="text-right text-sm text-slate-600 md:pt-2">
                  <span className="md:hidden text-xs text-slate-400 mr-1">Unit</span>
                  {e ? (e.quote_only ? <span className="text-orange-700 font-semibold">Quote</span> : unit ? formatPrice(unit) : '—') : '—'}
                </p>
                <p className="hidden md:block text-right text-sm font-bold text-slate-900 pt-2">{unit && q ? formatPrice(unit * q) : '—'}</p>
                <button type="button" onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.id !== r.id) : [blank()]))} aria-label={`Remove row ${idx + 1}`} className="hidden md:flex p-2 text-slate-400 hover:text-red-600 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            )
          })}
        </ol>
        <div className="px-5 py-3 border-t border-slate-100">
          <button type="button" onClick={() => setRows((rs) => [...rs, blank()])} className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700">
            <Plus className="w-4 h-4" aria-hidden /> Add row
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:sticky md:bottom-3 shadow-lg">
        <div className="text-sm text-slate-600">
          <p>
            <strong className="text-slate-900">{ready.length}</strong> line{ready.length === 1 ? '' : 's'} ready
            {quoteCount > 0 && <span> · {quoteCount} by quote</span>}
          </p>
          <p className="text-xl font-black text-slate-900" data-testid="qo-subtotal">{formatPrice(subtotal)}</p>
          {freight && (
            <p className="text-xs text-slate-500" data-testid="qo-freight">
              {freight.unknownWeightSkus.length ? 'Ship weight not listed for some items' : `${formatLb(freight.totalWeightLb)} lb`} · {freightMethodLabel(freight.method)}
              {freight.method === 'quote' ? ' (freight quoted separately)' : freight.free ? ' · free' : ` · ${formatPrice(freight.freightCents ?? 0)} freight`}
            </p>
          )}
          {wholesaleDiscountPercent > 0 && <p className="text-xs text-slate-500">Includes your {wholesaleDiscountPercent}% wholesale discount</p>}
        </div>
        <button
          type="button"
          onClick={addAll}
          disabled={!ready.length}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold px-6 py-3.5 rounded-xl inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
          data-testid="qo-add-all"
        >
          <ShoppingCart className="w-5 h-5" aria-hidden /> Add all to cart
        </button>
      </div>
    </div>
  )
}
