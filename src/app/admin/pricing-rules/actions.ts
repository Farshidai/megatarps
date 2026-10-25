'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type { PricingRule } from '@/lib/pricing'
import { checkAdmin } from '../products/_lib/admin-auth'
import { validateRule } from './_lib/rules'

export interface RuleResult {
  ok: boolean
  demo?: boolean
  message: string
  rule?: PricingRule
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function revalidate() {
  revalidatePath('/admin/pricing-rules')
  revalidatePath('/products', 'layout')
  revalidatePath('/product/[slug]', 'page')
  revalidatePath('/')
}

const DEMO_MSG = 'Demo mode: change applied on this page only and NOT saved (no database connected).'

export async function createRule(input: unknown): Promise<RuleResult> {
  const auth = await checkAdmin()
  if (!auth.ok) return { ok: false, message: auth.reason }
  const v = validateRule(input)
  if (!v.ok) return { ok: false, message: v.error }
  if (auth.demo) return { ok: true, demo: true, message: DEMO_MSG, rule: { ...v.rule, id: `demo-${Date.now()}` } }
  const supabase = await createAdminClient()
  const { data, error } = await supabase.from('pricing_rules').insert(v.rule).select('*').single()
  if (error) return { ok: false, message: error.message }
  revalidate()
  return { ok: true, message: 'Rule added.', rule: data as PricingRule }
}

export async function updateRule(id: string, input: unknown): Promise<RuleResult> {
  const auth = await checkAdmin()
  if (!auth.ok) return { ok: false, message: auth.reason }
  const v = validateRule(input)
  if (!v.ok) return { ok: false, message: v.error }
  if (auth.demo) return { ok: true, demo: true, message: DEMO_MSG, rule: { ...v.rule, id } }
  if (!UUID.test(id)) return { ok: false, message: 'Invalid rule id.' }
  const supabase = await createAdminClient()
  const { data, error } = await supabase.from('pricing_rules').update(v.rule).eq('id', id).select('*').single()
  if (error) return { ok: false, message: error.message }
  revalidate()
  return { ok: true, message: 'Rule saved.', rule: data as PricingRule }
}

export async function deleteRule(id: string): Promise<RuleResult> {
  const auth = await checkAdmin()
  if (!auth.ok) return { ok: false, message: auth.reason }
  if (auth.demo) return { ok: true, demo: true, message: DEMO_MSG }
  if (!UUID.test(id)) return { ok: false, message: 'Invalid rule id.' }
  const supabase = await createAdminClient()
  const { error } = await supabase.from('pricing_rules').delete().eq('id', id)
  if (error) return { ok: false, message: error.message }
  revalidate()
  return { ok: true, message: 'Rule deleted.' }
}
