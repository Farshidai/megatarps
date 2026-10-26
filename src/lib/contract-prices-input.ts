// Pure validation helpers for admin contract-price input (shared by the quote builder and
// the account page server actions). No I/O.

export const CONTRACT_SAVE_STATUSES = ['quoted', 'accepted', 'ordered', 'shipped', 'delivered'] as const
export const DEFAULT_CONTRACT_DAYS = 90
export const MAX_CONTRACT_PRICE_CENTS = 10_000_000 // $100,000 per unit
export const MAX_CONTRACT_MIN_QTY = 100_000

export function todayIso(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10)
}

export function defaultValidUntil(now = Date.now(), days = DEFAULT_CONTRACT_DAYS): string {
  return new Date(now + days * 86_400_000).toISOString().slice(0, 10)
}

/** '' / null → null (no end date). Otherwise YYYY-MM-DD, today..+3 years. Throws a user-facing message. */
export function parseValidUntil(raw: unknown, now = Date.now()): string | null {
  const s = String(raw ?? '').trim()
  if (!s) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(new Date(`${s}T12:00:00Z`).getTime())) throw new Error('Valid-until must be a date (YYYY-MM-DD)')
  if (s < todayIso(now)) throw new Error('Valid-until can’t be in the past')
  if (s > todayIso(now + 3 * 366 * 86_400_000)) throw new Error('Valid-until can be at most 3 years out')
  return s
}

/** Dollars ("74.50", "$1,200") or cents (number) → positive integer cents. Throws. */
export function parsePriceCents(raw: unknown, { fromDollars }: { fromDollars: boolean }): number {
  const n = fromDollars ? Math.round(parseFloat(String(raw ?? '').replace(/[$,\s]/g, '')) * 100) : Math.round(Number(raw))
  if (!Number.isFinite(n) || n <= 0) throw new Error('Contract price must be more than $0')
  if (n > MAX_CONTRACT_PRICE_CENTS) throw new Error('Contract price is too large')
  return n
}

export function parseMinQty(raw: unknown): number {
  const s = String(raw ?? '').trim()
  const n = s === '' ? 1 : Number(s)
  if (!Number.isInteger(n) || n < 1 || n > MAX_CONTRACT_MIN_QTY) throw new Error(`Min quantity must be a whole number from 1 to ${MAX_CONTRACT_MIN_QTY.toLocaleString('en-US')}`)
  return n
}

export const isUuid = (s: unknown) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
