import type { Metadata } from 'next'
import { connection } from 'next/server'
import { ShieldAlert } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { demoProducts } from '@/lib/demo'
import { checkAdmin } from './_lib/admin-auth'
import { PriceEditor, type EditorRow } from './PriceEditor'

export const metadata: Metadata = { title: 'Products & Prices' }

export default async function AdminProductsPage() {
  await connection() // always render per request: admin data must be fresh
  const auth = await checkAdmin()
  if (!auth.ok) {
    return (
      <div className="p-8 max-w-lg">
        <div className="flex items-start gap-3 bg-white ring-1 ring-red-200 rounded-xl p-5">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden />
          <div>
            <h1 className="font-bold text-slate-900">Admin access required</h1>
            <p className="text-sm text-slate-600 mt-1">{auth.reason}</p>
            <a href="/account/login?redirect=/admin/products" className="inline-block mt-3 text-sm font-semibold text-orange-600 hover:underline">Sign in →</a>
          </div>
        </div>
      </div>
    )
  }

  let rows: EditorRow[] = []
  let loadError: string | null = null
  if (auth.demo) {
    rows = demoProducts.map(toRow)
  } else {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('products')
      .select('xpose_sku, name, slug, tarp_type, thickness_mil, width_ft, length_ft, retail_price_cents, cost_price_cents, in_stock, active, image_urls, product_line:product_lines(name)')
      .order('tarp_type')
      .order('thickness_mil', { nullsFirst: false })
      .order('width_ft')
      .order('length_ft')
    if (error) loadError = error.message
    rows = (data ?? []).map((p) => toRow(p as unknown as Parameters<typeof toRow>[0]))
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="text-2xl font-black text-slate-900">Products &amp; prices</h1>
        <p className="text-sm text-slate-500 mt-1">
          Edit cost and retail inline, or round-trip a CSV (<code className="text-xs bg-slate-100 px-1 rounded">sku,cost,retail,in_stock</code>).
          Retail $0 = quote-only (can&apos;t be bought online). Volume tiers come from <a href="/admin/pricing-rules" className="text-orange-600 font-semibold hover:underline">Pricing Rules</a>.
        </p>
      </div>
      {auth.demo && (
        <div role="status" className="mb-5 rounded-xl bg-amber-50 ring-1 ring-amber-300 px-4 py-3 text-sm text-amber-900">
          <strong>Demo mode — changes are not saved.</strong> No database is connected, so this shows the demo catalog.
          You can try edits, markups and CSV import; Save will validate them but nothing is written.
        </div>
      )}
      {loadError && (
        <div role="alert" className="mb-5 rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-800">
          Couldn&apos;t load products: {loadError}
        </div>
      )}
      <PriceEditor initialRows={rows} demo={auth.demo} />
    </div>
  )
}

function toRow(p: {
  xpose_sku: string; name: string; slug: string; tarp_type: string; thickness_mil: number | null; width_ft: number; length_ft: number
  retail_price_cents: number; cost_price_cents?: number | null; in_stock: boolean; active: boolean; image_urls?: string[] | null
  product_line?: { name: string } | null
}): EditorRow {
  return {
    sku: p.xpose_sku,
    name: p.name,
    slug: p.slug,
    type: p.tarp_type,
    mil: p.thickness_mil,
    line: p.product_line?.name ?? null,
    cost_cents: p.cost_price_cents ?? 0,
    retail_cents: p.retail_price_cents ?? 0,
    in_stock: p.in_stock,
    active: p.active,
    has_image: Array.isArray(p.image_urls) && p.image_urls.length > 0,
  }
}
