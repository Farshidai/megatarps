'use client'

import { useEffect, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

/** Mobile filter sheet. The parent re-keys it on every query change, so it closes after a filter is picked. */
export function MobileFilterDrawer({ count, resultCount, children }: { count: number; resultCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-filters"
        className="inline-flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 focus-visible:outline-2 focus-visible:outline-orange-500"
      >
        <SlidersHorizontal className="w-4 h-4" aria-hidden /> Filters{count ? ` (${count})` : ''}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Filter products" id="mobile-filters">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} />
          <div className="relative ml-auto h-full w-[88%] max-w-sm bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <p className="font-bold text-slate-900">Filters</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close filters" className="p-1.5 rounded-lg hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-orange-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
            <div className="p-4 border-t border-slate-200">
              <button type="button" onClick={() => setOpen(false)} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl">
                Show {resultCount} result{resultCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
