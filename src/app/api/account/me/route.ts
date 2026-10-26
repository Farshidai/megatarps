// GET /api/account/me — who is signed in, for the navbar (display only, no pricing data).
import { getCurrentAccount } from '@/lib/accounts'

export async function GET() {
  const { user, profile } = await getCurrentAccount()
  const name = profile?.contact_name?.trim().split(/\s+/)[0] || profile?.company_name || user?.email?.split('@')[0] || null
  return Response.json(
    { signedIn: !!user, name: user ? name : null, status: user ? profile?.account_status ?? 'none' : 'guest' },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
