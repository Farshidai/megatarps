import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Building2, Mail, Phone, Truck, CalendarDays, MapPin, MessageSquare, Bot } from 'lucide-react'
import { requireAdmin } from '@/lib/admin'
import { getAdminNotes, getContractorDiscountPercent, isContractorApproved, getQuoteById, listEvents } from '@/lib/quotes/store'
import { getPickerCatalog } from '@/lib/quotes/catalog'
import { getAppUrl } from '@/lib/quotes/emails'
import { isContractActive, type ContractPrice } from '@/lib/pricing'
import { adminListContractPrices } from '@/lib/contract-prices'
import { CONTRACT_SAVE_STATUSES, defaultValidUntil } from '@/lib/contract-prices-input'
import { suggestedUnitPrice } from '@/lib/quotes/suggest'
import { DELIVERY_LABELS, STATUS_LABELS, STATUS_STYLES, effectiveStatus, nowMs } from '@/lib/quotes/types'
import { QuoteBuilder, type BuilderLine } from './QuoteBuilder'
import { CopyLink } from './CopyLink'
import { SaveContractPrices, type ContractLine } from './SaveContractPrices'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Quote builder' }
export const dynamic = 'force-dynamic'

const EVENT_LABEL: Record<string, string> = {
  created: 'Request received', sent: 'Quote sent', viewed: 'Customer viewed', accepted: 'Accepted', declined: 'Declined', paid: 'Paid',
}

export default async function AdminQuoteDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const quote = await getQuoteById(id)
  if (!quote) notFound()

  const [events, notes, catalog, wholesalePct, appUrl, accountApproved, contractRows] = await Promise.all([
    listEvents(quote.id),
    getAdminNotes(quote.id),
    getPickerCatalog(),
    getContractorDiscountPercent(quote.contractor_id),
    getAppUrl(),
    isContractorApproved(quote.contractor_id),
    quote.contractor_id ? adminListContractPrices(quote.contractor_id) : Promise.resolve([]),
  ])
  // the client's active contract prices feed the suggestions (approved accounts only)
  const contractPrices: ContractPrice[] = contractRows
    .filter((r) => isContractActive(r))
    .map(({ product_id, sku, unit_price_cents, min_quantity, valid_until }) => ({ product_id, sku, unit_price_cents, min_quantity, valid_until }))
  const priceOpts = { wholesaleDiscountPercent: wholesalePct, accountApproved, contractPrices }
  const byId = new Map(catalog.raw.map((p) => [p.id, p]))
  const bySku = new Map(catalog.raw.map((p) => [p.xpose_sku.toLowerCase(), p]))
  const costs: Record<string, number> = {}
  for (const p of catalog.raw) if (p.cost_price_cents) costs[p.id] = p.cost_price_cents

  const lines: BuilderLine[] = quote.items.map((it, i) => {
    const p = (it.product_id && byId.get(it.product_id)) || (it.sku ? bySku.get(it.sku.toLowerCase()) : undefined)
    const suggested = p ? suggestedUnitPrice(p, it.quantity, catalog.rules, priceOpts).cents : 0
    return {
      key: `${i}-${it.sku}`,
      product_id: p?.id ?? it.product_id ?? null,
      sku: p?.xpose_sku ?? it.sku,
      name: p?.name ?? it.name,
      quantity: it.quantity,
      unit_price_cents: it.unit_price_cents > 0 ? it.unit_price_cents : suggested,
      quote_only: p ? p.retail_price_cents <= 0 : true,
    }
  })

  const status = effectiveStatus(quote)
  const contractLines: ContractLine[] = quote.items.map((it, index) => {
    const p = (it.product_id && byId.get(it.product_id)) || (it.sku ? bySku.get(it.sku.toLowerCase()) : undefined)
    return { index, sku: p?.xpose_sku ?? it.sku, name: p?.name ?? it.name, quantity: it.quantity, unit_price_cents: it.unit_price_cents, catalog: !!p }
  })
  const defaultValid = new Date(nowMs() + 14 * 86400_000).toISOString().slice(0, 10)
  const customerUrl = `${appUrl}/quote/${quote.public_token}`
  const addr = quote.shipping_address

  return (
    <div className="p-4 sm:p-8 max-w-7xl">
      <Link href="/admin/rfqs" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-orange-600 mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden /> All quotes
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-black text-slate-900 font-mono">{quote.quote_number}</h1>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ring-1 ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
        {quote.ai_recommended && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded-full"><Bot className="w-3 h-3" aria-hidden /> From AI chat</span>
        )}
        <span className="text-sm text-slate-500">Received {new Date(quote.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <QuoteBuilder
            quoteId={quote.id}
            status={status}
            products={catalog.products}
            rules={catalog.rules}
            wholesalePct={wholesalePct}
            accountApproved={accountApproved}
            contractPrices={contractPrices}
            costs={costs}
            initial={{
              lines,
              freight_cents: quote.freight_cents ?? 0,
              tax_cents: quote.tax_cents ?? 0,
              discount_cents: quote.discount_cents ?? 0,
              valid_until: quote.valid_until && status !== 'expired' ? quote.valid_until.slice(0, 10) : defaultValid,
              customer_message: quote.customer_message ?? '',
              admin_notes: notes,
            }}
            customerEmail={quote.guest_email}
            sentAt={quote.sent_at}
          />
        </div>

        <aside className="space-y-4">
          <SaveContractPrices
            quoteId={quote.id}
            quoteNumber={quote.quote_number}
            contractorId={quote.contractor_id}
            eligible={(CONTRACT_SAVE_STATUSES as readonly string[]).includes(status)}
            statusLabel={STATUS_LABELS[status]}
            lines={contractLines}
            defaultValidUntil={defaultValidUntil(nowMs())}
            existingCount={contractRows.length}
          />
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Customer</h2>
            <p className="font-bold text-slate-900">{quote.guest_name}</p>
            {quote.guest_company && <p className="text-sm text-slate-600 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-400" aria-hidden />{quote.guest_company}</p>}
            {quote.guest_email && <a href={`mailto:${quote.guest_email}?subject=Quote ${quote.quote_number}`} className="text-sm text-orange-600 hover:underline flex items-center gap-1.5 mt-1"><Mail className="w-3.5 h-3.5" aria-hidden />{quote.guest_email}</a>}
            {quote.guest_phone && <a href={`tel:${quote.guest_phone}`} className="text-sm text-slate-600 flex items-center gap-1.5 mt-1"><Phone className="w-3.5 h-3.5 text-slate-400" aria-hidden />{quote.guest_phone}</a>}
            <p className="text-xs mt-2 text-slate-500">
              {quote.contractor_id ? <>Wholesale account{wholesalePct ? <> · <b className="text-emerald-700">{wholesalePct}% account discount</b> applied to suggestions</> : ''}</> : 'Guest (no account)'}
            </p>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5 text-sm space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Delivery</h2>
            <p className="flex items-center gap-2"><Truck className="w-4 h-4 text-slate-400" aria-hidden />{quote.delivery_type ? DELIVERY_LABELS[quote.delivery_type].label : 'Not specified'} · ZIP <b>{quote.delivery_zip ?? '—'}</b></p>
            {quote.needed_by && <p className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-slate-400" aria-hidden />Needed by <b>{new Date(quote.needed_by + 'T12:00:00').toLocaleDateString('en-US', { dateStyle: 'medium' })}</b></p>}
            {addr?.line1 && (
              <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-slate-400 mt-0.5" aria-hidden />
                <span>{addr.name}{addr.company ? `, ${addr.company}` : ''}<br />{addr.line1}<br />{addr.city}, {addr.state} {addr.zip}</span>
              </p>
            )}
            {quote.project_location && <p className="text-slate-500">Jobsite: {quote.project_location}{quote.project_type ? ` · ${quote.project_type}` : ''}</p>}
            {quote.timeline && <p className="text-slate-500">Timeline: {quote.timeline}</p>}
            {quote.special_requirements && (
              <p className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-slate-700 flex gap-2"><MessageSquare className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" aria-hidden />{quote.special_requirements}</p>
            )}
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Customer link</h2>
            <CopyLink url={customerUrl} />
            {quote.declined_reason && <p className="text-sm mt-3 text-slate-600"><b>Decline reason:</b> {quote.declined_reason}</p>}
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Activity</h2>
            {!events.length ? (
              <p className="text-sm text-slate-400">No activity yet.</p>
            ) : (
              <ol className="relative border-l border-slate-200 ml-1.5 space-y-3">
                {events.map((e) => (
                  <li key={e.id} className="ml-4">
                    <span className={`absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full ${e.type === 'paid' || e.type === 'accepted' ? 'bg-emerald-500' : e.type === 'declined' ? 'bg-red-400' : e.type === 'sent' ? 'bg-blue-500' : 'bg-slate-300'}`} aria-hidden />
                    <p className="text-sm font-semibold text-slate-800">{EVENT_LABEL[e.type] ?? e.type}</p>
                    <p className="text-xs text-slate-400">{new Date(e.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    {e.note && <p className="text-xs text-slate-600 mt-0.5">{e.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
