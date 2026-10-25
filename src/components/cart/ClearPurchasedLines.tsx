'use client'

import { useEffect } from 'react'
import { removeWhere } from '@/lib/cart/store'

/** After a successful checkout, drop the lines that were paid for. Quote-only lines stay. */
export function ClearPurchasedLines() {
  useEffect(() => {
    removeWhere((i) => !i.quote_only)
  }, [])
  return null
}
