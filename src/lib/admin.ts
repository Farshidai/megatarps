// Server-only admin helpers. Every admin page and server action calls requireAdmin();
// src/proxy.ts is a first line of defense only.
import { redirect } from 'next/navigation'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo'
import { isAdminEmail } from '@/lib/admin-emails'

export { getAdminEmails, isAdminEmail } from '@/lib/admin-emails'
export { getAdminEmails as adminEmails } from '@/lib/admin-emails'

export interface AdminUser {
  email: string
  userId: string | null
  demo: boolean
}

/** Returns the signed-in admin, or null. Demo mode is always allowed. */
export async function getAdmin(): Promise<AdminUser | null> {
  if (isDemoMode()) return { email: 'demo-admin@megatarps.com', userId: null, demo: true }
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email && isAdminEmail(user.email)) return { email: user.email, userId: user.id, demo: false }
  } catch (e) {
    console.error('getAdmin failed', e)
  }
  return null
}

/** Use in every admin server component and server action. Redirects non-admins to login. */
export async function requireAdmin(redirectTo = '/admin'): Promise<AdminUser> {
  const admin = await getAdmin()
  if (!admin) redirect(`/account/login?redirect=${encodeURIComponent(redirectTo)}`)
  return admin
}

/**
 * Service-role client that never picks up the visitor's session cookies
 * (so it always runs as service_role and bypasses RLS). Server-only.
 */
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || /placeholder/i.test(key)) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
