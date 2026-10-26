import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, ExternalLink, FileText, BadgeCheck, XCircle, AlertTriangle, Info } from 'lucide-react'
import { requireAdmin } from '@/lib/admin'
import { PAYMENT_TERMS, US_STATES, formatCents, paymentTermsLabel } from '@/lib/wholesale'
import { getApplication, certificateSignedUrl } from '../data'
import { approveAccount, rejectAccount } from '../actions'
import { StatusBadge } from '../StatusBadge'
import { adminListContractPrices, adminProductsByIdsOrSkus, adminQuoteNumbers } from '@/lib/contract-prices'
import { defaultValidUntil } from '@/lib/contract-prices-input'
import { getPricingRules } from '@/lib/products'
import { isContractActive, isQuoteOnly, unitPriceCents } from '@/lib/pricing'
import { ContractPricesManager, type ContractTableRow } from './ContractPricesManager'

export const metadata: Metadata = { title: 'Wholesale Application' }

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—')
const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400'

export default async function AdminAccountDetailPage(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await props.params
  const admin = await requireAdmin(`/admin/accounts/${id}`)
  const sp = await props.searchParams
  const a = await getApplication(id)
  if (!a) notFound()
  const certUrl = await certificateSignedUrl(a.resale_certificate_path)
  const contractTable = await loadContractTable(a.id)

  const saved = typeof sp.saved === 'string' ? sp.saved : ''
  const demoAction = typeof sp.demo === 'string' ? sp.demo : ''
  const error = typeof sp.error === 'string' ? sp.error : ''
  const stateName = US_STATES.find(([c]) => c === a.resale_cert_state)?.[1]
  const isApproved = a.account_status === 'approved'

  const details: [string, React.ReactNode][] = [
    ['Contact', a.contact_name],
    ['Email', <a key="e" href={`mailto:${a.email}`} className="text-orange-600 hover:underline break-all">{a.email}</a>],
    ['Phone', a.phone ? <a key="p" href={`tel:${a.phone}`} className="hover:underline">{a.phone}</a> : '—'],
    ['Business type', a.business_type ?? '—'],
    ['Years in business', a.years_in_business ?? '—'],
    ['Service area', a.service_area ?? '—'],
    ['Est. monthly spend', a.est_monthly_volume ?? '—'],
    ['Website', a.website ? <a key="w" href={a.website} target="_blank" rel="noopener noreferrer nofollow" className="text-orange-600 hover:underline inline-flex items-center gap-1 break-all">{a.website.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3" aria-hidden /></a> : '—'],
    ['Resale / exemption #', a.tax_id ?? '—'],
    ['Applied', fmt(a.created_at)],
  ]

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <Link href="/admin/accounts" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-orange-600 mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden /> All applications
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-black text-slate-900">{a.company_name}</h1>
        <StatusBadge status={a.account_status} />
      </div>

      {saved && (
        <p role="status" className="mb-5 flex items-center gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <BadgeCheck className="w-4 h-4" aria-hidden /> Account {saved}. The applicant has been emailed.
        </p>
      )}
      {demoAction && (
        <p role="status" className="mb-5 flex items-center gap-2 text-sm text-sky-800 bg-sky-50 border border-sky-200 rounded-lg px-4 py-3">
          <Info className="w-4 h-4" aria-hidden /> Demo mode: the account would be {demoAction} and the applicant emailed. Nothing was saved.
        </p>
      )}
      {error && (
        <p role="alert" className="mb-5 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4" aria-hidden /> {error}
        </p>
      )}

      <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 items-start">
        {/* Application */}
        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6" aria-labelledby="app-h">
            <h2 id="app-h" className="font-bold text-slate-900 mb-4">Application</h2>
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {details.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="font-medium text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6" aria-labelledby="cert-h">
            <h2 id="cert-h" className="font-bold text-slate-900 mb-3">Resale / tax-exempt certificate</h2>
            {a.resale_certificate_path ? (
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center"><FileText className="w-5 h-5 text-slate-500" aria-hidden /></div>
                <div className="flex-1 min-w-0 text-sm">
                  <p className="font-semibold text-slate-900 truncate">{a.resale_certificate_path.split('/').pop()}</p>
                  <p className="text-slate-500">Issuing state: {stateName ?? a.resale_cert_state ?? '—'}</p>
                </div>
                {certUrl ? (
                  <a href={certUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 border border-slate-300 hover:border-orange-400 hover:text-orange-600 text-slate-700 font-semibold text-sm px-4 py-2 rounded-lg">
                    View certificate <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">{admin.demo ? 'Preview unavailable in demo mode' : 'Could not create a viewing link'}</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No certificate uploaded. Don&apos;t enable tax-exempt purchasing without one.</p>
            )}
            {certUrl && <p className="text-xs text-slate-400 mt-3">Viewing link expires in 5 minutes. Reload the page for a new one.</p>}
          </section>

          {(a.approved_by || a.rejection_reason) && (
            <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 text-sm" aria-labelledby="hist-h">
              <h2 id="hist-h" className="font-bold text-slate-900 mb-3">Decision</h2>
              {isApproved ? (
                <p className="text-slate-700">
                  Approved {fmt(a.approved_at)} by {a.approved_by}: {Number(a.wholesale_discount_percent)}% discount,{' '}
                  {paymentTermsLabel(a.payment_terms)}, credit limit {formatCents(a.credit_limit_cents)}, tax exempt {a.tax_exempt ? 'yes' : 'no'}.
                </p>
              ) : (
                <p className="text-slate-700">Rejected by {a.approved_by ?? '—'}{a.rejection_reason ? `: “${a.rejection_reason}”` : ''}</p>
              )}
            </section>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-6 lg:sticky lg:top-28">
          <section className="bg-white rounded-xl border-2 border-emerald-200 p-5 sm:p-6" aria-labelledby="approve-h">
            <h2 id="approve-h" className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-emerald-600" aria-hidden /> {isApproved ? 'Update terms' : 'Approve'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">Extra discount for items WITHOUT pallet pricing only (it never stacks on pallet tiers or contract prices; the cost floor still applies).</p>
            <form action={approveAccount} className="space-y-4">
              <input type="hidden" name="id" value={a.id} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ap-discount" className="block text-xs font-semibold text-slate-600 mb-1">Discount %</label>
                  <input id="ap-discount" name="wholesale_discount_percent" type="number" min={0} max={50} step={0.5}
                    defaultValue={isApproved ? Number(a.wholesale_discount_percent) : 0} required className={inputCls} />
                </div>
                <div>
                  <label htmlFor="ap-terms" className="block text-xs font-semibold text-slate-600 mb-1">Payment terms</label>
                  <select id="ap-terms" name="payment_terms" defaultValue={a.payment_terms ?? 'prepaid'} className={inputCls}>
                    {PAYMENT_TERMS.map((t) => <option key={t.value} value={t.value}>{t.label.replace(/ \(.*\)/, '')}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="ap-credit" className="block text-xs font-semibold text-slate-600 mb-1">Credit limit ($)</label>
                <input id="ap-credit" name="credit_limit" inputMode="decimal" placeholder="Required for net terms"
                  defaultValue={a.credit_limit_cents != null ? String(a.credit_limit_cents / 100) : ''} className={inputCls} />
              </div>
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input type="checkbox" name="tax_exempt" defaultChecked={a.tax_exempt} className="mt-0.5 w-4 h-4 accent-orange-500" />
                <span>Tax exempt{!a.resale_certificate_path && <span className="block text-xs text-amber-700">No certificate on file</span>}</span>
              </label>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2.5 rounded-lg transition-colors">
                {isApproved ? 'Save terms & email applicant' : 'Approve & email applicant'}
              </button>
            </form>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6" aria-labelledby="reject-h">
            <h2 id="reject-h" className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" aria-hidden /> {a.account_status === 'rejected' ? 'Update rejection' : isApproved ? 'Revoke account' : 'Reject'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">The applicant sees this reason and can re-apply.</p>
            <form action={rejectAccount} className="space-y-3">
              <input type="hidden" name="id" value={a.id} />
              <label htmlFor="rj-reason" className="sr-only">Reason</label>
              <textarea id="rj-reason" name="rejection_reason" rows={3} required minLength={5} maxLength={1000}
                defaultValue={a.rejection_reason ?? ''} placeholder="e.g. We couldn't verify your resale certificate."
                className={inputCls} />
              <button type="submit" className="w-full border-2 border-red-200 text-red-700 hover:bg-red-50 font-bold text-sm py-2.5 rounded-lg transition-colors">
                {isApproved ? 'Revoke & email applicant' : 'Reject & email applicant'}
              </button>
            </form>
          </section>
        </div>
      </div>

      <div className="mt-6">
        <ContractPricesManager contractorId={a.id} rows={contractTable} defaultValidUntil={defaultValidUntil()} approved={isApproved} />
      </div>
    </div>
  )
}

/** Contract rows joined with product (incl. cost, admin only), guest price and source quote number. */
async function loadContractTable(contractorId: string): Promise<ContractTableRow[]> {
  const rows = await adminListContractPrices(contractorId)
  if (!rows.length) return []
  const [products, rules, quoteNumbers] = await Promise.all([
    adminProductsByIdsOrSkus({ ids: rows.map((r) => r.product_id ?? '') }),
    getPricingRules(),
    adminQuoteNumbers(rows.map((r) => r.source_quote_id ?? '')),
  ])
  const byId = new Map(products.map((p) => [p.id, p]))
  return rows.map((r) => {
    const p = r.product_id ? byId.get(r.product_id) : undefined
    const quoteOnly = p ? isQuoteOnly(p) : false
    return {
      id: r.id,
      sku: r.sku,
      product_name: p?.name ?? null,
      product_slug: p?.active ? p.slug : null,
      unit_price_cents: r.unit_price_cents,
      // what a guest pays for min_quantity units today (no account, no contract)
      guest_price_cents: p && !quoteOnly ? unitPriceCents(p, r.min_quantity || 1, rules) : null,
      cost_price_cents: p?.cost_price_cents || null,
      min_quantity: r.min_quantity,
      valid_until: r.valid_until,
      expired: !isContractActive(r),
      quote_only: quoteOnly,
      source_quote_id: r.source_quote_id ?? null,
      source_quote_number: r.source_quote_id ? quoteNumbers[r.source_quote_id] ?? null : null,
      note: r.note,
    }
  })
}
