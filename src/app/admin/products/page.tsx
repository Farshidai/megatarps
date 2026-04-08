import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { Package } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Products' }

export default async function AdminProductsPage() {
  const supabase = await createAdminClient()

  const { data: products } = await supabase
    .from('products')
    .select('*, product_line:product_lines(name)')
    .order('tarp_type')
    .order('thickness_mil')
    .order('width_ft')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900">Products</h1>
        <span className="text-sm text-slate-500">{products?.length ?? 0} total</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Image</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Product</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">SKU</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Dims</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Retail</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Cost</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Stock</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!products?.length ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  No products. Run the seed SQL to import your catalog.
                </td>
              </tr>
            ) : products.map(p => {
              const image = (p.image_urls as string[])?.[0]
              const pl = p.product_line as { name: string } | null
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={image} alt={p.name} className="w-full h-full object-cover" />
                        : <Package className="w-5 h-5 text-slate-300" />}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <a href={`/product/${p.slug}`} target="_blank"
                      className="font-semibold text-slate-900 hover:text-orange-600 text-xs leading-snug line-clamp-2 block max-w-48">
                      {p.name}
                    </a>
                    {pl?.name && <p className="text-xs text-slate-400">{pl.name}</p>}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-600">{p.xpose_sku}</td>
                  <td className="px-4 py-2 text-xs text-slate-600">{p.width_ft}×{p.length_ft} ft</td>
                  <td className="px-4 py-2 font-bold text-slate-900">
                    {p.retail_price_cents > 0 ? formatPrice(p.retail_price_cents) : '—'}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {p.cost_price_cents ? formatPrice(p.cost_price_cents) : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {p.in_stock ? 'In Stock' : 'Out'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.active ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-500'}`}>
                      {p.active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
