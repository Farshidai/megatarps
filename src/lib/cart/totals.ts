// Display totals for the cart UI (server re-prices and re-computes freight at checkout). Client-safe.
import { scheduleLineTotal } from '@/lib/price-schedule'
import { calculateFreight, type FreightConfig, type FreightResult } from '@/lib/freight'
import type { CartItem } from './types'
import type { CatalogEntry } from './catalog-types'

export function cartTotals(
  items: CartItem[],
  products: Record<string, CatalogEntry> | undefined,
  freightConfig?: FreightConfig | null,
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
      subtotal += scheduleLineTotal(p.prices, i.quantity) // server-computed schedule for this buyer
      retail += p.retail_price_cents * i.quantity
    }
  }
  const freight: FreightResult | null = freightConfig
    ? calculateFreight(
        priced.map((i) => ({ sku: i.sku, quantity: i.quantity, unitWeightLb: products?.[i.sku]?.unit_weight_lb ?? null })),
        freightConfig,
        subtotal,
      )
    : null
  const threshold = freightConfig?.settings.free_freight_threshold_cents ?? null
  return {
    subtotal,
    savings: retail - subtotal,
    priced,
    quote,
    unavailable,
    freight,
    /** free-freight nudge only when a threshold is configured and the order ships parcel */
    freeFreightThreshold: threshold && freight?.method === 'parcel' ? threshold : null,
    toFreeFreight: threshold ? Math.max(0, threshold - subtotal) : 0,
    freightProgress: threshold ? Math.min(1, subtotal / threshold) : 0,
  }
}
