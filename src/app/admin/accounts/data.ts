// Admin data access for wholesale applications (service role; demo data in DEMO MODE).
import { isDemoMode } from '@/lib/demo'
import { createServiceClient } from '@/lib/admin'
import { DEMO_APPLICATIONS, demoApplicationById } from '@/lib/accounts-demo'
import { CERT_BUCKET } from '@/lib/certificates'
import type { ApplicationStatus, WholesaleProfile } from '@/lib/wholesale'

export type StatusFilter = 'all' | ApplicationStatus
export type StatusCounts = Record<StatusFilter, number>

export async function getStatusCounts(): Promise<StatusCounts> {
  const counts: StatusCounts = { all: 0, pending: 0, approved: 0, rejected: 0 }
  if (isDemoMode()) {
    for (const a of DEMO_APPLICATIONS) { counts[a.account_status]++; counts.all++ }
    return counts
  }
  try {
    const sb = createServiceClient()
    const res = await Promise.all(
      (['pending', 'approved', 'rejected'] as const).map((s) =>
        sb.from('contractor_profiles').select('id', { count: 'exact', head: true }).eq('account_status', s),
      ),
    )
    ;(['pending', 'approved', 'rejected'] as const).forEach((s, i) => { counts[s] = res[i].count ?? 0 })
    counts.all = counts.pending + counts.approved + counts.rejected
  } catch (e) {
    console.error('getStatusCounts', e)
  }
  return counts
}

export async function getPendingCount(): Promise<number> {
  return (await getStatusCounts()).pending
}

export async function listApplications(status: StatusFilter, q: string): Promise<WholesaleProfile[]> {
  const needle = q.trim().toLowerCase()
  if (isDemoMode()) {
    return DEMO_APPLICATIONS
      .filter((a) => status === 'all' || a.account_status === status)
      .filter((a) => !needle || [a.company_name, a.contact_name, a.email].some((x) => x.toLowerCase().includes(needle)))
      .sort((a, b) => (a.account_status === 'pending' ? -1 : 0) - (b.account_status === 'pending' ? -1 : 0) || b.created_at.localeCompare(a.created_at))
  }
  try {
    const sb = createServiceClient()
    let query = sb.from('contractor_profiles').select('*').order('created_at', { ascending: false }).limit(200)
    if (status !== 'all') query = query.eq('account_status', status)
    if (needle) {
      const safe = needle.replace(/[%_,()]/g, ' ')
      query = query.or(`company_name.ilike.%${safe}%,contact_name.ilike.%${safe}%,email.ilike.%${safe}%`)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as WholesaleProfile[]
  } catch (e) {
    console.error('listApplications', e)
    return []
  }
}

export async function getApplication(id: string): Promise<WholesaleProfile | null> {
  if (isDemoMode()) return demoApplicationById(id)
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  try {
    const { data } = await createServiceClient().from('contractor_profiles').select('*').eq('id', id).maybeSingle()
    return (data as WholesaleProfile | null) ?? null
  } catch (e) {
    console.error('getApplication', e)
    return null
  }
}

/** Short-lived (5 min) signed URL to view a private certificate. */
export async function certificateSignedUrl(path: string | null): Promise<string | null> {
  if (!path || isDemoMode()) return null
  try {
    const { data, error } = await createServiceClient().storage.from(CERT_BUCKET).createSignedUrl(path, 300)
    if (error) throw error
    return data?.signedUrl ?? null
  } catch (e) {
    console.error('certificateSignedUrl', e)
    return null
  }
}
