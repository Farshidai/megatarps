import { createAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pricing Rules' }

export default async function AdminPricingRulesPage() {
  const supabase = await createAdminClient()

  const { data: rules } = await supabase
    .from('pricing_rules')
    .select('*')
    .order('priority', { ascending: false })
    .order('min_quantity')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Pricing Rules</h1>
          <p className="text-sm text-slate-500 mt-1">Applied to bulk quotes. Higher priority rules win when multiple match.</p>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-sm text-orange-800">
        <strong>How it works:</strong> When you quote a bulk order, these rules calculate suggested pricing.
        Rules are never auto-applied — you always review and send the final price manually.
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Tarp Type</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Mil</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Qty Range</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Margin %</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Discount from Retail</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Flat Markup</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Priority</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!rules?.length ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  No pricing rules yet. Add rules via Supabase dashboard or SQL.
                </td>
              </tr>
            ) : rules.map(r => (
              <tr key={r.id} className={`hover:bg-slate-50 ${!r.active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 text-xs text-slate-700">{r.tarp_type ?? 'All types'}</td>
                <td className="px-4 py-3 text-xs text-slate-700">{r.thickness_mil ? `${r.thickness_mil} mil` : 'Any'}</td>
                <td className="px-4 py-3 text-xs text-slate-700">
                  {r.min_quantity}–{r.max_quantity ?? '∞'}
                </td>
                <td className="px-4 py-3 text-xs font-bold text-green-700">
                  {r.margin_percent ? `${r.margin_percent}%` : '—'}
                </td>
                <td className="px-4 py-3 text-xs font-bold text-blue-700">
                  {r.discount_from_retail_percent ? `−${r.discount_from_retail_percent}%` : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {r.flat_markup_cents ? `+$${(r.flat_markup_cents / 100).toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{r.priority}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {r.active ? 'Active' : 'Off'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-slate-800 rounded-xl p-5 text-sm">
        <p className="text-slate-300 font-semibold mb-3">Example: Add a rule via Supabase SQL</p>
        <pre className="text-green-400 text-xs font-mono overflow-auto whitespace-pre-wrap">{`INSERT INTO pricing_rules
  (tarp_type, thickness_mil, min_quantity, max_quantity, discount_from_retail_percent, priority, active)
VALUES
  ('poly', NULL, 5, 24, 10, 1, true),   -- 5–24 units: 10% off retail
  ('poly', NULL, 25, 99, 20, 2, true),  -- 25–99 units: 20% off retail
  ('poly', NULL, 100, NULL, 30, 3, true); -- 100+ units: 30% off retail`}</pre>
      </div>
    </div>
  )
}
