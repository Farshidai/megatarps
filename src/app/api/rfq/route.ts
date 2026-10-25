import { createAdminClient } from '@/lib/supabase/server'
import { generateQuoteNumber } from '@/lib/utils'
import { Resend } from 'resend'

export async function POST(request: Request) {
  const body = await request.json()
  const {
    name, email, phone, company,
    project_type, project_location, timeline, special_requirements,
    items,
    shipping_name, shipping_line1, shipping_city, shipping_state, shipping_zip,
  } = body

  if (!name || !email || !items?.length) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const quoteNumber = generateQuoteNumber()
  const supabase = await createAdminClient()

  const { error } = await supabase.from('quotes').insert({
    quote_number: quoteNumber,
    guest_name: name,
    guest_email: email,
    guest_phone: phone || null,
    guest_company: company || null,
    items: items.map((item: { description: string; sku: string; quantity: number }) => ({
      sku: item.sku || '',
      name: item.description,
      quantity: item.quantity,
      unit_price_cents: 0,
      line_total: 0,
    })),
    project_type: project_type || null,
    project_location: project_location || null,
    timeline: timeline || null,
    special_requirements: special_requirements || null,
    status: 'pending',
    shipping_address: {
      name: shipping_name,
      line1: shipping_line1,
      city: shipping_city,
      state: shipping_state,
      zip: shipping_zip,
      country: 'US',
    },
  })

  if (error) {
    console.error('Quote insert error:', error)
    return Response.json({ error: 'Failed to save quote request' }, { status: 500 })
  }

  // Send email notifications (non-blocking)
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const itemList = items
      .map((i: { description: string; sku: string; quantity: number }) =>
        `<li>${i.quantity}x ${i.description}${i.sku ? ` (SKU: ${i.sku})` : ''}</li>`)
      .join('')

    await Promise.all([
      // Admin notification
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'mfirooz@megatarps.com',
        to: process.env.ADMIN_EMAIL ?? 'farshid@megatarps.com',
        subject: `🧾 New Bulk Quote ${quoteNumber} — ${name}${company ? ` (${company})` : ''}`,
        html: `
          <h2 style="color:#ea580c">New Bulk Quote Request</h2>
          <p><strong>Quote #:</strong> ${quoteNumber}</p>
          <table cellpadding="4" style="font-size:14px">
            <tr><td><strong>Name</strong></td><td>${name}</td></tr>
            <tr><td><strong>Company</strong></td><td>${company || '—'}</td></tr>
            <tr><td><strong>Email</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td><strong>Phone</strong></td><td>${phone || '—'}</td></tr>
            <tr><td><strong>Timeline</strong></td><td>${timeline || '—'}</td></tr>
            <tr><td><strong>Project Type</strong></td><td>${project_type || '—'}</td></tr>
            <tr><td><strong>Location</strong></td><td>${project_location || '—'}</td></tr>
          </table>
          <h3>Items Requested</h3>
          <ul>${itemList}</ul>
          ${special_requirements ? `<p><strong>Special Requirements:</strong><br>${special_requirements}</p>` : ''}
          <p><strong>Ship to:</strong> ${shipping_name}, ${shipping_line1}, ${shipping_city} ${shipping_state} ${shipping_zip}</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/rfqs" style="background:#ea580c;color:white;padding:8px 16px;border-radius:6px;text-decoration:none">View in Admin →</a></p>
        `,
      }),
      // Customer confirmation
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'mfirooz@megatarps.com',
        to: email,
        subject: `Quote Request Received — ${quoteNumber}`,
        html: `
          <h2>We got your quote request!</h2>
          <p>Hi ${name},</p>
          <p>Thanks for reaching out to MegaTarps. We've received your bulk quote request <strong>${quoteNumber}</strong> and will respond within <strong>4 business hours</strong> (Mon–Fri).</p>
          <h3>What you requested:</h3>
          <ul>${itemList}</ul>
          <p>Questions? Reply to this email or call us at (913) 313-2691.</p>
          <br>
          <p>— The MegaTarps Team</p>
        `,
      }),
    ])
  } catch (emailError) {
    console.error('Email send error:', emailError)
    // Don't fail the request if email fails
  }

  return Response.json({ success: true, quote_number: quoteNumber })
}
