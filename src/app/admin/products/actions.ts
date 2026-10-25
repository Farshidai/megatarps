'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { checkAdmin } from './_lib/admin-auth'

export interface ProductPatch {
  sku: string
  cost_price_cents?: number
  retail_price_cents?: number
  in_stock?: boolean
  active?: boolean
}

export interface SaveResult {
  ok: boolean
  demo?: boolean
  saved: number
  message: string
  errors: string[]
}

const MAX_CENTS = 10_000_000 // $100k per unit — anything above is a typo
const isCents = (v: unknown) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= MAX_CENTS

/** Bulk-update prices / stock / active by SKU. Re-checks admin auth on every call. */
export async function saveProductPrices(patches: ProductPatch[]): Promise<SaveResult> {
  const auth = await checkAdmin()
  if (!auth.ok) return { ok: false, saved: 0, message: auth.reason, errors: [] }
  if (!Array.isArray(patches) || patches.length === 0) return { ok: false, saved: 0, message: 'Nothing to save.', errors: [] }
  if (patches.length > 2000) return { ok: false, saved: 0, message: 'Too many rows in one save (max 2,000).', errors: [] }

  const errors: string[] = []
  const clean: Array<{ sku: string; patch: Record<string, number | boolean> }> = []
  for (const p of patches) {
    if (typeof p?.sku !== 'string' || !p.sku.trim() || p.sku.length > 64) { errors.push('Skipped a row with an invalid SKU'); continue }
    const patch: Record<string, number | boolean> = {}
    if (p.cost_price_cents !== undefined) {
      if (!isCents(p.cost_price_cents)) { errors.push(`${p.sku}: invalid cost`); continue }
      patch.cost_price_cents = p.cost_price_cents
    }
    if (p.retail_price_cents !== undefined) {
      if (!isCents(p.retail_price_cents)) { errors.push(`${p.sku}: invalid retail`); continue }
      patch.retail_price_cents = p.retail_price_cents
    }
    if (p.in_stock !== undefined) {
      if (typeof p.in_stock !== 'boolean') { errors.push(`${p.sku}: invalid in_stock`); continue }
      patch.in_stock = p.in_stock
    }
    if (p.active !== undefined) {
      if (typeof p.active !== 'boolean') { errors.push(`${p.sku}: invalid active`); continue }
      patch.active = p.active
    }
    if (Object.keys(patch).length) clean.push({ sku: p.sku.trim(), patch })
  }

  if (auth.demo) {
    return {
      ok: false,
      demo: true,
      saved: 0,
      message: `Demo mode: ${clean.length} change${clean.length === 1 ? '' : 's'} validated but NOT saved (no database connected).`,
      errors,
    }
  }

  const supabase = await createAdminClient()
  let saved = 0
  for (let i = 0; i < clean.length; i += 25) {
    const chunk = clean.slice(i, i + 25)
    const results = await Promise.all(
      chunk.map(({ sku, patch }) => supabase.from('products').update(patch).eq('xpose_sku', sku).select('xpose_sku')),
    )
    results.forEach((r, j) => {
      if (r.error) errors.push(`${chunk[j].sku}: ${r.error.message}`)
      else if (!r.data?.length) errors.push(`${chunk[j].sku}: SKU not found`)
      else saved++
    })
  }

  revalidatePath('/admin/products')
  revalidatePath('/products', 'layout')
  revalidatePath('/product/[slug]', 'page')
  revalidatePath('/')

  return {
    ok: errors.length === 0,
    saved,
    message: `Saved ${saved} product${saved === 1 ? '' : 's'}${errors.length ? `, ${errors.length} problem${errors.length === 1 ? '' : 's'}` : ''}.`,
    errors,
  }
}
