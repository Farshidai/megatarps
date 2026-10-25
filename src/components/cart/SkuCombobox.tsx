'use client'

import { useId, useMemo, useState } from 'react'
import { formatPrice } from '@/lib/utils'
import type { CatalogEntry } from '@/lib/cart/catalog-types'
import { searchCatalog } from '@/lib/cart/quick-order'

interface Props {
  catalog: CatalogEntry[]
  value: string
  onChange: (text: string) => void
  onSelect: (entry: CatalogEntry) => void
  onPasteList?: (text: string) => void
  label: string
  invalid?: boolean
  inputRef?: (el: HTMLInputElement | null) => void
}

/** Accessible autocomplete (ARIA combobox) over the catalog: SKU, size or name. */
export function SkuCombobox({ catalog, value, onChange, onSelect, onPasteList, label, invalid, inputRef }: Props) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const matches = useMemo(() => (open ? searchCatalog(catalog, value, 8) : []), [catalog, value, open])
  const listId = `${id}-list`

  const choose = (e: CatalogEntry) => {
    onSelect(e)
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={open && matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[active] ? `${id}-opt-${active}` : undefined}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder="SKU or size, e.g. 20x30 10 mil"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => value && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text')
          if (onPasteList && /\n/.test(text.trim())) {
            e.preventDefault()
            onPasteList(text)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
            setActive((a) => Math.min(a + 1, Math.max(matches.length - 1, 0)))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((a) => Math.max(a - 1, 0))
          } else if (e.key === 'Enter' && open && matches[active]) {
            e.preventDefault()
            choose(matches[active])
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
        className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 ${invalid ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : 'border-slate-300 focus:ring-orange-100 focus:border-orange-400'}`}
      />
      {open && matches.length > 0 && (
        <ul id={listId} role="listbox" className="absolute z-30 left-0 right-0 sm:right-auto sm:w-[28rem] mt-1 max-h-80 overflow-auto bg-white border border-slate-200 rounded-xl shadow-xl py-1">
          {matches.map((m, i) => (
            <li
              key={m.sku}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(m)
              }}
              onMouseEnter={() => setActive(i)}
              className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-3 ${i === active ? 'bg-orange-50' : ''}`}
            >
              <span className="min-w-0">
                <span className="block font-mono text-xs text-slate-500">{m.sku}</span>
                <span className="block text-sm text-slate-900 truncate">{m.name}</span>
              </span>
              <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                {m.quote_only ? <span className="text-orange-700">Quote</span> : formatPrice(m.retail_price_cents)}
                {!m.in_stock && !m.quote_only && <span className="block text-red-600 font-normal">Out of stock</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
