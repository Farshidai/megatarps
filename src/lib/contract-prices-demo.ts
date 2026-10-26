// DEMO MODE sample contract prices for the approved demo account (Heartland Roofing,
// cookie demo_account=approved). Built from the demo catalog by SKU so it survives a
// rebuild of demo-catalog.json. Saves in demo mode are never persisted.
import { demoProducts } from '@/lib/demo'
import type { ContractPrice } from '@/lib/pricing'

export interface ContractPriceRow extends ContractPrice {
  id: string
  contractor_id: string
  note: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

/** The approved demo account in src/lib/accounts-demo.ts */
export const DEMO_APPROVED_ACCOUNT_ID = 'demo-0000-0000-0000-000000000002'
/** Sent demo quote (src/lib/quotes/demo-data.ts) used as the source of the first sample. */
export const DEMO_SOURCE_QUOTE_ID = '7f1c2d3e-0001-4a00-9000-00000000d001'

const day = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString()

function sample(sku: string, row: Omit<ContractPriceRow, 'product_id' | 'sku' | 'contractor_id'>): ContractPriceRow | null {
  const p = demoProducts.find((x) => x.xpose_sku === sku && x.active && x.retail_price_cents > 0)
  if (!p) return null
  return { ...row, product_id: p.id, sku: p.xpose_sku, contractor_id: DEMO_APPROVED_ACCOUNT_ID }
}

export function demoContractPrices(): ContractPriceRow[] {
  return [
    // 30x40 10-mil: guest $71.76 = cost floor, so the normal account price can't go lower.
    // Farshid agreed $69.90 on a quote: contract prices deliberately ignore the floor.
    sample('MT-30X40-10MIL', {
      id: 'demo-cp-0001',
      unit_price_cents: 6990,
      min_quantity: 1,
      valid_until: day(76).slice(0, 10),
      source_quote_id: DEMO_SOURCE_QUOTE_ID,
      note: 'Matched spring re-roof pricing (demo)',
      created_by: 'demo-admin@megatarps.com',
      created_at: day(-14),
      updated_at: day(-14),
    }),
    // 20x30 10-mil: normal account price $35.88 (guest $38.30 − 8%, held at the cost floor);
    // contract $34.50 for 5+. Below 5 units the normal price applies.
    sample('MT-20X30-10MIL', {
      id: 'demo-cp-0002',
      unit_price_cents: 3450,
      min_quantity: 5,
      valid_until: day(41).slice(0, 10),
      source_quote_id: null,
      note: 'Phone order, agreed price (demo)',
      created_by: 'demo-admin@megatarps.com',
      created_at: day(-5),
      updated_at: day(-5),
    }),
  ].filter((x): x is ContractPriceRow => !!x)
}
