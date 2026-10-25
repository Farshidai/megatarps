import { addEvent, getQuoteByToken, transitionQuote } from '@/lib/quotes/store'
import { emailAdminStatus } from '@/lib/quotes/emails'

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await request.json().catch(() => ({}))
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 1000) : ''

  const q = await getQuoteByToken(token)
  if (!q) return Response.json({ error: 'Quote not found' }, { status: 404 })

  const updated = await transitionQuote(q.id, ['quoted', 'expired', 'pending'], {
    status: 'declined', declined_reason: reason || null,
  })
  if (!updated) return Response.json({ error: `This quote is ${q.status} and can't be declined.` }, { status: 409 })

  await addEvent(q.id, 'declined', reason || null)
  await emailAdminStatus(updated, 'Quote declined', reason ? `Reason: ${reason}` : 'No reason given').catch(() => {})
  return Response.json({ ok: true })
}
