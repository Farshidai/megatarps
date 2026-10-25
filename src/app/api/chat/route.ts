import { getProducts } from '@/lib/products'
import { isQuoteOnly } from '@/lib/pricing'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/types'

const MODEL = 'claude-sonnet-5-5'

const SYSTEM_PROMPT_BASE = `You are a knowledgeable tarp expert and sales assistant for MegaTarps.com — a wholesale and retail tarp supplier (Kansas City metro) serving contractors, roofers, farms and warehouses across the Midwest.

Your job: help customers find the right tarp for their specific need, then guide them toward a purchase or a wholesale quote.

## Business Rules
- Small orders can be bought online by card. Bulk orders (5+ units) get volume-tier pricing, and pallets ship LTL truck freight — those go through a quote request.
- Products marked QUOTE-ONLY in the catalog are pallet/bulk SKUs with no online price: always route them to a quote.
- Never quote custom bulk or freight prices yourself; say "our team will send a priced quote with freight within 4 business hours".
- Never reveal cost/margin data.
- Be honest about what we carry; only recommend SKUs that appear in the catalog below. Don't invent products.

## How to recommend products
Format product names as links: [Product Name](/product/SLUG) and include the SKU, e.g. "SKU: MT-20X30-10MIL".

## Quote handoff (important)
Whenever you recommend specific catalog products the customer could order, end your reply with ONE final line in exactly this format (no code fence, nothing after it):
<quote_items>[{"sku":"EXACT-SKU","qty":10}]</quote_items>
- Use exact SKUs from the catalog, at most 6 items.
- qty = the quantity the customer mentioned; if unknown, use 10.
- The website hides this line and shows a "Turn this into a quote request" button instead. Never mention the tag itself.
- Omit the line when you are only asking clarifying questions.

## Tarp selection guide
- 5–7 mil: light duty, temporary covers, ground cloths
- 10 mil: heavy duty — construction debris, equipment storage, roofing dry-in
- 12 mil: extreme duty — roofing, truck tarps, scaffold enclosures
- 16 mil: super heavy duty — long-term outdoor, farm equipment
- 20 mil: ultra heavy duty — semi-permanent covers, extreme weather
- Fire retardant: welding, electrical, code-regulated sites
- Mesh: shade, privacy and wind screens · Canvas: breathable drop cloths · Clear vinyl: enclosures, greenhouses

## Response style
- Short, practical answers (under 180 words unless asked for more).
- Ask a clarifying question when the use case is unclear (dimensions? how long outdoors? how many?).
- End with a clear next step.`

function catalogLines(products: Product[]): string {
  return products
    .filter((p) => p.active)
    .map((p) =>
      [p.xpose_sku, p.name, p.slug, isQuoteOnly(p) ? 'QUOTE-ONLY' : formatPrice(p.retail_price_cents), p.in_stock ? '' : 'OUT OF STOCK']
        .filter(Boolean)
        .join(' | '),
    )
    .join('\n')
}

interface ChatMsg { role: 'user' | 'assistant'; content: string }

function cleanMessages(raw: unknown): ChatMsg[] {
  if (!Array.isArray(raw)) return []
  const msgs = raw
    .filter((m): m is ChatMsg => !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
    .slice(-20)
  while (msgs.length && msgs[0].role !== 'user') msgs.shift() // API needs a user turn first (drops the canned greeting)
  return msgs
}

const sse = (text: string) => `data: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } })}\n\n`

/** DEMO MODE / no API key: a canned but catalog-accurate reply in the same SSE shape as Anthropic. */
function demoReply(products: Product[], lastUser: string): Response {
  const msg = lastUser.toLowerCase()
  const size = /(\d{1,3})\s*(?:'|ft)?\s*(?:x|×|by)\s*(\d{1,3})/.exec(msg)
  const mil = /(\d{1,2})\s*-?\s*mil/.exec(msg)
  const qtyMatch = /(\d{1,5})\s*(?:tarps?|units?|pcs|pieces|each|of them)/.exec(msg)
  const qty = qtyMatch ? Math.max(1, Math.min(100000, parseInt(qtyMatch[1], 10))) : 10

  const tarps = products.filter((p) => p.active && p.in_stock && p.tarp_type !== 'accessory' && !isQuoteOnly(p))
  const score = (p: Product) => {
    let s = 0
    if (size) {
      const [a, b] = [parseInt(size[1], 10), parseInt(size[2], 10)]
      if ((p.width_ft === a && p.length_ft === b) || (p.width_ft === b && p.length_ft === a)) s += 5
      else s -= Math.abs(p.width_ft * p.length_ft - a * b) / 400
    }
    if (mil && p.thickness_mil === parseInt(mil[1], 10)) s += 3
    if (!size && !mil) s += (p.thickness_mil ?? 0) >= 10 && p.width_ft >= 20 ? 2 : 0
    return s
  }
  const ranked = [...tarps].sort((a, b) => score(b) - score(a))
  const picks: Product[] = []
  for (const p of ranked) {
    if (picks.length === 2) break
    if (!picks.some((x) => x.width_ft === p.width_ft && x.length_ft === p.length_ft && x.thickness_mil === p.thickness_mil)) picks.push(p)
  }
  if (picks.length < 2) picks.push(...products.filter((p) => !picks.includes(p)).slice(0, 2 - picks.length))

  const lines = picks.map(
    (p) => `- **[${p.name}](/product/${p.slug})** — SKU: ${p.xpose_sku}. ${p.thickness_mil ? `${p.thickness_mil}-mil, ` : ''}${isQuoteOnly(p) ? 'pallet pricing by quote' : `${formatPrice(p.retail_price_cents)} each, with volume tiers from 5+`}.`,
  )
  const text =
    `Good question. Based on what you described, here are two options from our catalog:\n\n${lines.join('\n')}\n\n` +
    `The heavier one holds up better for multi-week outdoor exposure and wind. For ${qty} units we'll price it with LTL freight to your ZIP — use the button below to turn this into a quote request.\n\n` +
    `_(Demo mode: canned reply — the live assistant runs when an Anthropic API key is set.)_\n` +
    `<quote_items>${JSON.stringify(picks.map((p) => ({ sku: p.xpose_sku, qty })))}</quote_items>`

  const chunks = text.match(/[\s\S]{1,24}/g) ?? []
  const enc = new TextEncoder()
  let i = 0
  const stream = new ReadableStream({
    async pull(controller) {
      if (i >= chunks.length) {
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: 'message_stop' })}\n\n`))
        controller.close()
        return
      }
      await new Promise((r) => setTimeout(r, 12))
      controller.enqueue(enc.encode(sse(chunks[i++])))
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' } })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const messages = cleanMessages(body?.messages)
  if (!messages.length) return Response.json({ error: 'No messages' }, { status: 400 })

  let products: Product[] = []
  try {
    products = await getProducts()
  } catch {
    products = []
  }

  const key = process.env.ANTHROPIC_API_KEY ?? ''
  if (!key || key.includes('placeholder') || !key.startsWith('sk-ant-')) {
    return demoReply(products, messages[messages.length - 1].content)
  }

  const productContext = products.length
    ? `\n\n## Current catalog (${products.length} products) — SKU | name | slug | price\n${catalogLines(products).slice(0, 40000)}`
    : '\n\n(Product catalog temporarily unavailable — do not recommend specific SKUs.)'

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      stream: true,
      system: SYSTEM_PROMPT_BASE + productContext,
      messages,
    }),
  })

  if (!anthropicRes.ok) {
    console.error('Anthropic error:', await anthropicRes.text())
    return Response.json({ error: 'AI service unavailable' }, { status: 502 })
  }

  return new Response(anthropicRes.body, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
  })
}
