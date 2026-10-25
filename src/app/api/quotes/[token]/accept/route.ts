// Accept on Net terms (approved wholesale accounts only) → creates the order, invoiced.
import { addEvent, createOrderFromQuote, getQuoteByToken, transitionQuote, updateQuote } from '@/lib/quotes/store'
import { netTermsFor, termsLabel } from '@/lib/quotes/auth'
import { emailAdminStatus, emailCustomerOrderConfirmed } from '@/lib/quotes/emails'
import { effectiveStatus } from '@/lib/quotes/types'

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await request.json().catch(() => ({}))
  const po = typeof body?.po_number === 'string' ? body.po_number.trim().slice(0, 60) : ''

  const q = await getQuoteByToken(token)
  if (!q) return Response.json({ error: 'Quote not found' }, { status: 404 })
  const status = effectiveStatus(q)
  if (status === 'expired') return Response.json({ error: 'This quote has expired. Ask us for a refreshed quote.' }, { status: 410 })
  if (status !== 'quoted') return Response.json({ error: `This quote is ${status} and can't be accepted.` }, { status: 409 })
  if (!q.items.length || q.items.some((i) => !(i.unit_price_cents > 0))) {
    return Response.json({ error: 'This quote is incomplete. Please contact us.' }, { status: 409 })
  }

  const { allowed, terms } = await netTermsFor(q)
  if (!allowed) return Response.json({ error: 'Net terms are available to approved wholesale accounts signed in to their own quote.' }, { status: 403 })

  const now = new Date().toISOString()
  const updated = await transitionQuote(q.id, ['quoted'], { status: 'ordered', accepted_at: now, payment_method: terms })
  if (!updated) return Response.json({ error: 'This quote was just updated. Refresh and try again.' }, { status: 409 })

  let orderNumber: string
  try {
    orderNumber = await createOrderFromQuote(updated, { paymentMethod: terms, paymentStatus: 'invoiced' })
  } catch (e) {
    console.error('net terms order failed:', e)
    await updateQuote(q.id, { status: 'quoted', accepted_at: null, payment_method: null }).catch(() => {})
    return Response.json({ error: 'Could not create the order. Please call (913) 313-2691.' }, { status: 500 })
  }

  const label = termsLabel(terms)
  await addEvent(q.id, 'accepted', `Accepted on ${label} — order ${orderNumber}${po ? ` · PO ${po}` : ''}`)
  await Promise.all([
    emailAdminStatus(updated, `Accepted on ${label} — order ${orderNumber}`, po ? `Customer PO: ${po}` : '').catch(() => {}),
    emailCustomerOrderConfirmed(updated, orderNumber, label).catch(() => {}),
  ])
  return Response.json({ ok: true, order_number: orderNumber })
}
