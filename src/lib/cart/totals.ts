// Display totals for the cart UI (server re-prices at checkout). Client-safe.
import { lineTotalCents, type PricingRule, type PriceOptions } from '@/lib/pricing'
import type { CartItem } from './types'
import type { CatalogEntry } from './catalog-types'
import { FREE_FREIGHT_THRESHOLD_CENTS } from './constants'

export function cartTotals(
  items: CartItem[],
  products: Record<string, CatalogEntry> | undefined,
  rules: PricingRule[],
  opts: PriceOptions,
) {
  let subtotal = 0
  let retail = 0
  const priced: CartItem[] = []
  const quote: CartItem[] = []
  const unavailable: CartItem[] = []
  for (const i of items) {
    const p = products?.[i.sku]
    if (i.quote_only || p?.quote_only) quote.push(i)
    else if (!p) unavailable.push(i)
    else {
      priced.push(i)
      subtotal += lineTotalCents(p, i.quantity, rules, opts)
      retail += p.retail_price_cents * i.quantity
    }
  }
  const toFreeFreight = Math.max(0, FREE_FREIGHT_THRESHOLD_CENTS - subtotal)
  return {
    subtotal,
    savings: retail - subtotal,
    priced,
    quote,
    unavailable,
    toFreeFreight,
    freeFreight: subtotal > 0 && toFreeFreight === 0,
    freightProgress: Math.min(1, subtotal / FREE_FREIGHT_THRESHOLD_CENTS),
  }
}
