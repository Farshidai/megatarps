// GET /api/pricing-rules?skus=A,B,C
// Display-only pricing data for the mini cart: slim product rows (with ship weight) for the
// requested SKUs, each with a SERVER-COMPUTED price schedule for this buyer (unit price at
// every quantity break: piece tiers, pallets, contract rows, floor applied), plus freight
// rates. The price floor / cost never leave the server. Checkout never trusts any of this;
// /api/checkout re-prices everything server-side.
// contractPrices: ONLY the signed-in approved account's own active contract prices (from its
// session via getAccountPricing(); RLS-scoped). Guests / pending / rejected get []. Never other accounts'.
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
    const [rules, account, freight] = await Promise.all([getPricingRules(), getAccountPricing(), getFreightConfig()])
    const products = skus.length ? await getCartCatalog(skus, account, rules) : []
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
          // pallet-first fields: without them the browser treats pallet rules as piece tiers
          unit: r.unit,
          price_multiplier: r.price_multiplier,
          requires_account: r.requires_account,
          label: r.label,
        })),
        wholesaleDiscountPercent: account.status === 'approved' ? account.wholesaleDiscountPercent : 0,
        accountApproved: account.status === 'approved',
        contractPrices:
          account.status === 'approved'
            ? (account.contractPrices ?? []).map((c) => ({
                product_id: c.product_id,
                sku: c.sku,
                unit_price_cents: c.unit_price_cents,
                min_quantity: c.min_quantity,
                valid_until: c.valid_until,
              }))
            : [],
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
