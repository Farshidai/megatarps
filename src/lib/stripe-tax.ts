// Stripe Tax for cart checkout (server-only). OFF unless STRIPE_AUTOMATIC_TAX=1.
//  • ON: Checkout Sessions get automatic_tax: { enabled: true } (Stripe calculates sales tax from
//    the shipping address; needs Stripe Tax activated + origin address + registrations in the
//    Stripe Dashboard).
//  • Approved accounts with tax_exempt = true: checkout runs with a Stripe Customer whose
//    tax_exempt = 'exempt', so Stripe Tax charges 0 (Stripe shows "Tax exempt" on the receipt).
// Quotes keep the tax line the admin enters on the quote (no automatic tax there, to avoid
// charging tax twice).
import type Stripe from 'stripe'
import type { AccountPricing } from '@/lib/accounts'

type SessionCreateParams = NonNullable<Parameters<Stripe['checkout']['sessions']['create']>[0]>

export function automaticTaxEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.STRIPE_AUTOMATIC_TAX === '1'
}

/** Pure: which tax mode applies to this buyer. */
export function taxMode(enabled: boolean, account: Pick<AccountPricing, 'status' | 'taxExempt' | 'email'>): 'off' | 'auto' | 'exempt' {
  if (!enabled) return 'off'
  return account.status === 'approved' && account.taxExempt && account.email ? 'exempt' : 'auto'
}

/** Extra Checkout Session params for tax. May create / update a Stripe Customer for exempt accounts. */
export async function taxSessionParams(
  stripe: Stripe,
  account: Pick<AccountPricing, 'status' | 'taxExempt' | 'email' | 'userId'>,
): Promise<Partial<SessionCreateParams>> {
  const mode = taxMode(automaticTaxEnabled(), account)
  if (mode === 'off') return {}
  if (mode === 'auto') return { automatic_tax: { enabled: true } }
  const email = account.email!
  const found = await stripe.customers.list({ email, limit: 1 })
  let customer = found.data[0]
  if (!customer) {
    customer = await stripe.customers.create({ email, tax_exempt: 'exempt', metadata: { contractor_id: account.userId ?? '' } })
  } else if (customer.tax_exempt !== 'exempt') {
    customer = await stripe.customers.update(customer.id, { tax_exempt: 'exempt' })
  }
  return {
    automatic_tax: { enabled: true },
    customer: customer.id,
    // automatic tax with an existing customer: save the address Checkout collects onto it
    customer_update: { shipping: 'auto', address: 'auto' },
  }
}
