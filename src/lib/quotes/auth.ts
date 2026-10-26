// Who is looking at this quote? (server-only)
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo'
import { getAccountPricing } from '@/lib/accounts'
import { DEMO_CONTRACTOR_ID } from './demo-data'
import type { QuoteRecord } from './types'

export async function getSignedInUser(): Promise<{ id: string; email: string | null } | null> {
  if (isDemoMode()) return null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user ? { id: user.id, email: user.email ?? null } : null
  } catch {
    return null
  }
}

/**
 * Net terms: only an approved account with non-prepaid terms, and only on its own quote.
 * DEMO MODE: the sample account on the demo quote is treated as approved Net 30 so the
 * flow can be shown.
 */
export async function netTermsFor(q: QuoteRecord): Promise<{ allowed: boolean; terms: string }> {
  if (isDemoMode()) {
    return { allowed: q.contractor_id === DEMO_CONTRACTOR_ID, terms: 'net30' }
  }
  const acct = await getAccountPricing()
  const owns = !!acct.userId && acct.userId === q.contractor_id
  const allowed = acct.status === 'approved' && acct.paymentTerms !== 'prepaid' && owns
  return { allowed, terms: acct.paymentTerms }
}

/**
 * Net-terms credit for the quote's account: its credit_limit_cents and the total of its open
 * invoiced orders (payment_status 'invoiced'), read with the service role. Server-only.
 */
export async function creditPositionFor(contractorId: string | null): Promise<{ limitCents: number | null; openInvoicedCents: number }> {
  if (isDemoMode()) {
    // demo: the sample approved account (Net 30) has a $25,000 limit and no open invoices
    return { limitCents: contractorId === DEMO_CONTRACTOR_ID ? 2_500_000 : null, openInvoicedCents: 0 }
  }
  if (!contractorId) return { limitCents: null, openInvoicedCents: 0 }
  const sb = await createAdminClient()
  const [{ data: profile, error: pe }, { data: open, error: oe }] = await Promise.all([
    sb.from('contractor_profiles').select('credit_limit_cents').eq('id', contractorId).maybeSingle(),
    sb.from('orders').select('total_cents').eq('contractor_id', contractorId).eq('payment_status', 'invoiced').neq('status', 'cancelled'),
  ])
  if (pe || oe) throw new Error((pe ?? oe)!.message)
  return {
    limitCents: (profile as { credit_limit_cents: number | null } | null)?.credit_limit_cents ?? null,
    openInvoicedCents: ((open ?? []) as { total_cents: number | null }[]).reduce((s, o) => s + (o.total_cents ?? 0), 0),
  }
}

export function termsLabel(terms: string) {
  const m = /^net\s*(\d+)$/i.exec(terms.replace('_', ''))
  return m ? `Net ${m[1]}` : terms
}
