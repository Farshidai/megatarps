'use client'

// Signed-in state for the navbar (fetched once per page load; the layout itself stays static).
import { useEffect, useState } from 'react'

export interface AccountState {
  signedIn: boolean
  name: string | null
  status: string
}

export function useAccountState(): AccountState | null {
  const [state, setState] = useState<AccountState | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch('/api/account/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled && j) setState(j as AccountState) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])
  return state
}
