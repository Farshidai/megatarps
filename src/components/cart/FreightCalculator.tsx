'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { calculateFreight, formatLb, freightMethodLabel, type FreightConfig } from '@/lib/freight'
import type { CatalogEntry } from '@/lib/cart/catalog-types'
import { SkuCombobox } from './SkuCombobox'

interface Row {
  id: number
  query: string
  entry: CatalogEntry | null
  qty: number
}
let nextId = 1

/** Admin "what would freight be?" tool. Pick SKUs + quantities. */
export function FreightCalculator({ catalog, config }: { catalog: CatalogEntry[]; config: FreightConfig }) {
  const [rows, setRows] = useState<Row[]>([{ id: nextId++, query: '', entry: null, qty: 1 }])
  const update = (id: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const picked = rows.filter((r) => r.entry)
  const result = picked.length
    ? calculateFreight(picked.map((r) => ({ sku: r.entry!.sku, quantity: r.qty, unitWeightLb: r.entry!.unit_weight_lb })), config)
    : null

  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.id} className="grid grid-cols-[1fr_6rem_8rem_2rem] gap-2 items-center">
          <SkuCombobox
            catalog={catalog}
            label={`Calculator row ${i + 1} SKU`}
            value={r.query}
            onChange={(t) => update(r.id, { query: t, entry: null })}
            onSelect={(e) => update(r.id, { query: e.sku, entry: e })}
          />
          <input
            type="number"
            min={1}
            value={r.qty}
            aria-label={`Calculator row ${i + 1} quantity`}
            onChange={(e) => update(r.id, { qty: Math.max(1, Math.floor(Number(e.target.value)) || 1) })}
            className="border border-slate-300 rounded-lg px-2 py-2 text-sm text-center"
          />
          <span className="text-sm text-slate-600 text-right">
            {r.entry ? (r.entry.unit_weight_lb != null ? `${formatLb(r.entry.unit_weight_lb)} lb ea` : 'weight unknown') : ''}
          </span>
          <button type="button" aria-label={`Remove calculator row ${i + 1}`} onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.id !== r.id) : rs))} className="text-slate-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => setRows((rs) => [...rs, { id: nextId++, query: '', entry: null, qty: 1 }])} className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600">
        <Plus className="w-4 h-4" aria-hidden /> Add SKU
      </button>
      {result && (
        <dl className="grid sm:grid-cols-4 gap-3 bg-slate-50 rounded-xl p-4 text-sm" data-testid="calc-result">
          <div><dt className="text-slate-500">Total weight</dt><dd className="font-bold text-slate-900">{formatLb(result.totalWeightLb)} lb (bills {result.billableWeightLb})</dd></div>
          <div><dt className="text-slate-500">Method</dt><dd className="font-bold text-slate-900">{freightMethodLabel(result.method)}</dd></div>
          <div><dt className="text-slate-500">Freight</dt><dd className="font-bold text-slate-900">{result.freightCents == null ? 'Quote' : formatPrice(result.freightCents)}</dd></div>
          <div><dt className="text-slate-500">Why</dt><dd className="text-slate-700">{result.reason}</dd></div>
        </dl>
      )}
    </div>
  )
}
