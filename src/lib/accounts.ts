// CONTRACT (owned by Accounts team; consumed by Cart/Checkout + Quotes teams).
// Returns the signed-in buyer's wholesale standing. Stub returns guest defaults;
// the Accounts team replaces the body (reading contractor_profiles) without
// changing the exported signature.
export type AccountStatus = 'guest' | 'pending' | 'approved' | 'rejected'

export interface AccountPricing {
  status: AccountStatus
  /** extra % off on top of volume tiers — only when status === 'approved' */
  wholesaleDiscountPercent: number
  taxExempt: boolean
  /** e.g. 'prepaid' | 'net30' */
  paymentTerms: string
  userId: string | null
  email: string | null
}

export const GUEST_PRICING: AccountPricing = {
  status: 'guest',
  wholesaleDiscountPercent: 0,
  taxExempt: false,
  paymentTerms: 'prepaid',
  userId: null,
  email: null,
}

/** Server-only. Safe to call from server components, route handlers and server actions. */
export async function getAccountPricing(): Promise<AccountPricing> {
  return GUEST_PRICING
}
