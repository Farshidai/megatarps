// CONTRACT (owned by Accounts team; consumed by Cart/Checkout + Quotes teams).
// Returns the signed-in buyer's wholesale standing. Only `approved` accounts get
// their wholesale discount, payment terms and tax exemption.
import { cache } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo'
import { demoApplicationByStatus } from '@/lib/accounts-demo'
import type { WholesaleProfile } from '@/lib/wholesale'
import type { ContractPrice } from '@/lib/pricing'
import { loadOwnContractPrices } from '@/lib/contract-prices'

export type AccountStatus = 'guest' | 'pending' | 'approved' | 'rejected'

export interface AccountPricing {
  status: AccountStatus
  /** extra % off for products WITHOUT pallet pricing (never stacks on pallet tiers / contract prices) — only when approved */
  wholesaleDiscountPercent: number
  taxExempt: boolean
  /** e.g. 'prepaid' | 'net30' */
  paymentTerms: string
  userId: string | null
  email: string | null
  /**
   * The signed-in APPROVED account's own active, unexpired contract prices (Team F).
   * Empty / undefined for guests and pending / rejected accounts. Pass to the pricing
   * engine as opts.contractPrices.
   */
  contractPrices?: ContractPrice[]
}

export const GUEST_PRICING: AccountPricing = {
  status: 'guest',
  wholesaleDiscountPercent: 0,
  taxExempt: false,
  paymentTerms: 'prepaid',
  userId: null,
  email: null,
}

/** Cookie QA can set in DEMO MODE to preview account states: approved | pending | rejected */
export const DEMO_ACCOUNT_COOKIE = 'demo_account'

export interface CurrentAccount {
  user: { id: string; email: string | null; created_at: string | null } | null
  profile: WholesaleProfile | null
  demo: boolean
}

/**
 * Signed-in user + their contractor profile (request-cached). In demo mode the
 * `demo_account` cookie selects a sample profile; no cookie = signed out.
 */
export const getCurrentAccount = cache(async (): Promise<CurrentAccount> => {
  if (isDemoMode()) {
    const status = (await cookies()).get(DEMO_ACCOUNT_COOKIE)?.value ?? ''
    const profile = ['approved', 'pending', 'rejected'].includes(status) ? demoApplicationByStatus(status) : null
    if (!profile) return { user: null, profile: null, demo: true }
    return { user: { id: profile.id, email: profile.email, created_at: profile.created_at }, profile, demo: true }
  }
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { user: null, profile: null, demo: false }
    const { data: profile } = await supabase
      .from('contractor_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    return {
      user: { id: user.id, email: user.email ?? null, created_at: user.created_at ?? null },
      profile: (profile as WholesaleProfile | null) ?? null,
      demo: false,
    }
  } catch (e) {
    console.error('getCurrentAccount failed', e)
    return { user: null, profile: null, demo: false }
  }
})

export function pricingFromProfile(
  user: { id: string; email: string | null } | null,
  profile: Pick<WholesaleProfile, 'account_status' | 'wholesale_discount_percent' | 'payment_terms' | 'tax_exempt'> | null,
): AccountPricing {
  if (!user) return GUEST_PRICING
  const base: AccountPricing = { ...GUEST_PRICING, userId: user.id, email: user.email }
  if (!profile) return base
  if (profile.account_status !== 'approved') return { ...base, status: profile.account_status }
  const pct = Number(profile.wholesale_discount_percent ?? 0)
  return {
    ...base,
    status: 'approved',
    wholesaleDiscountPercent: Number.isFinite(pct) ? Math.min(Math.max(pct, 0), 100) : 0,
    taxExempt: !!profile.tax_exempt,
    paymentTerms: profile.payment_terms ?? 'prepaid',
  }
}

/** Server-only. Safe to call from server components, route handlers and server actions. */
export async function getAccountPricing(): Promise<AccountPricing> {
  const { user, profile } = await getCurrentAccount()
  const pricing = pricingFromProfile(user, profile)
  if (pricing.status !== 'approved' || !pricing.userId) return pricing
  return { ...pricing, contractPrices: await loadOwnContractPrices(pricing.userId) }
}
