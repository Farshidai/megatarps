'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { TARP_TYPE_LABELS, THICKNESS_LABELS, CATEGORY_LABELS } from '@/lib/utils'

interface ProductFiltersProps {
  currentCategory?: string
  currentType?: string
  currentThickness?: number
}

export function ProductFilters({ currentCategory, currentType, currentThickness }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/products?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">By Use</h3>
        <div className="space-y-1">
          <button
            onClick={() => updateFilter('category', null)}
            className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${!currentCategory ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            All Categories
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => updateFilter('category', key)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${currentCategory === key ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">By Type</h3>
        <div className="space-y-1">
          <button
            onClick={() => updateFilter('type', null)}
            className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${!currentType ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            All Types
          </button>
          {Object.entries(TARP_TYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => updateFilter('type', key)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${currentType === key ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">By Thickness</h3>
        <div className="space-y-1">
          <button
            onClick={() => updateFilter('thickness', null)}
            className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${!currentThickness ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            All Thicknesses
          </button>
          {Object.entries(THICKNESS_LABELS).map(([mil, label]) => (
            <button
              key={mil}
              onClick={() => updateFilter('thickness', mil)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${currentThickness === Number(mil) ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
