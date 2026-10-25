'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, FileSignature, Printer, XCircle, Loader2, ShieldCheck, Lock } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { QuoteStatus } from '@/lib/quotes/types'

interface Props {
  token: string
  status: QuoteStatus
  totalCents: number
  validUntil: string | null
  /** e.g. "Net 30" when the signed-in approved account may accept on terms */
  netTerms: string | null
  paid: boolean
}

const DECLINE_REASONS = ['Price too high', 'Freight too high', 'Timing — need it sooner', 'Project canceled or postponed', 'Bought elsewhere']

export function QuoteActions({ token, status, totalCents, validUntil, netTerms, paid }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<'pay' | 'terms' | 'decline' | null>(null)
  const [error, setError] = useState('')
  const [panel, setPanel] = useState<'none' | 'terms' | 'decline'>('none')
  const [po, setPo] = useState('')
  const [reason, setReason] = useState('')
  const [done, setDone] = useState('')

  const post = async (path: string, body?: object) => {
    const res = await fetch(`/api/quotes/${encodeURIComponent(token)}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error ?? 'Something went wrong. Please call (913) 313-2691.')
    return data
  }

  const pay = async () => {
    setError(''); setBusy('pay')
    try {
      const { url } = await post('checkout')
      window.location.href = url
    } catch (e) {
      setError((e as Error).message); setBusy(null)
    }
  }

  const acceptTerms = async () => {
    setError(''); setBusy('terms')
    try {
      const { order_number } = await post('accept', { po_number: po })
      setDone(`Order ${order_number} confirmed on ${netTerms}. A confirmation is on its way to your inbox.`)
      setPanel('none')
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const decline = async () => {
    setError(''); setBusy('decline')
    try {
      await post('decline', { reason })
      setPanel('none')
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const canAct = status === 'quoted' || (status === 'accepted' && !paid)
  const daysLeft = validUntil ? Math.ceil((new Date(validUntil).getTime() - Date.now()) / 86400_000) : null

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      {status !== 'pending' && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quote total</p>
          <p className="text-3xl font-black text-slate-900 tabular-nums">{formatPrice(totalCents)}</p>
          {status === 'quoted' && daysLeft !== null && (
            <p className={`text-xs mt-0.5 ${daysLeft <= 3 ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
              {daysLeft <= 0 ? 'Expires today' : `Pricing held for ${daysLeft} more day${daysLeft === 1 ? '' : 's'}`}
            </p>
          )}
        </div>
      )}

      {done && <p role="status" className="text-sm bg-emerald-50 text-emerald-800 rounded-lg p-3">{done}</p>}

      {canAct && (
        <div className="space-y-2">
          <button type="button" onClick={pay} disabled={!!busy}
            className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-black rounded-xl px-4 py-3.5">
            {busy === 'pay' ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : <CreditCard className="w-5 h-5" aria-hidden />}
            {status === 'accepted' ? 'Complete payment' : 'Accept & pay'}
          </button>
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1"><Lock className="w-3 h-3" aria-hidden /> Secure checkout by Stripe</p>

          {netTerms && status === 'quoted' && (
            panel === 'terms' ? (
              <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                <label htmlFor="po" className="block text-xs font-semibold text-slate-600">Your PO number <span className="font-normal text-slate-400">(optional)</span></label>
                <input id="po" value={po} onChange={(e) => setPo(e.target.value)} maxLength={60}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400" />
                <button type="button" onClick={acceptTerms} disabled={!!busy}
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg px-4 py-2.5 text-sm disabled:opacity-60">
                  {busy === 'terms' && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />} Confirm order on {netTerms}
                </button>
                <button type="button" onClick={() => setPanel('none')} className="w-full text-xs text-slate-500 hover:text-slate-800">Cancel</button>
              </div>
            ) : (
              <button type="button" onClick={() => setPanel('terms')} disabled={!!busy}
                className="w-full inline-flex items-center justify-center gap-2 border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold rounded-xl px-4 py-3 text-sm transition-colors">
                <FileSignature className="w-4 h-4" aria-hidden /> Accept on {netTerms}
              </button>
            )
          )}
          {netTerms && status === 'quoted' && (
            <p className="text-[11px] text-slate-500 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden /> Approved wholesale account — invoice on {netTerms}.</p>
          )}
        </div>
      )}

      {error && <p role="alert" className="text-sm bg-red-50 text-red-700 rounded-lg p-3">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={() => window.print()}
          className="flex-1 inline-flex items-center justify-center gap-1.5 border border-slate-300 hover:border-slate-400 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700">
          <Printer className="w-4 h-4" aria-hidden /> Print / PDF
        </button>
        {status === 'quoted' && panel !== 'decline' && (
          <button type="button" onClick={() => setPanel('decline')}
            className="flex-1 inline-flex items-center justify-center gap-1.5 border border-slate-300 hover:border-red-300 hover:text-red-700 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700">
            <XCircle className="w-4 h-4" aria-hidden /> Decline
          </button>
        )}
      </div>

      {panel === 'decline' && (
        <div className="border border-slate-200 rounded-xl p-3 space-y-2">
          <p className="text-sm font-semibold text-slate-800">Help us do better — why not this time?</p>
          <div className="flex flex-wrap gap-1.5">
            {DECLINE_REASONS.map((r) => (
              <button key={r} type="button" onClick={() => setReason(r)} aria-pressed={reason === r}
                className={`text-xs rounded-full px-2.5 py-1 border ${reason === r ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}>
                {r}
              </button>
            ))}
          </div>
          <label htmlFor="reason" className="sr-only">Reason for declining</label>
          <textarea id="reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} placeholder="Anything else? (optional)"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400" />
          <div className="flex gap-2">
            <button type="button" onClick={decline} disabled={!!busy}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-3 py-2 text-sm disabled:opacity-60">
              {busy === 'decline' && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />} Decline quote
            </button>
            <button type="button" onClick={() => setPanel('none')} className="px-3 text-sm text-slate-500 hover:text-slate-800">Cancel</button>
          </div>
        </div>
      )}

      {status === 'expired' && (
        <a href="tel:+19133132691" className="block text-center text-sm font-semibold text-orange-600 hover:underline">Call to refresh this quote</a>
      )}
    </div>
  )
}
