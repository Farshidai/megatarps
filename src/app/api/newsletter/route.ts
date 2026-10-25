import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo'

// POST /api/newsletter  { email, source?, website? }  (JSON or form-encoded)
// Stores the address in `newsletter_signups` (migration 0005) with the service role.
// DEMO MODE: validates and returns ok without storing anything.
// `website` is a honeypot: humans never see it, bots fill it in.

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const SOURCES = new Set(['homepage', 'resources', 'footer', 'article', 'calculator'])
const CONSENT_TEXT = 'Occasional emails from MegaTarps about stock, pricing and tarp guides. Unsubscribe anytime.'

async function readBody(req: Request): Promise<Record<string, string>> {
  const type = req.headers.get('content-type') ?? ''
  try {
    if (type.includes('application/json')) {
      const j = (await req.json()) as Record<string, unknown>
      return Object.fromEntries(Object.entries(j ?? {}).map(([k, v]) => [k, typeof v === 'string' ? v : '']))
    }
    const f = await req.formData()
    return Object.fromEntries([...f.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : '']))
  } catch {
    return {}
  }
}

export async function POST(req: Request) {
  const body = await readBody(req)
  const email = (body.email ?? '').trim().toLowerCase()
  const source = SOURCES.has(body.source ?? '') ? body.source : 'homepage'

  // Honeypot: pretend success so bots don't retry.
  if (body.website) return NextResponse.json({ ok: true })

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 })
  }

  if (isDemoMode()) {
    console.log(`[newsletter] demo mode, not stored: ${email} (${source})`)
    return NextResponse.json({ ok: true, demo: true })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('[newsletter] SUPABASE_SERVICE_ROLE_KEY is not set')
    return NextResponse.json({ ok: false, error: 'Signup is temporarily unavailable. Please try again later.' }, { status: 503 })
  }

  // Plain service-role client (no auth cookies), so a signed-in visitor's session
  // can never replace the service key and trip RLS.
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error } = await admin
    .from('newsletter_signups')
    .upsert({ email, source, consent_text: CONSENT_TEXT, unsubscribed_at: null }, { onConflict: 'email' })

  if (error) {
    console.error('[newsletter] insert failed:', error.message)
    return NextResponse.json({ ok: false, error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
