'use client'

import { useId, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { PickerProduct } from '@/lib/quotes/types'

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/['"′″]/g, '')
    .replace(/(\d+)\s*(?:x|×|by)\s*(\d+)/g, '$1x$2')
    .replace(/(\d+)\s*-?\s*mil\b/g, '$1mil')

function haystack(p: PickerProduct) {
  const [w, l] = p.size.split('x')
  return norm(`${p.sku} ${p.name} ${p.size} ${l && w ? `${l}x${w}` : ''} ${p.thickness_mil ? `${p.thickness_mil}mil` : ''} ${p.tarp_type}`)
}

export function searchProducts(products: PickerProduct[], query: string, limit = 8): PickerProduct[] {
  const tokens = norm(query).split(/\s+/).filter(Boolean)
  if (!tokens.length) return products.slice(0, limit)
  const out: { p: PickerProduct; score: number }[] = []
  for (const p of products) {
    const h = haystack(p)
    if (!tokens.every((t) => h.includes(t))) continue
    const sku = p.sku.toLowerCase()
    const score = (sku === tokens[0] ? 0 : sku.startsWith(tokens[0]) ? 1 : 2) + (p.quote_only ? 0.5 : 0)
    out.push({ p, score })
  }
  return out.sort((a, b) => a.score - b.score).slice(0, limit).map((x) => x.p)
}

interface Props {
  products: PickerProduct[]
  /** current selection (sku) or free-text description */
  value: { sku: string; description: string; product_id?: string | null }
  onSelect: (p: PickerProduct) => void
  onFreeText: (text: string) => void
  label: string
  hideLabel?: boolean
  invalid?: boolean
  autoFocus?: boolean
}

export function ProductPicker({ products, value, onSelect, onFreeText, label, hideLabel, invalid, autoFocus }: Props) {
  const id = useId()
  const listId = `${id}-list`
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const selected = value.product_id ? products.find((p) => p.id === value.product_id) : undefined
  const [query, setQuery] = useState(selected ? '' : value.description)

  const results = useMemo(() => searchProducts(products, query), [products, query])

  const choose = (p: PickerProduct) => {
    onSelect(p)
    setQuery('')
    setOpen(false)
  }

  if (selected) {
    return (
      <div>
        <span className={hideLabel ? 'sr-only' : 'block text-xs font-semibold text-slate-600 mb-1'}>{label}</span>
        <div className="flex items-center gap-2 border border-slate-300 bg-slate-50 rounded-lg pl-3 pr-1 py-1.5 min-h-[42px]">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate" title={selected.name}>{selected.name}</p>
            <p className="text-[11px] text-slate-500 font-mono">
              {selected.sku}
              {selected.quote_only && <span className="ml-2 font-sans font-semibold text-orange-600">Pallet / quote-only</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onFreeText('')
              setQuery('')
              setOpen(true)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
            className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200"
            aria-label={`Change product (currently ${selected.name})`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'block text-xs font-semibold text-slate-600 mb-1'}>{label}</label>
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
        <input
          ref={inputRef}
          id={id}
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={invalid || undefined}
          aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
          value={query}
          placeholder="Search SKU or size, e.g. 20x30 10 mil"
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onChange={(e) => {
            setQuery(e.target.value)
            onFreeText(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setOpen(true)
              setActive((a) => Math.min(a + 1, results.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === 'Enter' && open && results[active] && query.trim()) {
              e.preventDefault()
              choose(results[active])
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
          className={`w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 ${invalid ? 'border-red-400' : 'border-slate-300'}`}
        />
      </div>
      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching products"
          className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-80 overflow-auto py-1"
        >
          {results.map((p, i) => (
            <li
              key={p.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(p)
              }}
              onMouseEnter={() => setActive(i)}
              className={`px-3 py-2 cursor-pointer flex items-center gap-3 ${i === active ? 'bg-orange-50' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-900 truncate">{p.name}</p>
                <p className="text-[11px] font-mono text-slate-500">{p.sku}</p>
              </div>
              <span className={`text-xs font-semibold whitespace-nowrap ${p.quote_only ? 'text-orange-600' : 'text-slate-600'}`}>
                {p.quote_only ? 'Quote only' : formatPrice(p.retail_price_cents)}
              </span>
            </li>
          ))}
          {query.trim() && (
            <li className="px-3 py-2 text-[11px] text-slate-400 border-t border-slate-100" aria-hidden>
              Not listed? Keep typing — we&apos;ll quote your description as written.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
