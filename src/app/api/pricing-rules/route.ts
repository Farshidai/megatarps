// GET /api/pricing-rules?skus=A,B,C
// Display-only pricing data for the mini cart: active volume rules, the buyer's wholesale
// discount, slim product rows (with ship weight) for the requested SKUs, and freight rates. Checkout never trusts any of this;
// /api/checkout re-prices everything server-side.
import { getPricingRules } from '@/lib/products'
import { getAccountPricing } from '@/lib/accounts'
import { getCartCatalog } from '@/lib/cart/server'
import { getFreightConfig } from '@/lib/freight-server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const skus = (url.searchParams.get('skus') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100)

  try {
    const [rules, account, products, freight] = await Promise.all([
      getPricingRules(),
      getAccountPricing(),
      skus.length ? getCartCatalog(skus) : Promise.resolve([]),
      getFreightConfig(),
    ])
    return Response.json(
      {
        rules: rules.map((r) => ({
          tarp_type: r.tarp_type,
          thickness_mil: r.thickness_mil,
          min_quantity: r.min_quantity,
          max_quantity: r.max_quantity,
          discount_from_retail_percent: r.discount_from_retail_percent,
          priority: r.priority,
          active: r.active,
        })),
        wholesaleDiscountPercent: account.status === 'approved' ? account.wholesaleDiscountPercent : 0,
        accountApproved: account.status === 'approved',
        products,
        freight,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (e) {
    console.error('pricing-rules error', e)
    return Response.json({ error: 'Could not load pricing' }, { status: 500 })
  }
}
