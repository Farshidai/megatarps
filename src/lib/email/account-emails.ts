// Email bodies for the wholesale account lifecycle. All user input is escaped.
import { escapeHtml as h, formatCents, paymentTermsLabel } from '@/lib/wholesale'

type P = {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone?: string | null
  business_type?: string | null
  service_area?: string | null
  years_in_business?: number | null
  est_monthly_volume?: string | null
  website?: string | null
  resale_cert_state?: string | null
  wholesale_discount_percent?: number
  payment_terms?: string
  credit_limit_cents?: number | null
  tax_exempt?: boolean
  rejection_reason?: string | null
}

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? 'https://megatarps.com'

function layout(title: string, body: string) {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
  <div style="padding:16px 0"><span style="background:#f97316;color:#fff;font-weight:900;padding:4px 8px;border-radius:4px 0 0 4px">MEGA</span><span style="background:#0f172a;color:#fff;font-weight:900;padding:4px 8px;border-radius:0 4px 4px 0">TARPS</span></div>
  <h2 style="margin:8px 0 16px">${title}</h2>
  ${body}
  <p style="color:#64748b;font-size:12px;margin-top:32px">MegaTarps · Mega Innovation Group LLC · Kansas City metro</p>
</div>`
}

const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${href}" style="background:#f97316;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">${label}</a></p>`

export function applicantReceivedEmail(p: P) {
  return {
    subject: 'We received your MegaTarps wholesale application',
    html: layout(
      'Application received',
      `<p>Hi ${h(p.contact_name)},</p>
       <p>Thanks for applying for a wholesale account for <strong>${h(p.company_name)}</strong>. Our team reviews every application and will email you as soon as a decision is made.</p>
       <p>In the meantime you can still shop at standard volume pricing or request a bulk quote.</p>
       ${button(`${appUrl()}/account`, 'View your account')}`,
    ),
  }
}

export function adminNewApplicationEmail(p: P, hasCertificate: boolean, reapply = false) {
  const rows: [string, string][] = [
    ['Company', p.company_name],
    ['Contact', p.contact_name],
    ['Email', p.email],
    ['Phone', p.phone ?? '—'],
    ['Business type', p.business_type ?? '—'],
    ['Years in business', String(p.years_in_business ?? '—')],
    ['Service area', p.service_area ?? '—'],
    ['Est. monthly volume', p.est_monthly_volume ?? '—'],
    ['Website', p.website ?? '—'],
    ['Resale certificate', hasCertificate ? `Uploaded (${p.resale_cert_state ?? '—'})` : 'None'],
  ]
  return {
    subject: `${reapply ? 'Re-application' : 'New wholesale application'}: ${p.company_name}`,
    html: layout(
      reapply ? 'Wholesale re-application' : 'New wholesale application',
      `<table cellpadding="6" style="font-size:14px;border-collapse:collapse">${rows
        .map(([k, v]) => `<tr><td style="color:#64748b">${h(k)}</td><td><strong>${h(v)}</strong></td></tr>`)
        .join('')}</table>
       ${button(`${appUrl()}/admin/accounts/${encodeURIComponent(p.id)}`, 'Review application')}`,
    ),
  }
}

export function applicantApprovedEmail(p: P) {
  const terms = paymentTermsLabel(p.payment_terms)
  return {
    subject: 'Your MegaTarps wholesale account is approved',
    html: layout(
      "You're approved!",
      `<p>Hi ${h(p.contact_name)},</p>
       <p>Your wholesale account for <strong>${h(p.company_name)}</strong> is approved. Here are your account terms:</p>
       <ul style="font-size:14px;line-height:1.7">
         <li>Wholesale discount: <strong>${h(p.wholesale_discount_percent ?? 0)}%</strong> extra on items without pallet pricing</li>
         <li>Payment terms: <strong>${h(terms)}</strong></li>
         ${p.credit_limit_cents ? `<li>Credit limit: <strong>${h(formatCents(p.credit_limit_cents))}</strong></li>` : ''}
         <li>Tax-exempt purchasing: <strong>${p.tax_exempt ? 'Yes' : 'No'}</strong></li>
       </ul>
       <p>Sign in to see your pricing applied across the catalog.</p>
       ${button(`${appUrl()}/account`, 'Go to my account')}`,
    ),
  }
}

export function applicantRejectedEmail(p: P) {
  return {
    subject: 'Update on your MegaTarps wholesale application',
    html: layout(
      'Application update',
      `<p>Hi ${h(p.contact_name)},</p>
       <p>Thank you for applying for a wholesale account for <strong>${h(p.company_name)}</strong>. We aren't able to approve the application right now.</p>
       ${p.rejection_reason ? `<p style="background:#f8fafc;border-left:3px solid #f97316;padding:10px 14px">${h(p.rejection_reason)}</p>` : ''}
       <p>You can update your details and re-apply from your account at any time, or reply to this email with questions.</p>
       ${button(`${appUrl()}/apply`, 'Update and re-apply')}`,
    ),
  }
}

export function adminCertificateUploadedEmail(p: P) {
  return {
    subject: `New resale certificate uploaded: ${p.company_name}`,
    html: layout(
      'Resale certificate uploaded',
      `<p><strong>${h(p.company_name)}</strong> (${h(p.email)}) uploaded a new resale / tax-exempt certificate${p.resale_cert_state ? ` for ${h(p.resale_cert_state)}` : ''}.</p>
       ${button(`${appUrl()}/admin/accounts/${encodeURIComponent(p.id)}`, 'Review certificate')}`,
    ),
  }
}
