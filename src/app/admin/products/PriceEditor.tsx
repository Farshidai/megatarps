'use client'

import { Fragment, useMemo, useRef, useState, useTransition } from 'react'
import { Download, Upload, Save, Undo2, Search, Percent, ImageOff, X, ExternalLink, TrendingDown, BarChart3 } from 'lucide-react'
import { RepriceFromMarket, MarketPanel } from './RepriceFromMarket'
import { saveProductPrices, type ProductPatch, type SaveResult } from './actions'
import { parsePriceCsv, toPriceCsv, dollarsToCents, resolveSku, type CsvUpdate, type CsvParseResult } from './_lib/csv'

export interface EditorRow {
  sku: string
  name: string
  slug: string
  type: string
  mil: number | null
  line: string | null
  cost_cents: number
  retail_cents: number
  in_stock: boolean
  active: boolean
  has_image: boolean
  market_cents: number | null
  market_source: string | null
  market_url: string | null
  market_checked: string | null
}

type Edit = Partial<Pick<EditorRow, 'cost_cents' | 'retail_cents' | 'in_stock' | 'active'>>

const VIEWS: Record<string, string> = {
  all: 'All products',
  'no-retail': 'Missing retail (quote-only)',
  'no-cost': 'Missing cost',
  'low-margin': 'Margin under 25%',
  changed: 'Unsaved changes',
  'has-market': 'Has market price',
  'market-no-retail': 'Market price, no retail yet',
  inactive: 'Hidden (inactive)',
}

const fmt = (c: number) => (c / 100).toFixed(2)
const shortSource = (s: string | null) => (s ?? '').replace('.com', '').replace(/\s*\(.*\)$/, '')
function vsMarket(retail: number, market: number) {
  const d = ((retail - market) / market) * 100
  if (Math.abs(d) < 0.05) return 'at market'
  return `${Math.abs(d).toFixed(1)}% ${d < 0 ? 'below' : 'above'}`
}
function marginPct(cost: number, retail: number): number | null {
  if (!retail || !cost) return null
  return ((retail - cost) / retail) * 100
}

export function PriceEditor({ initialRows, demo }: { initialRows: EditorRow[]; demo: boolean }) {
  const [rows, setRows] = useState(initialRows)
  const [edits, setEdits] = useState<Record<string, Edit>>({})
  const [q, setQ] = useState('')
  const [view, setView] = useState('all')
  const [type, setType] = useState('')
  const [markup, setMarkup] = useState('60')
  const [result, setResult] = useState<SaveResult | null>(null)
  const [csvPreview, setCsvPreview] = useState<{ updates: CsvUpdate[]; errors: string[]; unknown: string[]; fileName: string; columns: CsvParseResult['columns'] } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [belowMarket, setBelowMarket] = useState('10')
  const [charm, setCharm] = useState(false)
  const [openMarket, setOpenMarket] = useState<Set<string>>(new Set())
  const [pending, start] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const bySku = useMemo(() => new Map(rows.map((r) => [r.sku, r])), [rows])
  const merged = useMemo(() => rows.map((r) => ({ ...r, ...edits[r.sku] })), [rows, edits])
  const types = useMemo(() => [...new Set(rows.map((r) => r.type))].sort(), [rows])

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return merged.filter((r) => {
      if (needle && !`${r.sku} ${r.name} ${r.line ?? ''}`.toLowerCase().includes(needle)) return false
      if (type && r.type !== type) return false
      switch (view) {
        case 'no-retail': return r.retail_cents === 0
        case 'no-cost': return !r.cost_cents
        case 'low-margin': { const m = marginPct(r.cost_cents, r.retail_cents); return m != null && m < 25 }
        case 'changed': return !!edits[r.sku]
        case 'inactive': return !r.active
        case 'has-market': return r.market_cents != null
        case 'market-no-retail': return r.market_cents != null && r.retail_cents === 0
        default: return true
      }
    })
  }, [merged, q, type, view, edits])

  const changedCount = Object.keys(edits).length
  const stats = useMemo(() => ({
    total: merged.length,
    priced: merged.filter((r) => r.retail_cents > 0).length,
    noCost: merged.filter((r) => !r.cost_cents).length,
  }), [merged])

  function setField(sku: string, field: keyof Edit, value: number | boolean) {
    setResult(null)
    setEdits((prev) => {
      const base = bySku.get(sku)
      if (!base) return prev
      const next = { ...prev[sku], [field]: value } as Edit
      // drop fields that equal the saved value so "changed" stays honest
      for (const k of Object.keys(next) as Array<keyof Edit>) if (next[k] === base[k]) delete next[k]
      const out = { ...prev }
      if (Object.keys(next).length) out[sku] = next
      else delete out[sku]
      return out
    })
  }

  function applyMarkup() {
    const pct = Number(markup)
    if (!Number.isFinite(pct) || pct < 0 || pct > 1000) return
    const targets = visible.filter((r) => r.cost_cents > 0)
    if (!targets.length) return
    if (!confirm(`Set retail = cost + ${pct}% (rounded to .99) on ${targets.length} visible product${targets.length === 1 ? '' : 's'} with a cost?`)) return
    for (const r of targets) {
      const raw = Math.ceil((r.cost_cents * (1 + pct / 100)) / 100) * 100 - 1 // round up to $x.99
      setField(r.sku, 'retail_cents', Math.max(raw, r.cost_cents))
    }
  }

  /** Stage retail = market − X% on the selected rows (or every visible row when none is selected). Nothing is saved until Save. */
  function applyMarketDiscount() {
    const pct = Number(belowMarket)
    if (!Number.isFinite(pct) || pct < 0 || pct >= 100) return
    const scope = selected.size ? visible.filter((r) => selected.has(r.sku)) : visible
    const targets = scope.filter((r) => r.market_cents && r.market_cents > 0)
    if (!targets.length) {
      alert('None of these rows has a market price.')
      return
    }
    const skipped = scope.length - targets.length
    const msg = `Stage retail = market − ${pct}%${charm ? ' (rounded down to .99)' : ''} on ${targets.length} ${selected.size ? 'selected' : 'visible'} product${targets.length === 1 ? '' : 's'}?` +
      (skipped ? `\n${skipped} row${skipped === 1 ? '' : 's'} without a market price will be left alone.` : '') +
      '\n\nThe new prices are only staged: review them (view switches to "Unsaved changes"), then click Save.'
    if (!confirm(msg)) return
    for (const r of targets) {
      let cents = Math.round(r.market_cents! * (1 - pct / 100))
      if (charm && cents >= 100) cents = Math.floor((cents + 1) / 100) * 100 - 1
      setField(r.sku, 'retail_cents', Math.max(1, cents))
    }
    setSelected(new Set())
    setView('changed')
  }

  function toggleSelect(sku: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(sku)
      else next.delete(sku)
      return next
    })
  }

  function save() {
    const patches: ProductPatch[] = Object.entries(edits).map(([sku, e]) => ({
      sku,
      ...(e.cost_cents !== undefined && { cost_price_cents: e.cost_cents }),
      ...(e.retail_cents !== undefined && { retail_price_cents: e.retail_cents }),
      ...(e.in_stock !== undefined && { in_stock: e.in_stock }),
      ...(e.active !== undefined && { active: e.active }),
    }))
    start(async () => {
      const res = await saveProductPrices(patches)
      setResult(res)
      if (!res.demo && res.saved > 0) {
        const failed = new Set(res.errors.map((e) => e.split(':')[0]))
        setRows((prev) => prev.map((r) => (edits[r.sku] && !failed.has(r.sku) ? { ...r, ...edits[r.sku] } : r)))
        setEdits((prev) => Object.fromEntries(Object.entries(prev).filter(([sku]) => failed.has(sku))))
      }
    })
  }

  function exportCsv() {
    const csv = toPriceCsv(merged.map((r) => ({ sku: r.sku, name: r.name, cost_cents: r.cost_cents, retail_cents: r.retail_cents, in_stock: r.in_stock, market_cents: r.market_cents })))
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `megatarps-prices-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onFile(f: File | undefined) {
    if (!f) return
    const text = await f.text()
    const { updates, errors, columns } = parsePriceCsv(text)
    // Match SKUs case-insensitively and with/without the marketplace "-X" suffix
    const index = new Map(rows.map((r) => [r.sku.toUpperCase(), r.sku]))
    const keys = new Set(index.keys())
    const matched: CsvUpdate[] = []
    const unknown: string[] = []
    for (const u of updates) {
      const key = resolveSku(u.sku, keys)
      if (key) matched.push({ ...u, sku: index.get(key)! })
      else unknown.push(u.sku)
    }
    setCsvPreview({ updates: matched, errors, unknown, fileName: f.name, columns })
    if (fileRef.current) fileRef.current.value = ''
  }

  function applyCsv() {
    if (!csvPreview) return
    for (const u of csvPreview.updates) {
      if (u.cost_cents !== undefined) setField(u.sku, 'cost_cents', u.cost_cents)
      if (u.retail_cents !== undefined) setField(u.sku, 'retail_cents', u.retail_cents)
      if (u.in_stock !== undefined) setField(u.sku, 'in_stock', u.in_stock)
    }
    setCsvPreview(null)
    setView('changed')
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Products', stats.total],
          ['Priced online', stats.priced],
          ['Quote-only', stats.total - stats.priced],
          ['Missing cost', stats.noCost],
        ].map(([label, n]) => (
          <div key={label} className="bg-white rounded-xl ring-1 ring-slate-200 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{n}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl ring-1 ring-slate-200 p-3 flex flex-wrap items-center gap-2">
        <label className="relative flex-1 min-w-[12rem]">
          <span className="sr-only">Search products</span>
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search SKU or name" className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400" />
        </label>
        <label>
          <span className="sr-only">View</span>
          <select value={view} onChange={(e) => setView(e.target.value)} className="py-2 px-2 text-sm rounded-lg border border-slate-300 bg-white">
            {Object.entries(VIEWS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Type</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className="py-2 px-2 text-sm rounded-lg border border-slate-300 bg-white">
            <option value="">All types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2 ml-1">
          <label className="text-xs text-slate-600 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5" aria-hidden />
            <span className="sr-only">Markup percent</span>
            <input value={markup} onChange={(e) => setMarkup(e.target.value)} inputMode="decimal" className="w-14 py-1.5 px-2 text-sm rounded-lg border border-slate-300 text-right" aria-label="Markup percent over cost" />
          </label>
          <button type="button" onClick={applyMarkup} className="text-xs font-semibold px-2.5 py-2 rounded-lg ring-1 ring-slate-300 hover:bg-slate-50" title="Set retail from cost for the rows shown">
            Markup shown rows
          </button>
        </div>
        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2 ml-1">
          <label className="text-xs text-slate-600 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" aria-hidden />
            <span>Market −</span>
            <input value={belowMarket} onChange={(e) => setBelowMarket(e.target.value)} inputMode="decimal" className="w-12 py-1.5 px-2 text-sm rounded-lg border border-slate-300 text-right" aria-label="Percent below market price" />
            <span>%</span>
          </label>
          <label className="text-xs text-slate-600 flex items-center gap-1" title="Round down to the nearest $x.99">
            <input type="checkbox" checked={charm} onChange={(e) => setCharm(e.target.checked)} className="w-3.5 h-3.5 accent-orange-500" /> .99
          </label>
          <button type="button" onClick={applyMarketDiscount} className="text-xs font-semibold px-2.5 py-2 rounded-lg bg-orange-50 text-orange-800 ring-1 ring-orange-300 hover:bg-orange-100" title="Set retail = market price minus X% (staged for review, not saved)">
            Set retail = market − {belowMarket || 0}% ({selected.size ? `${selected.size} selected` : `${visible.length} shown`})
          </button>
        </div>
        <RepriceFromMarket
          skus={selected.size ? visible.filter((r) => selected.has(r.sku)).map((r) => r.sku) : visible.map((r) => r.sku)}
          scopeLabel={selected.size ? `${selected.size} selected` : `${visible.length} shown`}
          onSaved={(updated) => {
            setRows((prev) => prev.map((r) => (updated[r.sku] != null ? { ...r, retail_cents: updated[r.sku] } : r)))
            setEdits((prev) => {
              const out = { ...prev }
              for (const sku of Object.keys(updated)) {
                if (out[sku]) {
                  const { retail_cents: _drop, ...rest } = out[sku]
                  if (Object.keys(rest).length) out[sku] = rest
                  else delete out[sku]
                }
              }
              return out
            })
          }}
        />
        <div className="flex items-center gap-1.5 ml-auto">
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg ring-1 ring-slate-300 hover:bg-slate-50">
            <Download className="w-4 h-4" aria-hidden /> Export CSV
          </button>
          <label className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 cursor-pointer focus-within:ring-2 focus-within:ring-orange-400">
            <Upload className="w-4 h-4" aria-hidden /> Import CSV
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </div>
      </div>

      {/* CSV preview */}
      {csvPreview && (
        <div role="dialog" aria-label="CSV import preview" className="bg-white rounded-xl ring-2 ring-orange-300 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900">Import {csvPreview.fileName}</p>
              <p className="text-sm text-slate-600 mt-0.5">
                Columns: <strong>sku, {csvPreview.columns.join(', ')}</strong>
                {(['cost', 'retail', 'in_stock'] as const).filter((c) => !csvPreview.columns.includes(c)).length > 0 && (
                  <> ({(['cost', 'retail', 'in_stock'] as const).filter((c) => !csvPreview.columns.includes(c)).join(', ')} left unchanged)</>
                )}
                {' · '}{csvPreview.updates.length} SKU{csvPreview.updates.length === 1 ? '' : 's'} matched
                {csvPreview.unknown.length > 0 && <> · <span className="text-amber-700">{csvPreview.unknown.length} unknown SKU{csvPreview.unknown.length === 1 ? '' : 's'} skipped</span></>}
                {csvPreview.errors.length > 0 && <> · <span className="text-red-700">{csvPreview.errors.length} problem{csvPreview.errors.length === 1 ? '' : 's'}</span></>}
              </p>
            </div>
            <button type="button" onClick={() => setCsvPreview(null)} aria-label="Cancel import" className="p-1 rounded hover:bg-slate-100"><X className="w-4 h-4" /></button>
          </div>
          {(csvPreview.errors.length > 0 || csvPreview.unknown.length > 0) && (
            <ul className="mt-2 max-h-32 overflow-auto text-xs text-slate-600 list-disc pl-5 space-y-0.5">
              {csvPreview.errors.slice(0, 50).map((e) => <li key={e} className="text-red-700">{e}</li>)}
              {csvPreview.unknown.slice(0, 50).map((s) => <li key={s}>Unknown SKU: {s}</li>)}
            </ul>
          )}
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={!csvPreview.updates.length} onClick={applyCsv} className="text-sm font-bold px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40">
              Apply {csvPreview.updates.length} to table
            </button>
            <p className="text-xs text-slate-500 self-center">Changes are staged for review; click Save to write them.</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl ring-1 ring-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <caption className="sr-only">Product prices, editable</caption>
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
              <th scope="col" className="pl-3 py-2.5 w-8">
                <input
                  type="checkbox"
                  aria-label="Select all shown rows"
                  className="w-4 h-4 accent-orange-500"
                  checked={visible.length > 0 && visible.every((r) => selected.has(r.sku))}
                  onChange={(e) => setSelected(e.target.checked ? new Set(visible.map((r) => r.sku)) : new Set())}
                />
              </th>
              <th scope="col" className="px-3 py-2.5 font-semibold">SKU</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Product</th>
              <th scope="col" className="px-3 py-2.5 font-semibold text-right">Market $</th>
              <th scope="col" className="px-3 py-2.5 font-semibold text-right">Cost $</th>
              <th scope="col" className="px-3 py-2.5 font-semibold text-right">Retail $</th>
              <th scope="col" className="px-3 py-2.5 font-semibold text-right">Margin</th>
              <th scope="col" className="px-3 py-2.5 font-semibold text-center">In stock</th>
              <th scope="col" className="px-3 py-2.5 font-semibold text-center">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.length === 0 && (
              <tr><td colSpan={9} className="text-center py-12 text-slate-400">No products match.</td></tr>
            )}
            {visible.map((r) => {
              const e = edits[r.sku] ?? {}
              const m = marginPct(r.cost_cents, r.retail_cents)
              return (
                <Fragment key={r.sku}>
                <tr className={e && Object.keys(e).length ? 'bg-orange-50/40' : 'hover:bg-slate-50'}>
                  <td className="pl-3 py-1.5">
                    <input type="checkbox" checked={selected.has(r.sku)} onChange={(ev) => toggleSelect(r.sku, ev.target.checked)} aria-label={`Select ${r.sku}`} className="w-4 h-4 accent-orange-500" />
                  </td>
                  <td className="px-3 py-1.5 font-mono text-xs text-slate-600 whitespace-nowrap">
                    {r.sku}
                    <button
                      type="button"
                      onClick={() => setOpenMarket((prev) => { const n = new Set(prev); if (n.has(r.sku)) n.delete(r.sku); else n.add(r.sku); return n })}
                      aria-expanded={openMarket.has(r.sku)}
                      aria-label={`Market prices for ${r.sku}`}
                      title="Market prices (all sources)"
                      data-testid="market-toggle"
                      className={`ml-1.5 inline-flex align-middle p-1 rounded hover:bg-slate-200 ${openMarket.has(r.sku) ? 'bg-slate-200 text-slate-900' : 'text-slate-400'}`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" aria-hidden />
                    </button>
                  </td>
                  <td className="px-3 py-1.5">
                    <a href={`/product/${r.slug}`} target="_blank" rel="noreferrer" className="font-semibold text-slate-900 hover:text-orange-600 text-xs leading-snug line-clamp-1 max-w-[22rem]">
                      {r.name}
                    </a>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      {r.line ?? r.type}
                      {!r.has_image && <span className="inline-flex items-center gap-0.5 text-slate-400" title="No photo — shows branded placeholder"><ImageOff className="w-3 h-3" aria-hidden /> no photo</span>}
                    </p>
                  </td>
                  <td className="px-3 py-1.5 text-right whitespace-nowrap">
                    {r.market_cents ? (
                      <div className="leading-tight">
                        <a
                          href={r.market_url ?? undefined}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800 hover:text-orange-600 tabular-nums"
                          title={`${r.market_source ?? 'Source'}${r.market_checked ? ` · checked ${r.market_checked}` : ''}`}
                        >
                          {fmt(r.market_cents)} <ExternalLink className="w-3 h-3 text-slate-400" aria-hidden />
                          <span className="sr-only">(opens {r.market_source})</span>
                        </a>
                        <p className="text-[10px] text-slate-400 truncate max-w-[8rem] ml-auto">{shortSource(r.market_source)}</p>
                        {r.retail_cents > 0 && (
                          <p className={`text-[10px] font-semibold ${r.retail_cents <= r.market_cents ? 'text-green-700' : 'text-amber-700'}`}>
                            {vsMarket(r.retail_cents, r.market_cents)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <MoneyInput label={`Cost for ${r.sku}`} cents={r.cost_cents} changed={'cost_cents' in e} onCommit={(c) => setField(r.sku, 'cost_cents', c)} />
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <MoneyInput label={`Retail for ${r.sku}`} cents={r.retail_cents} changed={'retail_cents' in e} onCommit={(c) => setField(r.sku, 'retail_cents', c)} placeholder="quote" />
                  </td>
                  <td className={`px-3 py-1.5 text-right tabular-nums text-xs font-bold ${m == null ? 'text-slate-300' : m < 15 ? 'text-red-600' : m < 30 ? 'text-amber-600' : 'text-green-700'}`}>
                    {m == null ? '—' : `${m.toFixed(1)}%`}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <input type="checkbox" checked={r.in_stock} onChange={(ev) => setField(r.sku, 'in_stock', ev.target.checked)} aria-label={`${r.sku} in stock`} className="w-4 h-4 accent-orange-500" />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <input type="checkbox" checked={r.active} onChange={(ev) => setField(r.sku, 'active', ev.target.checked)} aria-label={`${r.sku} active`} className="w-4 h-4 accent-orange-500" />
                  </td>
                </tr>
                {openMarket.has(r.sku) && (
                  <tr><td colSpan={9} className="p-0"><MarketPanel sku={r.sku} /></td></tr>
                )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">Showing {visible.length} of {merged.length}. Margin = (retail − cost) ÷ retail. Tip: Tab moves to the next price; Enter commits.</p>

      {/* Save bar */}
      <div className="sticky bottom-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 bg-white/95 backdrop-blur border-t border-slate-200 px-4 sm:px-8 py-3 flex items-center gap-3 flex-wrap">
        <p className="text-sm text-slate-700" aria-live="polite">
          {result ? (
            <span className={result.ok ? 'text-green-700 font-semibold' : result.demo ? 'text-amber-800 font-semibold' : 'text-red-700 font-semibold'}>
              {result.message}
              {result.errors.length > 0 && <span className="font-normal"> {result.errors.slice(0, 3).join('; ')}{result.errors.length > 3 ? '…' : ''}</span>}
            </span>
          ) : changedCount ? (
            <><strong>{changedCount}</strong> unsaved change{changedCount === 1 ? '' : 's'}{demo && <span className="text-amber-700"> · demo mode, won&apos;t be saved</span>}</>
          ) : (
            <span className="text-slate-400">No unsaved changes</span>
          )}
        </p>
        <div className="ml-auto flex gap-2">
          <button type="button" disabled={!changedCount || pending} onClick={() => { setEdits({}); setResult(null) }} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-40">
            <Undo2 className="w-4 h-4" aria-hidden /> Discard
          </button>
          <button type="button" disabled={!changedCount || pending} onClick={save} className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40">
            <Save className="w-4 h-4" aria-hidden /> {pending ? 'Saving…' : `Save${changedCount ? ` ${changedCount}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function MoneyInput({ cents, onCommit, label, changed, placeholder }: { cents: number; onCommit: (c: number) => void; label: string; changed: boolean; placeholder?: string }) {
  // Re-mount when the committed value changes (CSV import / markup) so the text resets.
  return <MoneyInputInner key={cents} cents={cents} onCommit={onCommit} label={label} changed={changed} placeholder={placeholder} />
}

function MoneyInputInner({ cents, onCommit, label, changed, placeholder }: { cents: number; onCommit: (c: number) => void; label: string; changed: boolean; placeholder?: string }) {
  const [text, setText] = useState(cents ? fmt(cents) : '')
  const parsed = dollarsToCents(text)
  const invalid = Number.isNaN(parsed)
  const commit = () => {
    if (invalid) return
    const v = parsed ?? 0
    if (v !== cents) onCommit(v)
    setText(v ? fmt(v) : '')
  }
  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() } }}
      inputMode="decimal"
      aria-label={label}
      aria-invalid={invalid || undefined}
      placeholder={placeholder ?? '0.00'}
      className={`w-24 text-right tabular-nums py-1 px-2 rounded-md border text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${invalid ? 'border-red-400 bg-red-50' : changed ? 'border-orange-400 bg-orange-50 font-semibold' : 'border-slate-200 bg-white'}`}
    />
  )
}
