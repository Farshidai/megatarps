'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin, createServiceClient } from '@/lib/admin'
import { sendEmail } from '@/lib/email/send'
import { applicantApprovedEmail, applicantRejectedEmail } from '@/lib/email/account-emails'
import type { PaymentTerms, WholesaleProfile } from '@/lib/wholesale'

const TERMS: PaymentTerms[] = ['prepaid', 'net15', 'net30']

function back(id: string, params: Record<string, string>): never {
  redirect(`/admin/accounts/${encodeURIComponent(id)}?${new URLSearchParams(params).toString()}`)
}

export async function approveAccount(fd: FormData) {
  const id = String(fd.get('id') ?? '')
  const admin = await requireAdmin(`/admin/accounts/${id}`)

  const discount = Number(String(fd.get('wholesale_discount_percent') ?? '0').trim() || '0')
  const terms = String(fd.get('payment_terms') ?? 'prepaid') as PaymentTerms
  const creditRaw = String(fd.get('credit_limit') ?? '').replace(/[$,\s]/g, '')
  const credit = creditRaw === '' ? null : Number(creditRaw)
  const taxExempt = fd.get('tax_exempt') === 'on'

  if (!Number.isFinite(discount) || discount < 0 || discount > 50) back(id, { error: 'Discount must be between 0 and 50%.' })
  if (!TERMS.includes(terms)) back(id, { error: 'Choose valid payment terms.' })
  if (credit !== null && (!Number.isFinite(credit) || credit < 0 || credit > 10_000_000)) back(id, { error: 'Enter a valid credit limit in dollars.' })
  if (terms !== 'prepaid' && !credit) back(id, { error: 'Net terms need a credit limit.' })

  if (admin.demo) back(id, { demo: 'approved' })

  const sb = createServiceClient()
  const { data, error } = await sb
    .from('contractor_profiles')
    .update({
      account_status: 'approved',
      wholesale_discount_percent: Math.round(discount * 100) / 100,
      payment_terms: terms,
      credit_limit_cents: credit === null ? null : Math.round(credit * 100),
      tax_exempt: taxExempt,
      approved_at: new Date().toISOString(),
      approved_by: admin.email,
      rejection_reason: null,
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error || !data) {
    console.error('approveAccount', error)
    back(id, { error: 'Could not approve the account.' })
  }
  const p = data as WholesaleProfile
  await sendEmail({ to: p.email, ...applicantApprovedEmail(p) })
  revalidatePath('/admin/accounts')
  revalidatePath('/admin')
  back(id, { saved: 'approved' })
}

export async function rejectAccount(fd: FormData) {
  const id = String(fd.get('id') ?? '')
  const admin = await requireAdmin(`/admin/accounts/${id}`)
  const reason = String(fd.get('rejection_reason') ?? '').trim().slice(0, 1000)
  if (reason.length < 5) back(id, { error: 'Give the applicant a reason (at least 5 characters).' })

  if (admin.demo) back(id, { demo: 'rejected' })

  const sb = createServiceClient()
  const { data, error } = await sb
    .from('contractor_profiles')
    .update({
      account_status: 'rejected',
      rejection_reason: reason,
      wholesale_discount_percent: 0,
      payment_terms: 'prepaid',
      credit_limit_cents: null,
      tax_exempt: false,
      approved_at: null, // approved_at is only set for approvals; approved_by records the reviewer
      approved_by: admin.email,
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error || !data) {
    console.error('rejectAccount', error)
    back(id, { error: 'Could not reject the account.' })
  }
  const p = data as WholesaleProfile
  await sendEmail({ to: p.email, ...applicantRejectedEmail(p) })
  revalidatePath('/admin/accounts')
  revalidatePath('/admin')
  back(id, { saved: 'rejected' })
}
