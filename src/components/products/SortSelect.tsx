'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { SORTS } from '@/lib/catalog'

/** Sort dropdown. Works without JS too: it's inside a GET form with a submit fallback. */
export function SortSelect({ value, hrefFor }: { value: string; hrefFor: Record<string, string> }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
      <span className="hidden sm:inline">Sort</span>
      <select
        name="sort"
        value={value}
        aria-label="Sort products"
        disabled={pending}
        onChange={(e) => start(() => router.push(hrefFor[e.target.value], { scroll: false }))}
        className="border border-slate-300 rounded-lg bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      >
        {Object.entries(SORTS).map(([k, label]) => (
          <option key={k} value={k}>{label}</option>
        ))}
      </select>
    </label>
  )
}
