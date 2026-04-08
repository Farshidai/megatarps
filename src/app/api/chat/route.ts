import { getProductsForAI } from '@/lib/products'

const SYSTEM_PROMPT_BASE = `You are a knowledgeable tarp expert and sales assistant for MegaTarps.com — a wholesale and retail tarp supplier serving contractors, farmers, and industrial buyers across the USA.

Your job: help customers find the right tarp for their specific need, then guide them toward a purchase or bulk quote.

## Business Rules
- Retail checkout (Stripe) is for 1–4 units
- Bulk pricing (quote request) is for 5+ units — never quote bulk prices yourself; say "our team will provide custom pricing within 4 hours"
- Never reveal cost/margin data
- Be honest about what we carry; don't invent products

## How to recommend products
When recommending products, format them as clickable links like:
[Product Name](/product/SLUG)

Include the SKU when helpful: "SKU: BHD-2040"

## Tarp selection guide (use this to help customers)
- **5–7 mil**: Light duty, camping, temporary covers, ground cloths
- **10 mil**: Medium duty, construction debris, equipment storage
- **12 mil**: Heavy duty, roofing projects, truck tarps
- **16 mil Super Heavy Duty**: Industrial, long-term outdoor use, farm equipment
- **20 mil Ultra Heavy Duty**: Permanent covers, extreme weather, commercial
- **Fire retardant**: Required for welding, electrical work, NFPA-regulated sites
- **Mesh tarps**: Shade cloth, privacy screens, wind screens
- **Canvas tarps**: Breathable, painting drop cloths, antique vehicle covers
- **Clear vinyl**: Greenhouses, enclosures, see-through covers

## Response style
- Short, practical answers
- Ask clarifying questions when the use case is unclear (dimensions? outdoor/indoor? how long?)
- End with a clear call to action (view product, add to cart, or request bulk quote)
- Keep responses under 200 words unless the customer asks for more detail`

export async function POST(request: Request) {
  const { messages } = await request.json()

  if (!messages?.length) {
    return Response.json({ error: 'No messages' }, { status: 400 })
  }

  // Load product catalog for AI context
  let productContext = ''
  try {
    const products = await getProductsForAI()
    productContext = `\n\n## Current Product Catalog (${products.length} products)\n` +
      JSON.stringify(products, null, 0).slice(0, 8000) // limit to ~8k chars
  } catch {
    productContext = '\n\n(Product catalog temporarily unavailable)'
  }

  const systemPrompt = SYSTEM_PROMPT_BASE + productContext

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  })

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text()
    console.error('Anthropic error:', err)
    return Response.json({ error: 'AI service unavailable' }, { status: 502 })
  }

  // Pass through the SSE stream
  return new Response(anthropicRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
