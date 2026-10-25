import type { Metadata } from 'next'
import Link from 'next/link'
import Stripe from 'stripe'
import { CheckCircle2, Clock, FileText } from 'lucide-react'
import { isDemoMode } from '@/lib/demo'
import { stripeConfigured } from '@/lib/cart/server'
import { formatPrice } from '@/lib/utils'
import { ClearPurchasedLines } from '@/components/cart/ClearPurchasedLines'

export const metadata: Metadata = { title: 'Order confirmed', robots: { index: false, follow: false } }

interface PageProps {
  searchParams: Promise<{ session_id?: string; demo?: string; order?: string }>
}

async function loadSession(id: string) {
  if (isDemoMode() || !stripeConfigured() || !/^cs_[A-Za-z0-9_]+$/.test(id)) return null
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    return await stripe.checkout.sessions.retrieve(id)
  } catch (e) {
    console.error('success page: could not retrieve session', e)
    return null
  }
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { session_id, demo, order } = await searchParams
  const session = session_id ? await loadSession(session_id) : null
  const isDemo = demo === '1'
  const orderNumber = session?.metadata?.order_number ?? (isDemo ? order : undefined)
  const pending = session && session.payment_status === 'unpaid' // ACH clears in a few business days
  const email = session?.customer_details?.email
  const confirmed = isDemo || !!session_id

  return (
    <div className="bg-slate-50 min-h-[70vh]">
      {confirmed && <ClearPurchasedLines />}
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center">
          {pending ? <Clock className="w-14 h-14 text-orange-500 mx-auto" aria-hidden /> : <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto" aria-hidden />}
          <h1 className="text-3xl font-black text-slate-900 mt-4">{pending ? 'Order received' : 'Thank you, your order is in!'}</h1>
          {orderNumber && (
            <p className="mt-2 text-slate-600">
              Order number <span className="font-mono font-bold text-slate-900" data-testid="order-number">{orderNumber}</span>
            </p>
          )}
          {session?.amount_total != null && <p className="mt-1 text-slate-500">Total charged {formatPrice(session.amount_total)}</p>}
          <p className="mt-4 text-slate-600">
            {pending
              ? 'Your bank payment (ACH) is processing. We start fulfilment as soon as it clears, usually within 4 business days.'
              : 'We are preparing your order now. You will get a confirmation email with tracking when it ships.'}
            {email && <> Confirmation goes to <strong>{email}</strong>.</>}
          </p>
          {isDemo && (
            <p className="mt-4 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
              Demo mode: no payment was taken. Stripe is not configured in this environment.
            </p>
          )}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/account/orders" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl">View my orders</Link>
            <Link href="/products" className="border border-slate-300 hover:border-slate-400 text-slate-800 font-semibold px-6 py-3 rounded-xl">Keep shopping</Link>
          </div>
          <p className="mt-6 text-sm text-slate-500 flex items-center justify-center gap-1.5">
            <FileText className="w-4 h-4" aria-hidden /> Quote items in your cart are still there. <Link href="/cart" className="text-orange-600 font-semibold hover:underline">Open cart</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
