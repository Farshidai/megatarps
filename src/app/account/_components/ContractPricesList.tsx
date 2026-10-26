import Link from 'next/link'
import { Handshake, FileText } from 'lucide-react'
import { getAccountPricing } from '@/lib/accounts'
import { getCartCatalog, getProductsBySkus } from '@/lib/cart/server'
import { cartItemFromEntry } from '@/lib/cart/catalog-types'
import { getPricingRules } from '@/lib/products'
import { unitPriceCents } from '@/lib/pricing'
import { formatPrice } from '@/lib/utils'
import { ContractReorderButton } from '@/components/pricing/ContractReorderButton'

const fmtDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { dateStyle: 'medium' })

/** "Your contract prices" on /account: the signed-in approved account's own active contract prices (Team F). */
export async function ContractPricesList() {
  const account = await getAccountPricing()
  const contracts = account.status === 'approved' ? account.contractPrices ?? [] : []
  if (!contracts.length) return null
  const skus = contracts.map((c) => c.sku)
  const rules = await getPricingRules()
  const [catalog, products] = await Promise.all([getCartCatalog(skus, account, rules), getProductsBySkus(skus)])
  const bySku = new Map(catalog.map((e) => [e.sku.toLowerCase(), e]))
  // server-side engine (products carry the floor); only the resulting numbers are rendered
  const productBySku = new Map(products.map((p) => [p.xpose_sku.toLowerCase(), p]))
  const opts = { wholesaleDiscountPercent: account.wholesaleDiscountPercent, accountApproved: true }

  return (
    <section className="bg-white rounded-xl border border-emerald-200" aria-labelledby="my-cp-h" data-testid="account-contract-prices">
      <div className="px-5 py-4 border-b border-emerald-100 bg-emerald-50/50 rounded-t-xl">
        <h2 id="my-cp-h" className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Handshake className="w-4 h-4 text-emerald-600" aria-hidden /> Your contract prices
        </h2>
        <p className="text-xs text-slate-600 mt-0.5">
          Prices agreed with MegaTarps for your account. They apply automatically when you order online, unless your normal volume price is lower.
        </p>
      </div>
      <ul className="divide-y divide-slate-100">
        {contracts.map((c) => {
          const e = bySku.get(c.sku.toLowerCase())
          const prod = productBySku.get(c.sku.toLowerCase())
          const normal = e && prod && !e.quote_only ? unitPriceCents(prod, c.min_quantity || 1, rules, opts) : null
          const savePct = normal && normal > c.unit_price_cents ? Math.round((1 - c.unit_price_cents / normal) * 1000) / 10 : null
          return (
            <li key={`${c.sku}-${c.min_quantity}`} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between" data-testid="account-contract-row">
              <div className="min-w-0">
                {e ? (
                  <Link href={`/product/${e.slug}`} className="text-sm font-semibold text-slate-900 hover:text-orange-600">{e.name}</Link>
                ) : (
                  <p className="text-sm font-semibold text-slate-900">{c.sku}</p>
                )}
                <p className="text-xs text-slate-500">
                  <span className="font-mono">{c.sku}</span>
                  {c.min_quantity > 1 && <> · for {c.min_quantity.toLocaleString('en-US')}+ units</>}
                  {' · '}
                  {c.valid_until ? <>valid through <b className="text-slate-700">{fmtDate(c.valid_until)}</b></> : 'no end date'}
                </p>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-right">
                  <p className="text-lg font-black text-emerald-700 tabular-nums">{formatPrice(c.unit_price_cents)}<span className="text-xs font-medium text-slate-400">/ea</span></p>
                  {savePct ? <p className="text-[11px] text-slate-500"><span className="line-through">{formatPrice(normal!)}</span> · save {savePct}%</p> : null}
                </div>
                {e && !e.quote_only && e.in_stock ? (
                  <ContractReorderButton item={cartItemFromEntry(e, Math.max(1, c.min_quantity || 1))} />
                ) : e && !e.quote_only ? (
                  <span className="text-xs font-semibold text-slate-500">Out of stock</span>
                ) : (
                  <Link href={`/bulk-quote?${new URLSearchParams({ sku: c.sku, name: e?.name ?? c.sku, qty: String(Math.max(1, c.min_quantity)) })}`}
                    className="inline-flex items-center gap-1.5 border border-orange-400 text-orange-600 hover:bg-orange-50 font-semibold text-sm px-3.5 py-2 rounded-lg whitespace-nowrap">
                    <FileText className="w-4 h-4" aria-hidden /> Request a quote
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <p className="px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
        Need more than these? <Link href="/quick-order" className="text-orange-600 font-semibold hover:underline">Quick Order</Link> shows your contract prices too.
      </p>
    </section>
  )
}
