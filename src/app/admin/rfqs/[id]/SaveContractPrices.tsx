'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Handshake, Loader2, CheckCircle2, AlertCircle, Info, X, UserPlus } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { saveQuoteAsContractPrices } from '../contract-actions'

export interface ContractLine {
  index: number
  sku: string
  name: string
  quantity: number
  unit_price_cents: number
  catalog: boolean // matches a catalog product
}

interface Props {
  quoteId: string
  quoteNumber: string
  contractorId: string | null
  /** quoted / accepted / ordered (shipped / delivered) */
  eligible: boolean
  statusLabel: string
  lines: ContractLine[]
  defaultValidUntil: string
  /** contract prices already on file for this client */
  existingCount: number
}

export function SaveContractPrices({ quoteId, quoteNumber, contractorId, eligible, statusLabel, lines, defaultValidUntil, existingCount }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const savable = lines.filter((l) => l.catalog && l.unit_price_cents > 0)
  const [picked, setPicked] = useState<Record<number, boolean>>(() => Object.fromEntries(savable.map((l) => [l.index, true])))
  const [minQty, setMinQty] = useState<Record<number, string>>(() => Object.fromEntries(savable.map((l) => [l.index, '1'])))
  const [validUntil, setValidUntil] = useState(defaultValidUntil)
  const [result, setResult] = useState<{ ok: boolean; demo?: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    dialogRef.current?.querySelector<HTMLElement>('input, button')?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!contractorId) {
    return (
      <section className="bg-white rounded-xl border border-slate-200 p-5" aria-labelledby="cp-h" data-testid="contract-hint">
        <h2 id="cp-h" className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5"><Handshake className="w-3.5 h-3.5" aria-hidden /> Contract prices</h2>
        <p className="text-sm text-slate-600 flex gap-2">
          <UserPlus className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" aria-hidden />
          <span>Client has no wholesale account. Invite them to <Link href="/apply" className="font-mono text-orange-600 hover:underline">/apply</Link> to save contract prices.</span>
        </p>
      </section>
    )
  }

  const chosen = savable.filter((l) => picked[l.index])
  const submit = () => {
    setResult(null)
    start(async () => {
      const r = await saveQuoteAsContractPrices({
        quoteId,
        validUntil,
        lines: chosen.map((l) => ({ index: l.index, min_quantity: Number(minQty[l.index] || '1') })),
      })
      setResult(r.ok ? { ok: true, demo: r.demo, text: r.message } : { ok: false, text: r.error })
      if (r.ok) {
        setOpen(false)
        if (!r.demo) router.refresh()
      }
    })
  }

  return (
    <section className="bg-white rounded-xl border border-emerald-200 p-5" aria-labelledby="cp-h" data-testid="contract-save">
      <h2 id="cp-h" className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5"><Handshake className="w-3.5 h-3.5 text-emerald-600" aria-hidden /> Contract prices</h2>
      <p className="text-sm text-slate-600 mb-3">
        Save this quote&apos;s prices to the client&apos;s account. They get the lower of the contract price and their normal price on future online orders.
      </p>
      <button
        type="button"
        onClick={() => { setResult(null); setOpen(true) }}
        disabled={!eligible || !savable.length}
        className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
      >
        <Handshake className="w-4 h-4" aria-hidden /> Save as client&apos;s contract prices
      </button>
      {!eligible && <p className="text-xs text-slate-500 mt-2">Available once the quote is sent, accepted or ordered (now: {statusLabel}).</p>}
      {eligible && !savable.length && <p className="text-xs text-slate-500 mt-2">No priced catalog lines on this quote yet.</p>}
      <p className="text-xs text-slate-500 mt-2">
        {existingCount > 0 ? `${existingCount} contract price${existingCount === 1 ? '' : 's'} on file. ` : ''}
        <Link href={`/admin/accounts/${contractorId}#contract-prices`} className="text-orange-600 hover:underline">Manage client&apos;s contract prices →</Link>
      </p>
      <div aria-live="polite">
        {result && (
          <p className={`mt-3 flex items-start gap-2 text-sm rounded-lg px-3 py-2 ${!result.ok ? 'bg-red-50 text-red-700' : result.demo ? 'bg-sky-50 text-sky-800' : 'bg-emerald-50 text-emerald-800'}`} data-testid="contract-save-result">
            {!result.ok ? <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden /> : result.demo ? <Info className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden /> : <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />}
            <span>{result.text}</span>
          </p>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cp-dialog-h" className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col" data-testid="contract-dialog">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
              <div>
                <h3 id="cp-dialog-h" className="font-black text-slate-900">Save {quoteNumber} as contract prices</h3>
                <p className="text-xs text-slate-500 mt-0.5">Upserts one row per product and min quantity. An existing row with the same product and min qty is replaced.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 -m-1 text-slate-400 hover:text-slate-700 rounded-md" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto px-5 py-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                    <th scope="col" className="text-left font-semibold py-2 w-8"><span className="sr-only">Save</span></th>
                    <th scope="col" className="text-left font-semibold py-2">Product</th>
                    <th scope="col" className="text-right font-semibold py-2">Quoted</th>
                    <th scope="col" className="text-right font-semibold py-2 w-24">Min qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((l) => {
                    const ok = l.catalog && l.unit_price_cents > 0
                    return (
                      <tr key={l.index} className={ok ? '' : 'text-slate-400'}>
                        <td className="py-2 align-top">
                          <input type="checkbox" id={`cp-pick-${l.index}`} disabled={!ok} checked={ok && !!picked[l.index]} onChange={(e) => setPicked((p) => ({ ...p, [l.index]: e.target.checked }))} className="w-4 h-4 accent-emerald-600" />
                        </td>
                        <td className="py-2 pr-2">
                          <label htmlFor={`cp-pick-${l.index}`} className="font-semibold text-slate-800 block">{l.name}</label>
                          <span className="text-xs font-mono text-slate-500">{l.sku}</span>
                          {!l.catalog && <span className="block text-xs">Custom line, can&apos;t be saved</span>}
                          {l.catalog && l.unit_price_cents <= 0 && <span className="block text-xs">Not priced</span>}
                        </td>
                        <td className="py-2 text-right tabular-nums align-top">
                          <span className="font-bold text-slate-900">{formatPrice(l.unit_price_cents)}</span>
                          <span className="block text-xs text-slate-400">× {l.quantity} quoted</span>
                        </td>
                        <td className="py-2 text-right align-top">
                          <label htmlFor={`cp-min-${l.index}`} className="sr-only">Min quantity for {l.sku}</label>
                          <input id={`cp-min-${l.index}`} type="number" min={1} max={100000} disabled={!ok || !picked[l.index]} value={minQty[l.index] ?? '1'}
                            onChange={(e) => setMinQty((m) => ({ ...m, [l.index]: e.target.value }))}
                            className="w-20 border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 disabled:bg-slate-50" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
              <div>
                <label htmlFor="cp-valid" className="block text-xs font-semibold text-slate-600 mb-1">Valid until</label>
                <input id="cp-valid" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400" />
                <p className="text-[11px] text-slate-400 mt-1">Default 90 days. Clear it for no end date.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setOpen(false)} className="border border-slate-300 hover:border-slate-400 bg-white text-slate-800 font-bold rounded-xl px-4 py-2.5 text-sm">Cancel</button>
                <button type="button" onClick={submit} disabled={pending || !chosen.length}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl px-4 py-2.5 text-sm" data-testid="contract-confirm">
                  {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Handshake className="w-4 h-4" aria-hidden />}
                  Save {chosen.length} price{chosen.length === 1 ? '' : 's'}
                </button>
              </div>
            </div>
            {result && !result.ok && <p className="mx-5 mb-4 flex items-center gap-2 text-sm rounded-lg px-3 py-2 bg-red-50 text-red-700" role="alert"><AlertCircle className="w-4 h-4" aria-hidden /> {result.text}</p>}
          </div>
        </div>
      )}
    </section>
  )
}
