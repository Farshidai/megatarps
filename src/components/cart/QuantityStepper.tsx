'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAX_LINE_QUANTITY } from '@/lib/cart/constants'

interface Props {
  value: number
  onChange: (qty: number) => void
  label: string
  size?: 'sm' | 'md'
  id?: string
}

/** − [qty] + with free typing (an empty field is allowed while typing; it snaps to 1 on blur). */
export function QuantityStepper({ value, onChange, label, size = 'md', id }: Props) {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = (raw: string) => {
    const n = Math.floor(Number(raw))
    onChange(Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_LINE_QUANTITY) : 1)
    setDraft(null)
  }
  const btn = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  const input = size === 'sm' ? 'w-14 py-1 text-sm' : 'w-20 py-2 text-lg'

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label={`Decrease ${label}`}
        className={cn(btn, 'rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400')}
      >
        <Minus className="w-4 h-4" />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_LINE_QUANTITY}
        aria-label={label}
        value={draft ?? String(value)}
        onChange={(e) => {
          setDraft(e.target.value)
          const n = Math.floor(Number(e.target.value))
          if (e.target.value !== '' && Number.isFinite(n) && n >= 1) onChange(Math.min(n, MAX_LINE_QUANTITY))
        }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
        }}
        className={cn(input, 'text-center border border-slate-300 rounded-lg font-bold focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100')}
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(MAX_LINE_QUANTITY, value + 1))}
        aria-label={`Increase ${label}`}
        className={cn(btn, 'rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400')}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}
