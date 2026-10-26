// Admin quote-builder price suggestion (client-safe, pure). Team F.
// Normal engine price (tiers + pallet + account %), or the client's contract price when the
// account is approved and the contract is lower. For quote-only products (no online price)
// an active contract price is the only suggestion we have, so it is used directly.
import { unitPriceCents, isContractPriced, contractUnitPriceCents, isQuoteOnly, type PricedProduct, type PricingRule, type PriceOptions } from '@/lib/pricing'

export function suggestedUnitPrice(product: PricedProduct, qty: number, rules: PricingRule[], opts: PriceOptions): { cents: number; contract: boolean } {
  if (isQuoteOnly(product)) {
    if (!opts.accountApproved) return { cents: 0, contract: false }
    // contractUnitPriceCents() refuses quote-only products for the storefront; for a quote we
    // look the row up as if the product had a price.
    const c = contractUnitPriceCents({ ...product, retail_price_cents: Number.MAX_SAFE_INTEGER }, qty, opts.contractPrices, opts.today)
    return c ? { cents: c, contract: true } : { cents: 0, contract: false }
  }
  return { cents: unitPriceCents(product, qty, rules, opts), contract: isContractPriced(product, qty, rules, opts) }
}
