// Who is looking at this quote? (server-only)
import { createClient } from '@/lib/supabase/server'
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

export function termsLabel(terms: string) {
  const m = /^net\s*(\d+)$/i.exec(terms.replace('_', ''))
  return m ? `Net ${m[1]}` : terms
}
