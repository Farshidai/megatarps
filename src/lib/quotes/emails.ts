// Quote email templates (HTML-escaped) + small server helpers.
import { headers } from 'next/headers'
import { formatPrice } from '@/lib/utils'
import { adminEmails } from '@/lib/admin'
import { sendEmail } from '@/lib/email/send'
import { DELIVERY_LABELS, customerName, type QuoteRecord } from './types'

export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export async function getAppUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL
  if (env && !env.includes('placeholder')) return env.replace(/\/$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export function quoteAdminRecipients(): string[] {
  const list = adminEmails()
  return list.length ? list : ['mfirooz@megatarps.com']
}

const shell = (body: string) => `
<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a">
  <div style="padding:16px 0;border-bottom:3px solid #f97316">
    <span style="background:#f97316;color:#fff;font-weight:900;padding:4px 8px;border-radius:4px 0 0 4px">MEGA</span><span style="background:#0f172a;color:#fff;font-weight:900;padding:4px 8px;border-radius:0 4px 4px 0">TARPS</span>
  </div>
  <div style="padding:20px 0;font-size:15px;line-height:1.55">${body}</div>
  <div style="border-top:1px solid #e2e8f0;padding-top:12px;font-size:12px;color:#64748b">
    MegaTarps · Mega Innovation Group LLC · Kansas City metro · (913) 313-2691
  </div>
</div>`

const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${esc(href)}" style="background:#f97316;color:#fff;font-weight:700;padding:12px 22px;border-radius:8px;text-decoration:none;display:inline-block">${esc(label)}</a></p>`

function itemsTable(q: QuoteRecord, withPrices: boolean) {
  const rows = q.items
    .map(
      (i) => `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9">${esc(i.quantity)} ×</td>
        <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9">${esc(i.name || i.sku)}${i.sku ? `<br><span style="color:#64748b;font-size:12px">${esc(i.sku)}</span>` : ''}</td>
        ${withPrices ? `<td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;text-align:right">${formatPrice(i.unit_price_cents * i.quantity)}</td>` : ''}
      </tr>`,
    )
    .join('')
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>`
}

export async function emailNewRequest(q: QuoteRecord) {
  const app = await getAppUrl()
  const who = customerName(q)
  const delivery = q.delivery_type ? DELIVERY_LABELS[q.delivery_type].label : '—'
  await Promise.all([
    sendEmail({
      to: quoteAdminRecipients(),
      subject: `New quote request ${q.quote_number} — ${who}${q.guest_company ? ` (${q.guest_company})` : ''}`,
      html: shell(`
        <h2 style="margin:0 0 8px">New quote request ${esc(q.quote_number)}</h2>
        <p><b>${esc(q.guest_name)}</b>${q.guest_company ? `, ${esc(q.guest_company)}` : ''}<br>
        <a href="mailto:${esc(q.guest_email)}">${esc(q.guest_email)}</a>${q.guest_phone ? ` · ${esc(q.guest_phone)}` : ''}</p>
        <p>Delivery: <b>${esc(delivery)}</b> to ZIP <b>${esc(q.delivery_zip)}</b>${q.needed_by ? ` · needed by <b>${esc(q.needed_by)}</b>` : ''}</p>
        ${itemsTable(q, false)}
        ${q.special_requirements ? `<p style="background:#fff7ed;padding:10px;border-radius:6px"><b>Notes:</b> ${esc(q.special_requirements)}</p>` : ''}
        ${button(`${app}/admin/rfqs/${q.id}`, 'Price this quote →')}`),
    }),
    q.guest_email
      ? sendEmail({
          to: q.guest_email,
          subject: `We received your quote request ${q.quote_number}`,
          html: shell(`
            <h2 style="margin:0 0 8px">Thanks, ${esc(q.guest_name?.split(' ')[0] || 'there')} — we're on it.</h2>
            <p>Your request <b>${esc(q.quote_number)}</b> is with our team. You'll get a priced quote, including LTL freight to ${esc(q.delivery_zip || 'your ZIP')}, within <b>4 business hours</b> (Mon–Fri).</p>
            ${itemsTable(q, false)}
            ${button(`${app}/quote/${q.public_token}`, 'Track your request')}
            <p style="color:#64748b;font-size:13px">Questions? Reply to this email or call (913) 313-2691.</p>`),
        })
      : Promise.resolve(),
  ])
}

export async function emailQuoteSent(q: QuoteRecord) {
  if (!q.guest_email) return
  const app = await getAppUrl()
  await sendEmail({
    to: q.guest_email,
    subject: `Your MegaTarps quote ${q.quote_number} — ${formatPrice(q.total_cents ?? 0)}`,
    html: shell(`
      <h2 style="margin:0 0 8px">Your quote is ready</h2>
      <p>Hi ${esc(q.guest_name?.split(' ')[0] || 'there')},</p>
      ${q.customer_message ? `<p style="white-space:pre-line">${esc(q.customer_message)}</p>` : ''}
      ${itemsTable(q, true)}
      <p style="text-align:right;font-size:14px;margin:8px 0 0">Freight: ${formatPrice(q.freight_cents)}${q.discount_cents ? ` · Discount: −${formatPrice(q.discount_cents)}` : ''}${q.tax_cents ? ` · Tax: ${formatPrice(q.tax_cents)}` : ''}</p>
      <p style="text-align:right;font-size:20px;font-weight:900;margin:4px 0">Total ${formatPrice(q.total_cents ?? 0)}</p>
      ${q.valid_until ? `<p style="color:#64748b;font-size:13px">Valid until ${esc(new Date(q.valid_until).toLocaleDateString('en-US', { dateStyle: 'long' }))}.</p>` : ''}
      ${button(`${app}/quote/${q.public_token}`, 'Review & accept quote →')}`),
  })
}

export async function emailAdminStatus(q: QuoteRecord, headline: string, detail = '') {
  const app = await getAppUrl()
  await sendEmail({
    to: quoteAdminRecipients(),
    subject: `${q.quote_number}: ${headline}`,
    html: shell(`<h2 style="margin:0 0 8px">${esc(headline)}</h2>
      <p>${esc(customerName(q))}${q.guest_company ? `, ${esc(q.guest_company)}` : ''} — ${formatPrice(q.total_cents ?? 0)}</p>
      ${detail ? `<p>${esc(detail)}</p>` : ''}
      ${button(`${app}/admin/rfqs/${q.id}`, 'Open in admin →')}`),
  })
}

export async function emailCustomerOrderConfirmed(q: QuoteRecord, orderNumber: string, terms: string) {
  if (!q.guest_email) return
  const app = await getAppUrl()
  await sendEmail({
    to: q.guest_email,
    subject: `Order ${orderNumber} confirmed (quote ${q.quote_number})`,
    html: shell(`<h2 style="margin:0 0 8px">Order confirmed</h2>
      <p>We've turned quote <b>${esc(q.quote_number)}</b> into order <b>${esc(orderNumber)}</b>, billed on <b>${esc(terms)}</b> terms. We'll email tracking and the freight PRO number once your pallets ship.</p>
      ${itemsTable(q, true)}
      <p style="text-align:right;font-size:18px;font-weight:900">Total ${formatPrice(q.total_cents ?? 0)}</p>
      ${button(`${app}/quote/${q.public_token}`, 'View quote')}`),
  })
}
