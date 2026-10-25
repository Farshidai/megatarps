'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo'
import { currentAdminEmail } from './auth'

async function guard() {
  if (isDemoMode()) throw new Error('Demo mode: freight settings are read-only.')
  if (!(await currentAdminEmail())) throw new Error('Unauthorized')
  return createAdminClient()
}

const dollarsToCents = (v: FormDataEntryValue | null): number | null => {
  const s = String(v ?? '').trim().replace(/[$,]/g, '')
  if (s === '') return null
  const n = Number(s)
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) throw new Error(`Invalid amount: ${s}`)
  return Math.round(n * 100)
}
const num = (v: FormDataEntryValue | null, { allowEmpty = false } = {}): number | null => {
  const s = String(v ?? '').trim()
  if (s === '') {
    if (allowEmpty) return null
    throw new Error('Missing number')
  }
  const n = Number(s)
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid number: ${s}`)
  return n
}

export async function saveFreightSettings(formData: FormData) {
  const supabase = await guard()
  const parcelMax = num(formData.get('parcel_max_order_lb'))!
  if (parcelMax <= 0) throw new Error('Parcel limit must be above 0 lb')
  const { error } = await supabase.from('freight_settings').upsert({
    id: 1,
    parcel_max_order_lb: parcelMax,
    free_freight_threshold_cents: dollarsToCents(formData.get('free_freight_threshold')) || null,
    ltl_checkout_enabled: formData.get('ltl_checkout_enabled') === 'on',
    handling_cents: dollarsToCents(formData.get('handling')) ?? 0,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/freight')
}

export async function saveFreightRate(formData: FormData) {
  const supabase = await guard()
  const id = String(formData.get('id') ?? '')
  const method = formData.get('method') === 'ltl' ? 'ltl' : 'parcel'
  const min_lb = num(formData.get('min_lb'))!
  const max_lb = num(formData.get('max_lb'), { allowEmpty: true })
  if (max_lb != null && max_lb <= min_lb) throw new Error('Max lb must be greater than min lb')
  const row = {
    method,
    min_lb,
    max_lb,
    base_cents: dollarsToCents(formData.get('base')) ?? 0,
    per_lb_cents: dollarsToCents(formData.get('per_lb')) ?? 0,
    active: formData.get('active') === 'on',
    sort: Math.round(num(formData.get('sort'), { allowEmpty: true }) ?? 0),
    updated_at: new Date().toISOString(),
  }
  const { error } = id ? await supabase.from('freight_rates').update(row).eq('id', id) : await supabase.from('freight_rates').insert(row)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/freight')
}

export async function deleteFreightRate(formData: FormData) {
  const supabase = await guard()
  const id = String(formData.get('id') ?? '')
  if (!id) throw new Error('Missing id')
  const { error } = await supabase.from('freight_rates').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/freight')
}
