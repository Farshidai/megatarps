import { rateLimit } from '@/lib/rate-limit'
import { getProducts } from '@/lib/products'
import { isQuoteOnly } from '@/lib/pricing'
import { getAccountPricing } from '@/lib/accounts'
import { addEvent, contractorProfileExists, createQuote } from '@/lib/quotes/store'
import { getSignedInUser } from '@/lib/quotes/auth'
import { emailNewRequest } from '@/lib/quotes/emails'
import { DELIVERY_TYPES, type DeliveryType, type QuoteLine } from '@/lib/quotes/types'

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const ZIP_RE = /^\d{5}(-\d{4})?$/

export async function POST(request: Request) {
  const limited = rateLimit(request, 'rfq')
  if (limited) return limited
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Honeypot: real users never fill the hidden "website" field.
  if (str(body.website)) return Response.json({ success: true, quote_number: 'MQ-RECEIVED' })

  const name = str(body.name, 120)
  const email = str(body.email, 200).toLowerCase()
  const phone = str(body.phone, 40)
  const company = str(body.company, 160)
  const deliveryZip = str(body.delivery_zip ?? body.shipping_zip, 10)
  const deliveryType = str(body.delivery_type, 20) as DeliveryType
  const neededBy = str(body.needed_by, 10)

  const errors: Record<string, string> = {}
  if (!name) errors.name = 'Name is required'
  if (!EMAIL_RE.test(email)) errors.email = 'A valid email is required'
  if (!ZIP_RE.test(deliveryZip)) errors.delivery_zip = 'A 5-digit delivery ZIP is required for freight'
  if (deliveryType && !DELIVERY_TYPES.includes(deliveryType)) errors.delivery_type = 'Choose a delivery type'
  if (neededBy && (!/^\d{4}-\d{2}-\d{2}$/.test(neededBy) || Number.isNaN(Date.parse(neededBy)))) errors.needed_by = 'Invalid date'

  const rawItems = Array.isArray(body.items) ? body.items.slice(0, 60) : []
  const catalog = await getProducts()
  const bySku = new Map(catalog.map((p) => [p.xpose_sku.toLowerCase(), p]))
  const byId = new Map(catalog.map((p) => [p.id, p]))

  const items: QuoteLine[] = []
  for (const raw of rawItems as Record<string, unknown>[]) {
    const qty = Math.floor(Number(raw?.quantity))
    const sku = str(raw?.sku, 60)
    const description = str(raw?.description ?? raw?.name, 300)
    const product = byId.get(str(raw?.product_id, 60)) ?? (sku ? bySku.get(sku.toLowerCase()) : undefined)
    if (!product && !description && !sku) continue
    if (!Number.isFinite(qty) || qty < 1 || qty > 100000) {
      errors.items = 'Each line needs a quantity between 1 and 100,000'
      continue
    }
    items.push({
      product_id: product?.id ?? null,
      sku: product?.xpose_sku ?? sku,
      name: product?.name ?? description,
      quantity: qty,
      unit_price_cents: 0, // priced by admin; never trust browser prices
      line_total: 0,
      quote_only: product ? isQuoteOnly(product) : true,
    })
  }
  if (!items.length) errors.items = 'Add at least one product'

  if (Object.keys(errors).length) {
    return Response.json({ error: 'Please fix the highlighted fields', fields: errors }, { status: 400 })
  }

  // Attach the signed-in contractor (quotes.contractor_id has an FK to contractor_profiles).
  let contractorId: string | null = null
  try {
    const acct = await getAccountPricing()
    const user = acct.userId ? { id: acct.userId } : await getSignedInUser()
    if (user && (await contractorProfileExists(user.id))) contractorId = user.id
  } catch (e) {
    console.error('rfq: account lookup failed', e)
  }

  const shipping = {
    name: str(body.shipping_name, 120) || name,
    company: company || undefined,
    line1: str(body.shipping_line1, 200),
    city: str(body.shipping_city, 100),
    state: str(body.shipping_state, 2).toUpperCase(),
    zip: deliveryZip,
    country: 'US',
  }

  let quote
  try {
    quote = await createQuote({
      contractor_id: contractorId,
      guest_name: name,
      guest_email: email,
      guest_phone: phone || null,
      guest_company: company || null,
      items,
      status: 'pending',
      project_type: str(body.project_type, 40) || null,
      project_location: str(body.project_location, 160) || null,
      timeline: str(body.timeline, 40) || null,
      special_requirements: str(body.special_requirements, 2000) || null,
      ai_recommended: body.source === 'chat',
      shipping_address: shipping,
      delivery_type: deliveryType || null,
      delivery_zip: deliveryZip,
      needed_by: neededBy || null,
    })
  } catch (e) {
    console.error('Quote insert error:', e)
    return Response.json({ error: 'Failed to save quote request' }, { status: 500 })
  }

  const source = body.source === 'cart' ? 'from cart' : body.source === 'chat' ? 'from AI chat' : 'via bulk quote form'
  await addEvent(quote.id, 'created', `Submitted ${source}`)

  try {
    await emailNewRequest(quote)
  } catch (e) {
    console.error('rfq email error:', e) // never fail the request over email
  }

  return Response.json({ success: true, quote_number: quote.quote_number, token: quote.public_token })
}
