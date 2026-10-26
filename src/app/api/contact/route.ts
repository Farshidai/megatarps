import { redirect } from 'next/navigation'
import { sendEmail, adminNotificationEmail } from '@/lib/email/send'
import { escapeHtml as h } from '@/lib/wholesale'

const SUBJECT_LABELS: Record<string, string> = {
  general: 'General Question',
  order: 'Order Status',
  product: 'Product Question',
  return: 'Return / Warranty',
  bulk: 'Bulk Pricing',
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: Request) {
  const form = await request.formData()
  const field = (k: string, max: number) => String(form.get(k) ?? '').trim().slice(0, max)
  const name = field('name', 120)
  const email = field('email', 200)
  const message = field('message', 5000)
  // only known subjects; anything else (attacker-supplied text) becomes "general"
  const subjectLabel = SUBJECT_LABELS[field('subject', 20)] ?? SUBJECT_LABELS.general

  if (!name || !email || !message || !EMAIL_RE.test(email)) {
    redirect('/contact?error=missing')
  }

  // Every visitor-supplied value is HTML-escaped before it goes into the admin email.
  // sendEmail() is a logged no-op in demo mode / without RESEND_API_KEY.
  const result = await sendEmail({
    to: adminNotificationEmail(),
    replyTo: email,
    subject: `Contact: ${subjectLabel} — ${name.replace(/[\r\n]+/g, ' ')}`,
    html: `
        <h2>New Contact Form Submission</h2>
        <table cellpadding="4" style="font-size:14px">
          <tr><td><strong>Name</strong></td><td>${h(name)}</td></tr>
          <tr><td><strong>Email</strong></td><td><a href="mailto:${h(email)}">${h(email)}</a></td></tr>
          <tr><td><strong>Subject</strong></td><td>${h(subjectLabel)}</td></tr>
        </table>
        <h3>Message</h3>
        <p style="white-space:pre-wrap">${h(message)}</p>
      `,
  })
  if (!result.ok) console.error('Contact email error:', result.error)

  redirect('/contact?sent=1')
}
