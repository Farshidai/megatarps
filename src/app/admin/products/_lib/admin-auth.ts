import { createClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo'

export type AdminCheck =
  | { ok: true; demo: false; email: string }
  | { ok: true; demo: true; email: null }
  | { ok: false; demo: false; reason: string }

/** Admin allow-list: ADMIN_EMAILS (comma list) and/or ADMIN_EMAIL. Case-insensitive. */
export function adminEmails(): string[] {
  return [process.env.ADMIN_EMAILS ?? '', process.env.ADMIN_EMAIL ?? '']
    .join(',')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Server-side admin check. Every admin page AND every admin server action calls this —
 * server actions are reachable by direct POST, so the proxy redirect is not enough.
 * In demo mode there is no auth and nothing is persisted, so it reports demo: true.
 */
export async function checkAdmin(): Promise<AdminCheck> {
  if (isDemoMode()) return { ok: true, demo: true, email: null }
  const allow = adminEmails()
  if (!allow.length) return { ok: false, demo: false, reason: 'No admin configured. Set ADMIN_EMAILS (or ADMIN_EMAIL) in the environment.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email?.toLowerCase()
  if (!email) return { ok: false, demo: false, reason: 'Sign in with an admin account to continue.' }
  if (!allow.includes(email)) return { ok: false, demo: false, reason: `${user!.email} is not an admin account.` }
  return { ok: true, demo: false, email }
}
