// Pure: when does a Stripe Checkout event mean a QUOTE is paid (→ quotes.status = 'ordered')?
// Card: checkout.session.completed with payment_status 'paid'. ACH (us_bank_account):
// completed arrives with payment_status 'unpaid'; the money only counts at
// checkout.session.async_payment_succeeded. Failed / expired never order the quote.
export function quotePaidByEvent(type: string, paymentStatus: string | null | undefined): boolean {
  if (type === 'checkout.session.async_payment_succeeded') return true
  if (type === 'checkout.session.completed') return paymentStatus === 'paid' || paymentStatus === 'no_payment_required'
  return false
}
