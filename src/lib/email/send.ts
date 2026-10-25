// Shared email helper (owned by Team C — this is a compatible copy so Team D can build;
// the lead reconciles). No-op that logs when RESEND_API_KEY is missing/placeholder or in demo mode.
import { Resend } from 'resend'
import { isDemoMode } from '@/lib/demo'

export async function sendEmail({ to, subject, html }: { to: string | string[]; subject: string; html: string }) {
  const key = process.env.RESEND_API_KEY ?? ''
  if (!key || key.includes('placeholder') || isDemoMode()) {
    console.log(`[email:noop] to=${Array.isArray(to) ? to.join(',') : to} subject="${subject}"`)
    return { ok: true as const, skipped: true as const }
  }
  try {
    const resend = new Resend(key)
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'MegaTarps <quotes@megatarps.com>',
      to,
      subject,
      html,
    })
    if (error) {
      console.error('[email] send error:', error)
      return { ok: false as const, error: String(error.message ?? error) }
    }
    return { ok: true as const }
  } catch (e) {
    console.error('[email] send failed:', e)
    return { ok: false as const, error: (e as Error).message }
  }
}
