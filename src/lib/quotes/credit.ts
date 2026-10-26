// Net-terms credit check (pure). A quote accepted on Net terms creates an invoiced order, so
// the account's credit limit must cover this quote PLUS every open (unpaid, invoiced) order.
export interface CreditCheck {
  ok: boolean
  limitCents: number | null
  openCents: number
  quoteCents: number
  availableCents: number
  message?: string
}

const usd = (c: number) => `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/**
 * No credit limit on file (null) → refused: Net terms need a limit set by MegaTarps
 * (fail closed). A limit of 0 also refuses.
 */
export function checkCreditLimit(limitCents: number | null | undefined, openInvoicedCents: number, quoteTotalCents: number): CreditCheck {
  const limit = limitCents == null ? null : Math.max(0, Math.floor(Number(limitCents)))
  const open = Math.max(0, Math.floor(Number(openInvoicedCents) || 0))
  const quote = Math.max(0, Math.floor(Number(quoteTotalCents) || 0))
  const available = limit == null ? 0 : Math.max(0, limit - open)
  const base = { limitCents: limit, openCents: open, quoteCents: quote, availableCents: available }
  if (limit == null || limit <= 0) {
    return { ...base, ok: false, message: 'Your account does not have a Net terms credit limit yet. Pay by card or ACH, or contact us to set one up.' }
  }
  if (open + quote > limit) {
    return {
      ...base,
      ok: false,
      message: `This quote (${usd(quote)}) is more than your available Net terms credit (${usd(available)} of your ${usd(limit)} limit; ${usd(open)} is on open invoices). Pay by card or ACH, or contact us to raise your limit.`,
    }
  }
  return { ...base, ok: true }
}
