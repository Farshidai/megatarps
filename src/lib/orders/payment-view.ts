// Pure: how an order's payment looks on /admin/orders. Client/server safe.
export type PaymentBucket = 'paid' | 'awaiting' | 'abandoned'

export const ABANDONED_AFTER_MS = 24 * 60 * 60 * 1000

export interface OrderPaymentFields {
  payment_status: string | null
  status?: string | null
  created_at: string
}

/**
 * paid      — payment_status 'paid'
 * awaiting  — net-terms 'invoiced', ACH 'processing', or a card checkout started < 24 h ago
 * abandoned — a 'pending' checkout older than 24 h, or Stripe 'expired' / 'failed'
 */
export function paymentBucket(o: OrderPaymentFields, now = Date.now()): PaymentBucket {
  const ps = (o.payment_status ?? 'pending').toLowerCase()
  if (ps === 'paid') return 'paid'
  if (ps === 'expired' || ps === 'failed') return 'abandoned'
  if (ps === 'pending') return now - new Date(o.created_at).getTime() > ABANDONED_AFTER_MS ? 'abandoned' : 'awaiting'
  return 'awaiting' // invoiced, processing, refunded-later states etc.
}

export const PAYMENT_LABELS: Record<string, string> = {
  paid: 'Paid',
  invoiced: 'Invoiced (net terms)',
  processing: 'ACH processing',
  pending: 'Awaiting payment',
  expired: 'Checkout expired',
  failed: 'Payment failed',
}

export function paymentLabel(o: OrderPaymentFields, now = Date.now()): string {
  const ps = (o.payment_status ?? 'pending').toLowerCase()
  if (ps === 'pending' && paymentBucket(o, now) === 'abandoned') return 'Abandoned checkout'
  return PAYMENT_LABELS[ps] ?? ps
}
