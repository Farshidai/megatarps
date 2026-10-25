// Shared transactional email helper (owned by Team C; Team D may reuse it).
// No-op that logs when RESEND_API_KEY is missing or a placeholder, or in demo mode.
import { Resend } from 'resend'
import { isDemoMode } from '@/lib/demo'

export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? process.env.RESEND_FROM_EMAIL ?? 'MegaTarps <mfirooz@megatarps.com>'

/** Primary admin inbox for notifications: ADMIN_EMAIL, else the first ADMIN_EMAILS entry. */
export function adminNotificationEmail(): string {
  const first = (process.env.ADMIN_EMAILS ?? '').split(',').map((s) => s.trim()).find(Boolean)
  return process.env.ADMIN_EMAIL?.trim() || first || 'mfirooz@megatarps.com'
}

function emailDisabled(): boolean {
  const key = process.env.RESEND_API_KEY ?? ''
  return !key || /placeholder/i.test(key) || isDemoMode()
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[]
  subject: string
  html: string
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (emailDisabled()) {
    console.log(`[email:skipped] to=${Array.isArray(to) ? to.join(',') : to} subject="${subject}"`)
    return { ok: true, skipped: true }
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, html })
    if (error) {
      console.error('[email:error]', error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (e) {
    console.error('[email:error]', e)
    return { ok: false, error: e instanceof Error ? e.message : 'send failed' }
  }
}
