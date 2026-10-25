import { notFound } from 'next/navigation'
import { CheckCircle2, Clock, XCircle, AlertTriangle, Package } from 'lucide-react'
import { getQuoteByToken, logViewOnce } from '@/lib/quotes/store'
import { netTermsFor, termsLabel } from '@/lib/quotes/auth'
import { DELIVERY_LABELS, STATUS_LABELS, STATUS_STYLES, effectiveStatus } from '@/lib/quotes/types'
import { formatPrice } from '@/lib/utils'
import { QuoteActions } from './QuoteActions'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params
  const q = await getQuoteByToken(token)
  return {
    title: q ? `Quote ${q.quote_number}` : 'Quote',
    robots: { index: false, follow: false },
    referrer: 'no-referrer', // keep the token out of Referer headers
  }
}

const fmtDate = (iso: string | null | undefined, style: 'long' | 'medium' = 'long') =>
  iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('en-US', { dateStyle: style }) : '—'

export default async function QuotePage({
  params, searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ paid?: string; canceled?: string; preview?: string }>
}) {
  const [{ token }, sp] = await Promise.all([params, searchParams])
  const q = await getQuoteByToken(token)
  if (!q) notFound()

  const status = effectiveStatus(q)
  const priced = status !== 'pending'
  if (!sp.preview && priced) await logViewOnce(q.id).catch(() => {})
  const net = status === 'quoted' ? await netTermsFor(q) : { allowed: false, terms: 'prepaid' }
  const addr = q.shipping_address
  const units = q.items.reduce((n, i) => n + i.quantity, 0)

  return (
    <div className="bg-slate-100 min-h-screen py-6 sm:py-10 print:bg-white print:p-0 print:min-h-0">
      <style>{`
        @media print {
          @page { size: letter; margin: 12mm; }
          body > *:not(main) { display: none !important; }
          html, body { background: #fff !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .quote-doc { box-shadow: none !important; border: 0 !important; border-radius: 0 !important; }
          .quote-doc tr { break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 print:max-w-none print:px-0">
        {/* status banners */}
        <div className="print:hidden space-y-3 mb-5">
          {sp.paid && (status === 'ordered' || status === 'accepted') && (
            <Banner tone="green" icon={<CheckCircle2 className="w-5 h-5" aria-hidden />} title="Payment received — thank you!">
              {status === 'ordered' ? 'Your order is confirmed. We’ll email tracking and the freight PRO number when it ships.' : 'We’re confirming your payment with Stripe. Your order confirmation will arrive by email shortly.'}
            </Banner>
          )}
          {sp.canceled && status === 'accepted' && (
            <Banner tone="amber" icon={<AlertTriangle className="w-5 h-5" aria-hidden />} title="Checkout was canceled">
              Nothing was charged. Your pricing still holds until {fmtDate(q.valid_until)}.
            </Banner>
          )}
          {status === 'pending' && (
            <Banner tone="amber" icon={<Clock className="w-5 h-5" aria-hidden />} title="We’re pricing your request">
              Our team is confirming stock and LTL freight to {q.delivery_zip ?? 'your ZIP'}. You’ll get an email at {q.guest_email} as soon as your quote is ready — usually within one business day.
            </Banner>
          )}
          {status === 'expired' && (
            <Banner tone="red" icon={<AlertTriangle className="w-5 h-5" aria-hidden />} title="This quote has expired">
              Pricing and freight were valid until {fmtDate(q.valid_until)}. Reply to your quote email or call (913) 313-2691 and we’ll refresh it.
            </Banner>
          )}
          {status === 'declined' && (
            <Banner tone="slate" icon={<XCircle className="w-5 h-5" aria-hidden />} title="You declined this quote">
              {q.declined_reason ? `Reason: “${q.declined_reason}”. ` : ''}Need a revised quote? Call (913) 313-2691.
            </Banner>
          )}
          {status === 'ordered' && !sp.paid && (
            <Banner tone="green" icon={<Package className="w-5 h-5" aria-hidden />} title="This quote is now an order">
              Accepted {fmtDate(q.accepted_at)}. We’ll email tracking when it ships.
            </Banner>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start print:block">
          {/* ---------- the printable document ---------- */}
          <article className="quote-doc bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-10 order-2 lg:order-1 print:p-0">
            <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-4 border-orange-500">
              <div>
                <div className="flex items-center mb-3" aria-label="MegaTarps">
                  <span className="bg-orange-500 text-white font-black text-2xl px-2.5 py-1 rounded-l-md leading-none">MEGA</span>
                  <span className="bg-slate-900 text-white font-black text-2xl px-2.5 py-1 rounded-r-md leading-none">TARPS</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mega Innovation Group LLC<br />Kansas City metro · Serving the Midwest<br />(913) 313-2691 · mfirooz@megatarps.com
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-3xl font-black tracking-tight text-slate-900">QUOTE</p>
                <dl className="mt-2 text-sm grid grid-cols-[auto_auto] sm:justify-end gap-x-4 gap-y-0.5">
                  <dt className="text-slate-500">Quote #</dt><dd className="font-mono font-bold text-slate-900">{q.quote_number}</dd>
                  <dt className="text-slate-500">Date</dt><dd>{fmtDate(q.sent_at ?? q.created_at, 'medium')}</dd>
                  {priced && <><dt className="text-slate-500">Valid until</dt><dd className={status === 'expired' ? 'text-red-600 font-semibold' : 'font-semibold'}>{fmtDate(q.valid_until, 'medium')}</dd></>}
                  <dt className="text-slate-500 print:hidden">Status</dt>
                  <dd className="print:hidden"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span></dd>
                </dl>
              </div>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 text-sm">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Prepared for</h2>
                <p className="font-semibold text-slate-900">{q.guest_name}</p>
                {q.guest_company && <p className="text-slate-700">{q.guest_company}</p>}
                {q.guest_email && <p className="text-slate-600">{q.guest_email}</p>}
                {q.guest_phone && <p className="text-slate-600">{q.guest_phone}</p>}
              </div>
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Ship to</h2>
                {addr?.line1 ? (
                  <p className="text-slate-700">
                    {addr.name && <>{addr.name}<br /></>}
                    {addr.company && addr.company !== q.guest_company && <>{addr.company}<br /></>}
                    {addr.line1}<br />{addr.city}{addr.city ? ', ' : ''}{addr.state} {addr.zip}
                  </p>
                ) : (
                  <p className="text-slate-700">ZIP {q.delivery_zip ?? '—'} <span className="text-slate-400">(full address confirmed before shipping)</span></p>
                )}
                <p className="text-slate-600 mt-1">
                  LTL truck · {q.delivery_type ? DELIVERY_LABELS[q.delivery_type].label : 'Delivery type TBD'}
                  {q.needed_by && <> · needed by {fmtDate(q.needed_by, 'medium')}</>}
                </p>
              </div>
            </section>

            {q.customer_message && priced && (
              <section className="mb-6 bg-orange-50/60 border-l-4 border-orange-400 rounded-r-lg px-4 py-3 text-sm text-slate-700 whitespace-pre-line print:bg-transparent">
                {q.customer_message}
              </section>
            )}

            <div className="overflow-x-auto -mx-5 sm:mx-0">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="border-y border-slate-200 bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 print:bg-slate-100">
                    <th className="py-2.5 pl-5 sm:pl-3 pr-2 font-semibold w-8">#</th>
                    <th className="py-2.5 px-2 font-semibold">Item</th>
                    <th className="py-2.5 px-2 font-semibold text-right">Qty</th>
                    <th className="py-2.5 px-2 font-semibold text-right">Unit price</th>
                    <th className="py-2.5 pl-2 pr-5 sm:pr-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {q.items.map((i, n) => (
                    <tr key={n}>
                      <td className="py-3 pl-5 sm:pl-3 pr-2 text-slate-400 align-top">{n + 1}</td>
                      <td className="py-3 px-2 align-top">
                        <p className="font-medium text-slate-900">{i.name || i.sku}</p>
                        {i.sku && <p className="text-xs font-mono text-slate-500">{i.sku}</p>}
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums align-top">{i.quantity.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right tabular-nums align-top">{priced ? formatPrice(i.unit_price_cents) : <span className="text-slate-400">—</span>}</td>
                      <td className="py-3 pl-2 pr-5 sm:pr-3 text-right tabular-nums font-semibold align-top">{priced ? formatPrice(i.unit_price_cents * i.quantity) : <span className="text-slate-400 font-normal">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {priced ? (
              <dl className="mt-4 ml-auto w-full sm:w-80 text-sm space-y-1.5">
                <Row label={`Subtotal (${units.toLocaleString()} units)`} value={formatPrice(q.subtotal_cents ?? 0)} />
                <Row label={`LTL freight${q.delivery_zip ? ` to ${q.delivery_zip}` : ''}`} value={q.freight_cents ? formatPrice(q.freight_cents) : 'Included'} />
                {q.tax_cents > 0 && <Row label="Sales tax" value={formatPrice(q.tax_cents)} />}
                {q.discount_cents > 0 && <Row label="Discount" value={`−${formatPrice(q.discount_cents)}`} className="text-emerald-700" />}
                <div className="flex justify-between items-baseline border-t-2 border-slate-900 pt-2 mt-2">
                  <dt className="font-black text-slate-900">Total (USD)</dt>
                  <dd className="text-2xl font-black text-slate-900 tabular-nums">{formatPrice(q.total_cents ?? 0)}</dd>
                </div>
                {q.tax_cents === 0 && <p className="text-[11px] text-slate-400 text-right">Sales tax, if applicable, not included.</p>}
              </dl>
            ) : (
              <p className="mt-6 text-sm text-slate-500 bg-slate-50 rounded-lg p-4">Pricing and freight will appear here once our team sends your quote.</p>
            )}

            <section className="mt-8 pt-5 border-t border-slate-200 text-xs text-slate-500 leading-relaxed">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Terms</h2>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Prices are in US dollars and valid until the date shown, subject to stock at time of acceptance.</li>
                <li>Freight is LTL truck to the delivery type shown. Liftgate, residential and limited-access deliveries must be requested before shipment; reclassification fees from the carrier are billed at cost.</li>
                <li>Inspect pallets on arrival and note any damage on the carrier’s bill of lading before signing.</li>
                <li>Payment by card at acceptance, or on Net terms for approved wholesale accounts. Orders typically ship within 2 business days of payment or approval.</li>
                <li>Unused, unopened product may be returned within 30 days; freight is non-refundable. Custom and pallet orders are final sale unless defective.</li>
              </ol>
              <p className="mt-4 text-slate-400">Questions about this quote? Call (913) 313-2691 or reply to your quote email and reference {q.quote_number}.</p>
            </section>
          </article>

          {/* ---------- actions ---------- */}
          <aside className="order-1 lg:order-2 lg:sticky lg:top-28 print:hidden">
            <QuoteActions
              token={token}
              status={status}
              totalCents={q.total_cents ?? 0}
              validUntil={q.valid_until}
              netTerms={net.allowed ? termsLabel(net.terms) : null}
              paid={!!sp.paid}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex justify-between gap-4 ${className}`}>
      <dt className="text-slate-600">{label}</dt>
      <dd className="tabular-nums font-medium">{value}</dd>
    </div>
  )
}

function Banner({ tone, icon, title, children }: { tone: 'green' | 'amber' | 'red' | 'slate'; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const tones = {
    green: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    slate: 'bg-white border-slate-200 text-slate-800',
  }
  return (
    <div role="status" className={`flex gap-3 border rounded-xl px-4 py-3 ${tones[tone]}`}>
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="font-bold text-sm">{title}</p>
        <p className="text-sm opacity-90">{children}</p>
      </div>
    </div>
  )
}
