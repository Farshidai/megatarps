'use client'

import { useEffect, useState, useTransition } from 'react'
import { TrendingDown, X, Save, Loader2, ExternalLink } from 'lucide-react'
import {
  previewRepriceFromMarket, saveRepriceFromMarket, getMarketObservations,
  type RepricePreview, type RepriceSaveResult, type MarketPanelData,
} from './market-actions'
import { TTW_SOURCE } from '@/lib/reprice'

const money = (c: number | null | undefined) => (c == null ? '—' : `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
const KIND_LABEL: Record<string, string> = { full_pallet: 'Full pallet', half_pallet: 'Half pallet', single: 'Single', case: 'Case', pack: 'Pack' }

/** Toolbar control + preview dialog. `skus` = the selected rows, or every row shown. */
export function RepriceFromMarket({ skus, scopeLabel, onSaved }: { skus: string[]; scopeLabel: string; onSaved: (updated: Record<string, number>) => void }) {
  const [percent, setPercent] = useState('5')
  const [source, setSource] = useState<string>(TTW_SOURCE)
  const [preview, setPreview] = useState<RepricePreview | null>(null)
  const [result, setResult] = useState<RepriceSaveResult | null>(null)
  const [onlyChanges, setOnlyChanges] = useState(true)
  const [pending, start] = useTransition()

  const req = () => ({ skus, percent: Number(percent), source: source || null })

  function open() {
    setResult(null)
    start(async () => setPreview(await previewRepriceFromMarket(req())))
  }

  function save() {
    start(async () => {
      const res = await saveRepriceFromMarket(req())
      setResult(res)
      if (!res.demo && res.saved > 0) onSaved(res.updated)
    })
  }

  const rows = preview?.rows ?? []
  const changing = rows.filter((r) => r.status === 'ok' || r.status === 'floor')
  const shown = onlyChanges ? changing : rows

  return (
    <>
      <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2 ml-1">
        <label className="text-xs text-slate-600 flex items-center gap-1">
          <span>Pallet mkt −</span>
          <input value={percent} onChange={(e) => setPercent(e.target.value)} inputMode="decimal" className="w-12 py-1.5 px-2 text-sm rounded-lg border border-slate-300 text-right" aria-label="Percent below the market pallet price" />
          <span>%</span>
        </label>
        <label>
          <span className="sr-only">Market source</span>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="py-1.5 px-1.5 text-xs rounded-lg border border-slate-300 bg-white max-w-[9rem]">
            <option value={TTW_SOURCE}>Xpose store (TTW)</option>
            <option value="">Any source</option>
          </select>
        </label>
        <button
          type="button"
          onClick={open}
          disabled={!skus.length || pending}
          data-testid="reprice-open"
          className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40"
          title="Guest price = latest per-tarp pallet price at the market − X%, never below cost × 1.15. Preview first; nothing is saved until you click Save."
        >
          {pending && !preview ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <TrendingDown className="w-3.5 h-3.5" aria-hidden />}
          Reprice from market ({scopeLabel})
        </button>
      </div>

      {preview && (
        <div role="dialog" aria-modal="true" aria-labelledby="reprice-title" className="fixed inset-0 z-50 bg-slate-900/50 flex items-start sm:items-center justify-center p-2 sm:p-6" data-testid="reprice-dialog">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200">
              <div>
                <h2 id="reprice-title" className="font-black text-slate-900 text-lg">Reprice from market — preview</h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  New guest price = latest per-tarp <strong>full-pallet</strong> price (else half pallet) − {percent || 0}%, never below the floor (cost × 1.15).
                  Pallet SKUs = per-tarp × tarps on the pallet. Rows with no pallet price or no cost stay unchanged.
                </p>
                <p className="text-sm font-semibold text-slate-800 mt-1">{preview.message}</p>
              </div>
              <button type="button" onClick={() => setPreview(null)} aria-label="Close preview" className="p-1.5 rounded hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-2 flex items-center gap-3 text-xs text-slate-600 border-b border-slate-100">
              <label className="inline-flex items-center gap-1.5">
                <input type="checkbox" checked={onlyChanges} onChange={(e) => setOnlyChanges(e.target.checked)} className="accent-orange-500" />
                Only rows that change ({changing.length})
              </label>
              <span>· {rows.filter((r) => r.floor_wins).length} at FLOOR · {rows.filter((r) => r.status === 'no-market').length} no pallet price · {rows.filter((r) => r.status === 'no-cost').length} no cost</span>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm min-w-[760px]">
                <caption className="sr-only">Reprice preview</caption>
                <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="text-left px-3 py-2">SKU</th>
                    <th scope="col" className="text-right px-3 py-2">Market / tarp</th>
                    <th scope="col" className="text-right px-3 py-2">Floor</th>
                    <th scope="col" className="text-right px-3 py-2">Old retail</th>
                    <th scope="col" className="text-right px-3 py-2">New retail</th>
                    <th scope="col" className="text-right px-3 py-2">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shown.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-slate-400">No row would change.</td></tr>}
                  {shown.map((r) => {
                    const delta = r.new_retail_cents - r.old_retail_cents
                    return (
                      <tr key={r.sku} className={r.floor_wins ? 'bg-amber-50/60' : undefined} data-testid="reprice-row">
                        <td className="px-3 py-1.5">
                          <p className="font-mono text-xs text-slate-800">{r.sku}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[18rem]">
                            {r.market_sku ? `${r.market_sku}${r.market_kind ? ` · ${KIND_LABEL[r.market_kind] ?? r.market_kind}` : ''}${r.market_checked_at ? ` · ${r.market_checked_at}` : ''}` : 'no Xpose match'}
                            {r.pack > 1 ? ` · ×${r.pack} tarps` : ''}
                          </p>
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{money(r.market_per_tarp_cents)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">{money(r.floor_cents)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">{money(r.old_retail_cents)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-bold">
                          {r.status === 'no-market' ? <span className="text-slate-400 font-normal text-xs">no pallet price</span>
                            : r.status === 'no-cost' ? <span className="text-amber-700 font-normal text-xs">no cost — skipped</span>
                            : <>
                                {money(r.new_retail_cents)}
                                {r.floor_wins && <span className="ml-1.5 text-[10px] font-black text-amber-800 bg-amber-200 rounded px-1 py-0.5" title="The floor (cost × 1.15) is higher than market − X%">FLOOR</span>}
                                {delta !== 0 && <span className={`block text-[10px] font-semibold ${delta < 0 ? 'text-green-700' : 'text-red-700'}`}>{delta > 0 ? '+' : ''}{money(delta)}</span>}
                              </>}
                        </td>
                        <td className={`px-3 py-1.5 text-right tabular-nums text-xs font-bold ${r.margin_percent == null ? 'text-slate-300' : r.margin_percent < 15 ? 'text-red-600' : r.margin_percent < 25 ? 'text-amber-600' : 'text-green-700'}`}>
                          {r.margin_percent == null ? '—' : `${r.margin_percent.toFixed(1)}%`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-200 flex items-center gap-3 flex-wrap">
              <p className="text-sm" aria-live="polite">
                {result ? (
                  <span className={result.ok ? 'text-green-700 font-semibold' : result.demo ? 'text-amber-800 font-semibold' : 'text-red-700 font-semibold'} data-testid="reprice-result">
                    {result.message}{result.errors.length ? ` ${result.errors.slice(0, 3).join('; ')}` : ''}
                  </span>
                ) : preview.demo ? (
                  <span className="text-amber-800">Demo mode: Save is not saved in demo.</span>
                ) : (
                  <span className="text-slate-500">Save recalculates on the server and writes only the rows that change.</span>
                )}
              </p>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={() => setPreview(null)} className="text-sm font-semibold px-3 py-2 rounded-lg ring-1 ring-slate-300 hover:bg-slate-50">Close</button>
                <button type="button" disabled={!changing.length || pending || (result?.ok ?? false)} onClick={save} className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40" data-testid="reprice-save">
                  <Save className="w-4 h-4" aria-hidden /> {pending ? 'Saving…' : `Save ${changing.length} price${changing.length === 1 ? '' : 's'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/** Expandable "all market observations for this SKU" panel (admin only; loaded on demand). */
export function MarketPanel({ sku }: { sku: string }) {
  const [data, setData] = useState<MarketPanelData | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    getMarketObservations(sku)
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setError('Could not load market prices.') })
    return () => { cancelled = true }
  }, [sku])
  return (
    <div className="px-3 py-3 bg-slate-50 border-t border-slate-200" data-testid="market-panel">
      <p className="text-xs font-bold text-slate-700 mb-2">
        Market prices for {sku}
        {data?.market_sku && data.market_sku !== sku && <span className="font-normal text-slate-500"> (Xpose SKU {data.market_sku})</span>}
        <span className="font-normal text-slate-400"> · admin only, never shown to customers</span>
      </p>
      {error && <p className="text-xs text-red-700">{error}</p>}
      {!data && !error && <p className="text-xs text-slate-400">Loading…</p>}
      {data && data.observations.length === 0 && <p className="text-xs text-slate-500">No market observations for this SKU.</p>}
      {data && data.observations.length > 0 && (
        <div className="overflow-x-auto">
          <table className="text-xs min-w-[640px] w-full bg-white rounded-lg ring-1 ring-slate-200">
            <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-100">
              <tr>
                <th scope="col" className="text-left px-2 py-1.5">Source</th>
                <th scope="col" className="text-left px-2 py-1.5">Kind</th>
                <th scope="col" className="text-right px-2 py-1.5">Units</th>
                <th scope="col" className="text-right px-2 py-1.5">Price</th>
                <th scope="col" className="text-right px-2 py-1.5">Per unit</th>
                <th scope="col" className="text-left px-2 py-1.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.observations.map((o, i) => (
                <tr key={`${o.source}-${o.kind}-${o.units}-${o.checked_at}-${i}`}>
                  <td className="px-2 py-1.5">
                    {o.url ? (
                      <a href={o.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 hover:text-orange-600">
                        {o.source} <ExternalLink className="w-3 h-3 text-slate-400" aria-hidden />
                      </a>
                    ) : o.source}
                    {o.sku !== sku && <span className="text-slate-400"> · {o.sku}</span>}
                  </td>
                  <td className="px-2 py-1.5">{KIND_LABEL[o.kind] ?? o.kind}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{o.units}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{money(o.price_cents)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums font-semibold">{money(o.per_unit_cents ?? Math.floor(o.price_cents / (o.units || 1)))}</td>
                  <td className="px-2 py-1.5 tabular-nums text-slate-600">{String(o.checked_at).slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
