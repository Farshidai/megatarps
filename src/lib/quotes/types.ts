// Quote lifecycle types + pure helpers. Safe to import from client components.

export const QUOTE_STATUSES = [
  'pending', 'quoted', 'accepted', 'ordered', 'shipped', 'delivered', 'expired', 'declined',
] as const
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

export const DELIVERY_TYPES = ['dock', 'liftgate', 'residential'] as const
export type DeliveryType = (typeof DELIVERY_TYPES)[number]

export const DELIVERY_LABELS: Record<DeliveryType, { label: string; hint: string }> = {
  dock: { label: 'Loading dock', hint: 'Commercial address with a dock or forklift' },
  liftgate: { label: 'Liftgate', hint: 'No dock — truck lowers pallets to the ground' },
  residential: { label: 'Residential / jobsite', hint: 'Home, farm or jobsite; limited access' },
}

export type QuoteEventType = 'created' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'paid'

export interface QuoteLine {
  product_id?: string | null
  sku: string
  name: string
  quantity: number
  unit_price_cents: number
  line_total: number
  quote_only?: boolean
}

export interface QuoteAddress {
  name?: string
  company?: string
  line1?: string
  line2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

export interface QuoteRecord {
  id: string
  quote_number: string
  public_token: string
  contractor_id: string | null
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  guest_company: string | null
  items: QuoteLine[]
  subtotal_cents: number | null
  shipping_estimate_cents: number | null
  freight_cents: number
  tax_cents: number
  discount_cents: number
  total_cents: number | null
  status: QuoteStatus
  project_type: string | null
  project_location: string | null
  timeline: string | null
  special_requirements: string | null
  ai_recommended: boolean | null
  quoted_by: string | null
  quoted_at: string | null
  valid_until: string | null
  customer_message: string | null
  sent_at: string | null
  accepted_at: string | null
  declined_reason: string | null
  stripe_checkout_session_id: string | null
  shipping_address: QuoteAddress | null
  delivery_type: DeliveryType | null
  delivery_zip: string | null
  needed_by: string | null
  payment_method: string | null
  created_at: string
  updated_at: string | null
}

export interface QuoteEvent {
  id: string
  quote_id: string
  type: QuoteEventType
  note: string | null
  created_at: string
}

export interface QuoteTotals {
  subtotal_cents: number
  freight_cents: number
  tax_cents: number
  discount_cents: number
  total_cents: number
}

const int = (n: unknown) => {
  const v = Math.round(Number(n))
  return Number.isFinite(v) && v > 0 ? v : 0
}

export function computeTotals(
  lines: Pick<QuoteLine, 'quantity' | 'unit_price_cents'>[],
  extra: { freight_cents?: number; tax_cents?: number; discount_cents?: number },
): QuoteTotals {
  const subtotal = lines.reduce((s, l) => s + int(l.unit_price_cents) * int(l.quantity), 0)
  const freight = int(extra.freight_cents)
  const tax = int(extra.tax_cents)
  const discount = Math.min(int(extra.discount_cents), subtotal + freight + tax)
  return {
    subtotal_cents: subtotal,
    freight_cents: freight,
    tax_cents: tax,
    discount_cents: discount,
    total_cents: subtotal + freight + tax - discount,
  }
}

/** A quoted quote past its valid_until date is expired even if the row still says 'quoted'. */
export function effectiveStatus(q: Pick<QuoteRecord, 'status' | 'valid_until'>, now = Date.now()): QuoteStatus {
  if (q.status === 'quoted' && q.valid_until && new Date(q.valid_until).getTime() < now) return 'expired'
  return q.status
}

export function customerName(q: Pick<QuoteRecord, 'guest_name' | 'guest_company'>) {
  return q.guest_name || q.guest_company || 'Customer'
}

export const STATUS_STYLES: Record<QuoteStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 ring-amber-200',
  quoted: 'bg-blue-100 text-blue-800 ring-blue-200',
  accepted: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  ordered: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
  shipped: 'bg-purple-100 text-purple-800 ring-purple-200',
  delivered: 'bg-slate-100 text-slate-700 ring-slate-200',
  expired: 'bg-red-100 text-red-700 ring-red-200',
  declined: 'bg-slate-200 text-slate-700 ring-slate-300',
}

export const STATUS_LABELS: Record<QuoteStatus, string> = {
  pending: 'Awaiting pricing',
  quoted: 'Quote sent',
  accepted: 'Accepted',
  ordered: 'Ordered',
  shipped: 'Shipped',
  delivered: 'Delivered',
  expired: 'Expired',
  declined: 'Declined',
}

export function ageLabel(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${mins}m`
  const hrs = Math.round(mins / 60)
  if (hrs < 48) return `${hrs}h`
  return `${Math.round(hrs / 24)}d`
}

/** Lightweight catalog entry for the quote form's product picker (no cost data). */
export interface PickerProduct {
  id: string
  sku: string
  name: string
  slug: string
  size: string // e.g. "20x30"
  tarp_type: string
  thickness_mil: number | null
  retail_price_cents: number
  units_per_full_pallet: number | null
  /** price floor (cost × 1.15); the pricing engine never suggests less */
  min_unit_price_cents: number | null
  quote_only: boolean
}

/** Request-time clock (server components render once per request, so this is stable). */
export function nowMs(): number {
  return Date.now()
}
