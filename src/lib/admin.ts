// Admin guard (owned by Team C — this is a compatible copy so Team D can build;
// the lead reconciles). Call inside EVERY admin server component and server action.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo'

export function adminEmails(): string[] {
  return [process.env.ADMIN_EMAILS ?? '', process.env.ADMIN_EMAIL ?? '']
    .join(',')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmails().includes(email.toLowerCase())
}

/** Returns the admin's email (or 'demo' in demo mode). Redirects to login otherwise. */
export async function requireAdmin(): Promise<{ email: string }> {
  if (isDemoMode()) return { email: 'demo-admin@megatarps.com' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) redirect('/account/login?redirect=/admin')
  return { email: user.email! }
}
