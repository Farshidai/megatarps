// DEMO MODE sample quotes. Built from the real demo catalog + the shared pricing engine,
// so the numbers line up with what the storefront shows. Held in a process-wide in-memory
// store (see store.ts) so the admin builder, customer page and accept/decline flows can be
// clicked through without Supabase. Restarting the server resets it.
import { demoProducts, demoPricingRules } from '@/lib/demo'
import { unitPriceCents, isQuoteOnly } from '@/lib/pricing'
import type { Product } from '@/types'
import { computeTotals, type QuoteEvent, type QuoteLine, type QuoteRecord } from './types'

export const DEMO_TOKEN = 'demo-token'
export const DEMO_CONTRACTOR_ID = '00000000-0000-4000-8000-00000000de30'

const priced = demoProducts.filter((p) => p.active && !isQuoteOnly(p) && p.tarp_type !== 'accessory')
const quoteOnly = demoProducts.filter((p) => p.active && isQuoteOnly(p))

function pick(sku: string, fallbackPool: Product[], i: number): Product | undefined {
  return demoProducts.find((p) => p.xpose_sku === sku) ?? fallbackPool[i % Math.max(1, fallbackPool.length)]
}

function line(p: Product | undefined, quantity: number, manualCents?: number): QuoteLine | null {
  if (!p) return null
  const auto = unitPriceCents(p, quantity, demoPricingRules)
  const unit = manualCents ?? auto
  return {
    product_id: p.id,
    sku: p.xpose_sku,
    name: p.name,
    quantity,
    unit_price_cents: unit,
    line_total: unit * quantity,
    quote_only: isQuoteOnly(p),
  }
}

const compact = (xs: (QuoteLine | null)[]) => xs.filter((x): x is QuoteLine => !!x)

const iso = (offsetHours: number) => new Date(Date.now() + offsetHours * 3600_000).toISOString()

function base(): Omit<QuoteRecord, 'id' | 'quote_number' | 'public_token' | 'items' | 'status' | 'created_at'> {
  return {
    contractor_id: null, guest_name: null, guest_email: null, guest_phone: null, guest_company: null,
    subtotal_cents: null, shipping_estimate_cents: null, freight_cents: 0, tax_cents: 0, discount_cents: 0,
    total_cents: null, project_type: null, project_location: null, timeline: null,
    special_requirements: null, ai_recommended: false, quoted_by: null, quoted_at: null,
    valid_until: null, customer_message: null, sent_at: null, accepted_at: null, declined_reason: null,
    stripe_checkout_session_id: null, shipping_address: null, delivery_type: null, delivery_zip: null,
    needed_by: null, payment_method: null, updated_at: null,
  }
}

function priceIt(q: QuoteRecord): QuoteRecord {
  const t = computeTotals(q.items, q)
  return { ...q, ...t, shipping_estimate_cents: t.freight_cents }
}

export function buildDemoQuotes(): { quotes: QuoteRecord[]; events: QuoteEvent[]; notes: Record<string, string> } {
  const year = new Date().getFullYear()

  // 1) Sent quote — the public /quote/demo-token sample
  const sent = priceIt({
    ...base(),
    id: '7f1c2d3e-0001-4a00-9000-00000000d001',
    quote_number: `MQ-${year}-4182`,
    public_token: DEMO_TOKEN,
    contractor_id: DEMO_CONTRACTOR_ID,
    guest_name: 'Dana Whitfield',
    guest_email: 'dana@prairieroofing.example',
    guest_phone: '(816) 555-0142',
    guest_company: 'Prairie Roofing Co.',
    status: 'quoted',
    items: compact([
      line(pick('MT-20X30-10MIL', priced, 0), 50),
      line(pick('MT-30X40-12MIL', priced, 1), 24),
      line(pick('20X40-10MIL-HP30', quoteOnly, 0), 30, 6450),
    ]),
    freight_cents: 38500,
    project_type: 'commercial',
    project_location: 'Overland Park, KS',
    timeline: '1-2 weeks',
    special_requirements: 'Re-roof on a 3-building complex. Need everything on one truck.',
    delivery_type: 'liftgate',
    delivery_zip: '66210',
    needed_by: iso(24 * 12).slice(0, 10),
    shipping_address: { name: 'Dana Whitfield', company: 'Prairie Roofing Co.', line1: '8800 W 110th St', city: 'Overland Park', state: 'KS', zip: '66210', country: 'US' },
    quoted_by: 'Farshid',
    quoted_at: iso(-20),
    sent_at: iso(-20),
    valid_until: iso(24 * 13),
    customer_message: 'Thanks Dana — pricing below includes our 50+ volume tier on the 10-mil tarps. Freight is LTL with liftgate to Overland Park; we can ship within 2 business days of acceptance.',
    created_at: iso(-28),
  })

  // 2) Fresh request waiting for pricing (includes quote-only pallet SKUs)
  const pending = priceIt({
    ...base(),
    id: '7f1c2d3e-0002-4a00-9000-00000000d002',
    quote_number: `MQ-${year}-4197`,
    public_token: 'demo-token-pending-8c1f2a',
    guest_name: 'Luis Ortega',
    guest_email: 'luis@heartlandag.example',
    guest_phone: '(913) 555-0187',
    guest_company: 'Heartland Ag Supply',
    status: 'pending',
    items: compact([
      line(pick('40X60-10MIL-FP20', quoteOnly, 1), 40, 0),
      line(pick('30X50-10MIL-HP18', quoteOnly, 2), 36, 0),
      line(pick('MT-40X60-10MIL', priced, 2), 10, 0),
    ]),
    project_type: 'agricultural',
    project_location: 'Garnett, KS',
    timeline: 'urgent',
    special_requirements: 'Hay storage covers before the first freeze. Farm has a forklift but no dock.',
    delivery_type: 'residential',
    delivery_zip: '66032',
    needed_by: iso(24 * 9).slice(0, 10),
    shipping_address: { name: 'Luis Ortega', company: 'Heartland Ag Supply', line1: '2150 NE 1800 Rd', city: 'Garnett', state: 'KS', zip: '66032', country: 'US' },
    created_at: iso(-6),
  })

  // 3) Accepted and paid → order
  const ordered = priceIt({
    ...base(),
    id: '7f1c2d3e-0003-4a00-9000-00000000d003',
    quote_number: `MQ-${year}-4120`,
    public_token: 'demo-token-ordered-51b7e0',
    guest_name: 'Marcus Bell',
    guest_email: 'mbell@kcrestoration.example',
    guest_company: 'KC Restoration Group',
    status: 'ordered',
    items: compact([
      line(pick('MT-16X20-12MIL', priced, 3), 100),
      line(pick('BB-11B-10', demoProducts, 1), 20),
    ]),
    freight_cents: 21500,
    discount_cents: 5000,
    delivery_type: 'dock',
    delivery_zip: '64120',
    shipping_address: { name: 'Receiving', company: 'KC Restoration Group', line1: '1400 N Topping Ave', city: 'Kansas City', state: 'MO', zip: '64120', country: 'US' },
    quoted_by: 'Farshid',
    quoted_at: iso(-24 * 6),
    sent_at: iso(-24 * 6),
    valid_until: iso(24 * 8),
    accepted_at: iso(-24 * 5),
    payment_method: 'card',
    customer_message: 'Storm-season pricing locked for 14 days.',
    created_at: iso(-24 * 7),
  })

  // 4) Declined
  const declined = priceIt({
    ...base(),
    id: '7f1c2d3e-0004-4a00-9000-00000000d004',
    quote_number: `MQ-${year}-4088`,
    public_token: 'demo-token-declined-0a9d44',
    guest_name: 'Priya Natarajan',
    guest_email: 'priya@ozarkwarehousing.example',
    guest_company: 'Ozark Warehousing',
    status: 'declined',
    items: compact([line(pick('MT-30X40-10MIL', priced, 4), 12)]),
    freight_cents: 14500,
    delivery_type: 'dock',
    delivery_zip: '65803',
    quoted_by: 'Farshid',
    quoted_at: iso(-24 * 12),
    sent_at: iso(-24 * 12),
    valid_until: iso(24 * 2),
    declined_reason: 'Project pushed to spring — will re-request in March.',
    created_at: iso(-24 * 13),
  })

  const ev = (quote_id: string, type: QuoteEvent['type'], at: string, note: string | null = null, n = 0): QuoteEvent =>
    ({ id: `${quote_id.slice(0, 18)}-ev${n}`, quote_id, type, note, created_at: at })

  const events: QuoteEvent[] = [
    ev(sent.id, 'created', sent.created_at, 'Submitted via bulk quote form', 1),
    ev(sent.id, 'sent', sent.sent_at!, `Emailed to ${sent.guest_email}`, 2),
    ev(sent.id, 'viewed', iso(-18), null, 3),
    ev(pending.id, 'created', pending.created_at, 'Submitted via bulk quote form', 1),
    ev(ordered.id, 'created', ordered.created_at, 'Submitted from cart', 1),
    ev(ordered.id, 'sent', ordered.sent_at!, null, 2),
    ev(ordered.id, 'viewed', iso(-24 * 5 - 2), null, 3),
    ev(ordered.id, 'accepted', ordered.accepted_at!, 'Accepted — paying by card', 4),
    ev(ordered.id, 'paid', iso(-24 * 5 + 0.1), 'Stripe payment received', 5),
    ev(declined.id, 'created', declined.created_at, null, 1),
    ev(declined.id, 'sent', declined.sent_at!, null, 2),
    ev(declined.id, 'declined', iso(-24 * 9), declined.declined_reason, 3),
  ]

  const notes: Record<string, string> = {
    [sent.id]: 'Repeat customer. Matched last spring pricing on the pallet line. Freight quoted from Estes, $412 cost.',
    [pending.id]: 'Check pallet availability on 40x60 before quoting.',
  }

  return { quotes: [pending, sent, ordered, declined], events, notes }
}
