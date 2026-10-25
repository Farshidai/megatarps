// Pure server-side checkout validation + re-pricing. No I/O, so it is easy to test.
// The browser only ever sends {sku, quantity}; every other field is ignored and every
// price comes from the product row + pricing rules + the buyer's account standing.
import { unitPriceCents, discountForQuantity, isQuoteOnly, type PricingRule, type PriceOptions } from '@/lib/pricing'
import type { Product } from '@/types'
import { MAX_CART_LINES, MAX_LINE_QUANTITY } from './constants'
import { productWeightLb, formatLb, type FreightResult } from '@/lib/freight'

export interface CheckoutLineInput {
  sku: string
  quantity: number
}

export interface PricedLine {
  product_id: string
  sku: string
  name: string
  slug: string
  image?: string
  quantity: number
  retail_price_cents: number
  volume_discount_percent: number
  unit_price_cents: number
  line_total_cents: number
  /** ship weight per unit (lb), null = unknown */
  unit_weight_lb: number | null
}

export class CheckoutError extends Error {
  constructor(message: string, public status = 400, public details?: unknown) {
    super(message)
  }
}

/** Validates the raw request body. Returns merged lines (one per SKU). Throws CheckoutError. */
export function parseCheckoutBody(body: unknown): CheckoutLineInput[] {
  const raw = (body as { items?: unknown; lines?: unknown } | null)?.items ?? (body as { lines?: unknown } | null)?.lines
  if (!Array.isArray(raw) || raw.length === 0) throw new CheckoutError('No items provided')
  if (raw.length > MAX_CART_LINES) throw new CheckoutError(`Too many lines (max ${MAX_CART_LINES})`)

  const merged = new Map<string, number>()
  raw.forEach((entry, idx) => {
    if (!entry || typeof entry !== 'object') throw new CheckoutError(`Line ${idx + 1}: invalid line`)
    const { sku, quantity } = entry as { sku?: unknown; quantity?: unknown }
    if (typeof sku !== 'string' || !sku.trim() || sku.length > 64) throw new CheckoutError(`Line ${idx + 1}: invalid SKU`)
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) {
      throw new CheckoutError(`Line ${idx + 1} (${sku}): quantity must be a whole number from 1 to ${MAX_LINE_QUANTITY}`)
    }
    const key = sku.trim()
    merged.set(key, (merged.get(key) ?? 0) + quantity)
  })
  for (const [sku, q] of merged) {
    if (q > MAX_LINE_QUANTITY) throw new CheckoutError(`${sku}: quantity must be at most ${MAX_LINE_QUANTITY}`)
  }
  return [...merged].map(([sku, quantity]) => ({ sku, quantity }))
}

/** Re-prices every line from server data. Rejects unknown, inactive, out-of-stock and quote-only SKUs. */
export function priceCheckoutLines(
  lines: CheckoutLineInput[],
  products: Product[],
  rules: PricingRule[],
  opts: PriceOptions = {},
): { lines: PricedLine[]; subtotal_cents: number } {
  const bySku = new Map(products.filter((p) => p.active).map((p) => [p.xpose_sku, p]))
  const unknown = lines.filter((l) => !bySku.has(l.sku)).map((l) => l.sku)
  if (unknown.length) throw new CheckoutError(`Unknown SKU: ${unknown.join(', ')}`, 400, { unknown })

  const quoteOnly = lines.filter((l) => isQuoteOnly(bySku.get(l.sku)!)).map((l) => l.sku)
  if (quoteOnly.length) {
    throw new CheckoutError(`Quote-only items can't be bought online: ${quoteOnly.join(', ')}. Request a quote instead.`, 400, { quote_only: quoteOnly })
  }
  const oos = lines.filter((l) => !bySku.get(l.sku)!.in_stock).map((l) => l.sku)
  if (oos.length) throw new CheckoutError(`Out of stock: ${oos.join(', ')}`, 409, { out_of_stock: oos })

  const priced = lines.map((l) => {
    const p = bySku.get(l.sku)!
    const unit = unitPriceCents(p, l.quantity, rules, opts)
    if (!Number.isInteger(unit) || unit <= 0) throw new CheckoutError(`Could not price ${l.sku}`, 500)
    return {
      product_id: p.id,
      sku: p.xpose_sku,
      name: p.name,
      slug: p.slug,
      image: p.image_urls?.[0],
      quantity: l.quantity,
      retail_price_cents: p.retail_price_cents,
      volume_discount_percent: discountForQuantity(p, l.quantity, rules),
      unit_price_cents: unit,
      line_total_cents: unit * l.quantity,
      unit_weight_lb: productWeightLb(p as Parameters<typeof productWeightLb>[0]),
    }
  })
  return { lines: priced, subtotal_cents: priced.reduce((s, l) => s + l.line_total_cents, 0) }
}

/** Compact "SKU*qty,SKU*qty" chunks, each ≤ 500 chars (Stripe metadata value limit). */
export function compactItemsMetadata(lines: { sku: string; quantity: number }[], prefix = 'items_'): Record<string, string> {
  const out: Record<string, string> = {}
  let chunk = ''
  let n = 0
  for (const l of lines) {
    const part = `${l.sku}*${l.quantity}`
    if (chunk && chunk.length + 1 + part.length > 500) {
      out[`${prefix}${n++}`] = chunk
      chunk = ''
    }
    chunk = chunk ? `${chunk},${part}` : part
  }
  if (chunk) out[`${prefix}${n}`] = chunk
  return out
}

export function parseCompactItems(metadata: Record<string, string> | null | undefined, prefix = 'items_'): CheckoutLineInput[] {
  if (!metadata) return []
  const keys = Object.keys(metadata).filter((k) => k.startsWith(prefix)).sort((a, b) => Number(a.slice(prefix.length)) - Number(b.slice(prefix.length)))
  const out: CheckoutLineInput[] = []
  for (const k of keys) {
    for (const part of metadata[k].split(',')) {
      const i = part.lastIndexOf('*')
      if (i <= 0) continue
      const quantity = parseInt(part.slice(i + 1), 10)
      if (quantity > 0) out.push({ sku: part.slice(0, i), quantity })
    }
  }
  return out
}

/** Stripe Checkout line_items built ONLY from server-priced lines + server-computed freight. */
export function buildStripeLineItems(lines: PricedLine[], freight?: FreightResult) {
  const items = lines.map((l) => ({
    quantity: l.quantity,
    price_data: {
      currency: 'usd' as const,
      unit_amount: l.unit_price_cents,
      product_data: {
        name: l.name,
        description: `SKU ${l.sku}${l.volume_discount_percent ? ` · ${l.volume_discount_percent}% volume pricing` : ''}`,
        images: l.image && /^https:\/\//.test(l.image) ? [l.image] : [],
        metadata: { sku: l.sku, product_id: l.product_id },
      },
    },
  }))
  if (freight && freight.method !== 'quote' && freight.freightCents && freight.freightCents > 0) {
    items.push({
      quantity: 1,
      price_data: {
        currency: 'usd' as const,
        unit_amount: freight.freightCents,
        product_data: {
          name: `Freight – ${freight.method === 'ltl' ? 'LTL truck' : 'parcel'}, ${formatLb(freight.totalWeightLb)} lb`,
          description: `Billed weight ${freight.billableWeightLb} lb`,
          images: [],
          metadata: { sku: 'FREIGHT', product_id: '' },
        },
      },
    })
  }
  return items
}
