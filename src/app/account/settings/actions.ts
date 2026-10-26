'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo'
import { DEMO_ACCOUNT_COOKIE } from '@/lib/accounts'
import {
  BUSINESS_TYPES, VOLUME_OPTIONS, isStateCode, normalizeWebsite,
  type JobsiteAddress,
} from '@/lib/wholesale'

export interface ActionState {
  ok: boolean
  message: string
  errors?: Record<string, string>
}

const str = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? '').trim().slice(0, max)

/** DEMO MODE only: switch the previewed account state (approved | pending | rejected | guest). */
export async function setDemoAccount(formData: FormData) {
  if (!isDemoMode()) return
  const status = String(formData.get('status') ?? '')
  const jar = await cookies()
  if (['approved', 'pending', 'rejected'].includes(status)) {
    jar.set(DEMO_ACCOUNT_COOKIE, status, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 })
  } else {
    jar.delete(DEMO_ACCOUNT_COOKIE)
  }
  const back = String(formData.get('back') ?? '/account')
  // same-origin paths only ("/\\evil.com" parses as //evil.com in browsers)
  const base = 'http://internal.invalid'
  let dest = '/account'
  try {
    const u = new URL(back, base)
    if (back.startsWith('/') && u.origin === base) dest = u.pathname + u.search + u.hash
  } catch {}
  redirect(dest)
}

async function signedIn() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

/**
 * Updates the safe, self-service company fields only. Status, discount, terms,
 * credit limit and tax exemption are never read from the form (and the DB
 * trigger from migration 0003 rejects them for non-service roles anyway).
 */
export async function updateCompanyProfile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const fields = {
    contact_name: str(fd, 'contact_name', 120),
    company_name: str(fd, 'company_name', 160),
    phone: str(fd, 'phone', 30),
    business_type: str(fd, 'business_type', 80),
    service_area: str(fd, 'service_area', 160),
    website: str(fd, 'website', 200),
    years_in_business: str(fd, 'years_in_business', 3),
    est_monthly_volume: str(fd, 'est_monthly_volume', 40),
  }
  const errors: Record<string, string> = {}
  if (fields.contact_name.length < 2) errors.contact_name = 'Enter a contact name.'
  if (fields.company_name.length < 2) errors.company_name = 'Enter a company name.'
  if (fields.phone.replace(/\D/g, '').length < 10) errors.phone = 'Enter a 10-digit phone number.'
  if (!(BUSINESS_TYPES as readonly string[]).includes(fields.business_type)) errors.business_type = 'Choose a business type.'
  if (fields.est_monthly_volume && !(VOLUME_OPTIONS as readonly string[]).includes(fields.est_monthly_volume)) errors.est_monthly_volume = 'Choose an estimate.'
  if (fields.years_in_business && !/^\d{1,3}$/.test(fields.years_in_business)) errors.years_in_business = 'Whole number of years.'
  if (fields.website && !/^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(fields.website)) errors.website = 'Enter a valid website.'
  if (Object.keys(errors).length) return { ok: false, message: 'Please fix the highlighted fields.', errors }

  if (isDemoMode()) return { ok: true, message: 'Demo mode: looks good, but changes are not saved.' }

  const { supabase, user } = await signedIn()
  if (!user) return { ok: false, message: 'Your session expired. Please sign in again.' }
  const { error } = await supabase
    .from('contractor_profiles')
    .update({
      ...fields,
      website: normalizeWebsite(fields.website),
      years_in_business: fields.years_in_business ? Number(fields.years_in_business) : null,
      est_monthly_volume: fields.est_monthly_volume || null,
    })
    .eq('id', user.id)
  if (error) {
    console.error('updateCompanyProfile', error)
    return { ok: false, message: 'Could not save your changes. Please try again.' }
  }
  revalidatePath('/account', 'layout')
  return { ok: true, message: 'Company profile saved.' }
}

async function readJobsites(): Promise<{ list: JobsiteAddress[]; error?: string; supabase?: Awaited<ReturnType<typeof createClient>>; userId?: string }> {
  const { supabase, user } = await signedIn()
  if (!user) return { list: [], error: 'Your session expired. Please sign in again.' }
  const { data, error } = await supabase.from('contractor_profiles').select('jobsite_addresses').eq('id', user.id).maybeSingle()
  if (error || !data) return { list: [], error: 'Complete your wholesale application first.' }
  return { list: Array.isArray(data.jobsite_addresses) ? (data.jobsite_addresses as JobsiteAddress[]) : [], supabase, userId: user.id }
}

export async function addJobsite(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const site = {
    label: str(fd, 'label', 80),
    line1: str(fd, 'line1', 160),
    line2: str(fd, 'line2', 160),
    city: str(fd, 'city', 80),
    state: str(fd, 'state', 2).toUpperCase(),
    zip: str(fd, 'zip', 10),
    notes: str(fd, 'notes', 300),
  }
  const errors: Record<string, string> = {}
  if (!site.label) errors.label = 'Name this jobsite.'
  if (site.line1.length < 3) errors.line1 = 'Enter a street address.'
  if (site.city.length < 2) errors.city = 'Enter a city.'
  if (!isStateCode(site.state)) errors.state = 'Choose a state.'
  if (!/^\d{5}(-\d{4})?$/.test(site.zip)) errors.zip = 'ZIP like 64081.'
  if (Object.keys(errors).length) return { ok: false, message: 'Please fix the highlighted fields.', errors }

  if (isDemoMode()) return { ok: true, message: 'Demo mode: address validated, but not saved.' }

  const { list, error, supabase, userId } = await readJobsites()
  if (error || !supabase || !userId) return { ok: false, message: error ?? 'Not signed in.' }
  if (list.length >= 25) return { ok: false, message: 'You can save up to 25 jobsites. Remove one first.' }
  const entry: JobsiteAddress = {
    id: crypto.randomUUID(),
    label: site.label, line1: site.line1, city: site.city, state: site.state, zip: site.zip,
    ...(site.line2 ? { line2: site.line2 } : {}),
    ...(site.notes ? { notes: site.notes } : {}),
  }
  const { error: upErr } = await supabase.from('contractor_profiles').update({ jobsite_addresses: [...list, entry] }).eq('id', userId)
  if (upErr) return { ok: false, message: 'Could not save the address.' }
  revalidatePath('/account/settings')
  return { ok: true, message: `Saved “${site.label}”.` }
}

export async function removeJobsite(fd: FormData): Promise<void> {
  if (isDemoMode()) return
  const id = String(fd.get('id') ?? '')
  const { list, supabase, userId } = await readJobsites()
  if (!supabase || !userId) return
  await supabase.from('contractor_profiles').update({ jobsite_addresses: list.filter((j) => j.id !== id) }).eq('id', userId)
  revalidatePath('/account/settings')
}
