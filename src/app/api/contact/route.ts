import { Resend } from 'resend'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
  const form = await request.formData()
  const name = (form.get('name') as string)?.trim()
  const email = (form.get('email') as string)?.trim()
  const subject = (form.get('subject') as string) ?? 'general'
  const message = (form.get('message') as string)?.trim()

  if (!name || !email || !message) {
    redirect('/contact?error=missing')
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const subjectLabels: Record<string, string> = {
      general: 'General Question',
      order: 'Order Status',
      product: 'Product Question',
      return: 'Return / Warranty',
      bulk: 'Bulk Pricing',
    }

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'orders@megatarps.com',
      to: process.env.ADMIN_EMAIL ?? 'farshid@megatarps.com',
      replyTo: email,
      subject: `📬 Contact: ${subjectLabels[subject] ?? subject} — ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <table cellpadding="4" style="font-size:14px">
          <tr><td><strong>Name</strong></td><td>${name}</td></tr>
          <tr><td><strong>Email</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td><strong>Subject</strong></td><td>${subjectLabels[subject] ?? subject}</td></tr>
        </table>
        <h3>Message</h3>
        <p style="white-space:pre-wrap">${message}</p>
      `,
    })
  } catch (err) {
    console.error('Contact email error:', err)
  }

  redirect('/contact?sent=1')
}
