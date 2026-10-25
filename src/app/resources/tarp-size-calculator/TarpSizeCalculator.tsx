'use client'

import { useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Ruler, Info } from 'lucide-react'
import { recommendSize, finishedFt, formatFtIn, FINISHED_RATIO } from '../_lib/tarp-sizes'

export interface CalcProduct {
  slug: string
  name: string
  width: number
  length: number
  thickness: number | null
  quoteOnly: boolean
}

const JOB_OPTIONS = [
  { value: 'roofing', label: 'Roofing / storm cover', allowance: 4, mil: '12–16 mil, rope-reinforced edges', hint: 'Allowance covers 3–4 ft past the damage. Carry the top edge over the ridge.' },
  { value: 'construction', label: 'Construction / material storage', allowance: 2, mil: '10–16 mil', hint: '1–2 ft past the bottom lets straps reach anchor points.' },
  { value: 'agriculture', label: 'Agriculture (hay, grain, equipment)', allowance: 1, mil: '12–20 mil, UV-treated', hint: 'For hay, stop a foot above the ground so bales can breathe.' },
  { value: 'warehouse', label: 'Warehouse / indoor dust cover', allowance: 0.5, mil: '5–10 mil', hint: 'Indoors needs little extra: nothing is pulling on it.' },
  { value: 'scaffolding', label: 'Scaffolding / enclosure', allowance: 1, mil: 'Fire-retardant, mesh or clear', hint: 'Add about 1 ft per edge you will wrap around a board or pipe.' },
  { value: 'ground', label: 'Ground cover / slab', allowance: 2, mil: '10–12 mil', hint: '1–2 ft past each edge so it can be weighted or staked.' },
] as const

type JobValue = (typeof JOB_OPTIONS)[number]['value']

function num(v: string): number {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export function TarpSizeCalculator({ products }: { products: CalcProduct[] }) {
  const id = useId()
  const [job, setJob] = useState<JobValue>('construction')
  const [width, setWidth] = useState('12')
  const [length, setLength] = useState('20')
  const [height, setHeight] = useState('4')
  const [allowance, setAllowance] = useState('2')

  const jobInfo = JOB_OPTIONS.find((j) => j.value === job)!
  const hasInput = num(width) > 0 && num(length) > 0
  const result = useMemo(
    () => recommendSize({ width: num(width), length: num(length), height: num(height), allowance: num(allowance) }),
    [width, length, height, allowance],
  )

  const matches = useMemo(() => {
    if (!result.best) return []
    const fitsSize = (p: CalcProduct, w: number, l: number) => (p.width === w && p.length === l) || (p.width === l && p.length === w)
    const exact = products.filter((p) => fitsSize(p, result.best!.width, result.best!.length))
    const next = result.nextUp ? products.filter((p) => fitsSize(p, result.nextUp!.width, result.nextUp!.length)) : []
    // Anything else in the catalog whose finished size still covers the requirement, smallest first.
    const other = products
      .filter((p) => !exact.includes(p) && !next.includes(p))
      .filter((p) => {
        const fw = finishedFt(Math.min(p.width, p.length))
        const fl = finishedFt(Math.max(p.width, p.length))
        return fw >= result.requiredWidth && fl >= result.requiredLength
      })
      .sort((a, b) => a.width * a.length - b.width * b.length)
    return [...exact, ...next, ...other].slice(0, 6)
  }, [products, result])

  function onJobChange(v: JobValue) {
    setJob(v)
    const j = JOB_OPTIONS.find((x) => x.value === v)!
    setAllowance(String(j.allowance))
    if (v === 'roofing' || v === 'ground') setHeight('0')
  }

  const field = 'w-full rounded-xl ring-1 ring-slate-300 px-4 py-3 text-base text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500'
  const shrinkPct = Math.round((1 - FINISHED_RATIO) * 100)

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-8">
      {/* Inputs */}
      <form className="rounded-3xl ring-1 ring-slate-200 bg-white p-6 sm:p-8 space-y-5" onSubmit={(e) => e.preventDefault()} aria-describedby={`${id}-help`}>
        <div className="flex items-center gap-2 text-slate-900">
          <Ruler className="w-5 h-5 text-orange-500" aria-hidden="true" />
          <h2 className="text-xl font-black">What are you covering?</h2>
        </div>

        <div>
          <label htmlFor={`${id}-job`} className="block text-sm font-bold text-slate-700 mb-1.5">Job</label>
          <select id={`${id}-job`} value={job} onChange={(e) => onJobChange(e.target.value as JobValue)} className={field}>
            {JOB_OPTIONS.map((j) => <option key={j.value} value={j.value}>{j.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${id}-w`} className="block text-sm font-bold text-slate-700 mb-1.5">Width (ft)</label>
            <input id={`${id}-w`} type="number" inputMode="decimal" min={0} step="0.5" value={width} onChange={(e) => setWidth(e.target.value)} className={field} />
          </div>
          <div>
            <label htmlFor={`${id}-l`} className="block text-sm font-bold text-slate-700 mb-1.5">Length (ft)</label>
            <input id={`${id}-l`} type="number" inputMode="decimal" min={0} step="0.5" value={length} onChange={(e) => setLength(e.target.value)} className={field} />
          </div>
          <div>
            <label htmlFor={`${id}-h`} className="block text-sm font-bold text-slate-700 mb-1.5">Height (ft)</label>
            <input id={`${id}-h`} type="number" inputMode="decimal" min={0} step="0.5" value={height} onChange={(e) => setHeight(e.target.value)} className={field} aria-describedby={`${id}-h-hint`} />
            <p id={`${id}-h-hint`} className="mt-1 text-xs text-slate-500">0 for flat ground or a roof patch.</p>
          </div>
          <div>
            <label htmlFor={`${id}-a`} className="block text-sm font-bold text-slate-700 mb-1.5">Overhang &amp; tie-down per side (ft)</label>
            <input id={`${id}-a`} type="number" inputMode="decimal" min={0} step="0.5" value={allowance} onChange={(e) => setAllowance(e.target.value)} className={field} aria-describedby={`${id}-a-hint`} />
            <p id={`${id}-a-hint`} className="mt-1 text-xs text-slate-500">{jobInfo.hint}</p>
          </div>
        </div>

        <p id={`${id}-help`} className="flex gap-2 text-xs text-slate-500 leading-relaxed">
          <Info className="w-4 h-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
          Required size = footprint + 2 × height + 2 × allowance. The Xpose tarps we stock are true to size (finished size = labeled size),
          so the size on the label is the coverage you get{shrinkPct > 0 ? ` (we allow ${shrinkPct}% for hemming)` : ''}.
        </p>
      </form>

      {/* Result */}
      <div aria-live="polite" className="space-y-5">
        <div className="rounded-3xl bg-slate-950 text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgb(249_115_22_/_0.18),_transparent_60%)]" />
          <div className="relative">
            {!hasInput ? (
              <p className="text-slate-300">Enter a width and length to see the recommended tarp size.</p>
            ) : (
              <>
                <p className="text-xs font-bold text-orange-400 uppercase tracking-[0.18em]">You need at least</p>
                <p className="text-lg text-slate-200 mt-1">
                  {formatFtIn(result.requiredWidth)} × {formatFtIn(result.requiredLength)} finished
                </p>
                {result.best ? (
                  <>
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-[0.18em] mt-6">Recommended standard size</p>
                    <p className="text-5xl sm:text-6xl font-black tracking-tight mt-1" data-testid="recommended-size">
                      {result.best.width}×{result.best.length}
                    </p>
                    <p className="text-slate-300 mt-2">
                      Finishes about {formatFtIn(result.best.finishedWidth)} × {formatFtIn(result.best.finishedLength)} ·{' '}
                      {Math.round(result.best.finishedWidth * result.best.finishedLength).toLocaleString('en-US')} sq ft
                    </p>
                    {result.nextUp && (
                      <p className="text-sm text-slate-400 mt-3">
                        Want more margin? Next size up: <strong className="text-white">{result.nextUp.width}×{result.nextUp.length}</strong>
                      </p>
                    )}
                    <p className="text-sm text-slate-300 mt-5 pt-5 border-t border-white/10">
                      Suggested weight for {jobInfo.label.toLowerCase()}: <strong className="text-white">{jobInfo.mil}</strong>
                    </p>
                  </>
                ) : (
                  <p className="mt-6 text-slate-200">
                    That is larger than a standard 60×100 tarp. Overlap two or more tarps by 2–3 ft, or{' '}
                    <Link href="/bulk-quote" className="text-orange-300 underline">request a quote for a custom size</Link>.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {hasInput && result.best && (
          <div className="rounded-3xl ring-1 ring-slate-200 bg-white p-6">
            <h2 className="font-black text-slate-900 mb-1">Matching tarps</h2>
            {matches.length > 0 ? (
              <>
                <p className="text-sm text-slate-500 mb-4">From our catalog, closest fit first.</p>
                <ul className="divide-y divide-slate-100">
                  {matches.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/product/${p.slug}`} className="group flex items-center justify-between gap-3 py-3">
                        <span>
                          <span className="block font-semibold text-slate-900 group-hover:text-orange-700 text-sm">{p.name}</span>
                          <span className="block text-xs text-slate-500">
                            {p.width}×{p.length}{p.thickness ? ` · ${p.thickness} mil` : ''}{p.quoteOnly ? ' · pallet / quote' : ''}
                          </span>
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 flex-shrink-0" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-slate-600 mb-2">
                We don&apos;t list a {result.best.width}×{result.best.length} online right now.{' '}
                <Link href="/bulk-quote" className="font-semibold text-orange-700 underline">Request a quote</Link> and we&apos;ll check stock.
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-4">
              <Link href={`/products?job=${job === 'ground' ? 'construction' : job}`} className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
                Shop {job === 'ground' ? 'construction' : job} tarps <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link href="/bulk-quote" className="inline-flex items-center gap-2 ring-1 ring-slate-300 hover:ring-orange-400 text-slate-800 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
                Pallet quote
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
