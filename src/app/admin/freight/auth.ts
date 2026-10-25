// Server-side admin check for /admin/freight. (src/lib/admin.ts / requireAdmin() is not in
// this worktree; switch to it once Team C's version lands.)
import { createClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo'

export function adminEmails(): string[] {
  return [process.env.ADMIN_EMAILS ?? '', process.env.ADMIN_EMAIL ?? '']
    .join(',')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/** Returns the admin's email, or null when the current user is not an admin. Never true in demo mode. */
export async function currentAdminEmail(): Promise<string | null> {
  if (isDemoMode()) return null
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email?.toLowerCase()
  return email && adminEmails().includes(email) ? email : null
}
