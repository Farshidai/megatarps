'use server'

// Admin CRUD for a client's contract prices on /admin/accounts/[id] (Team F).
// Every action re-checks requireAdmin(): server actions are public POST endpoints.
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin'
import { isDemoMode } from '@/lib/demo'
import {
  adminDeleteContractPrice,
  adminProductsByIdsOrSkus,
  adminUpdateContractPrice,
  adminUpsertContractPrices,
} from '@/lib/contract-prices'
import { isUuid, parseMinQty, parsePriceCents, parseValidUntil } from '@/lib/contract-prices-input'
import { formatPrice } from '@/lib/utils'

export type ContractActionResult = { ok: true; message: string; demo?: boolean } | { ok: false; error: string }

const DEMO_NOTE = 'Not saved in demo.'

function validIds(...ids: unknown[]): boolean {
  if (isDemoMode()) return ids.every((x) => typeof x === 'string' && x.length > 0 && x.length < 80)
  return ids.every(isUuid)
}

function done(contractorId: string, message: string): ContractActionResult {
  revalidatePath(`/admin/accounts/${contractorId}`)
  revalidatePath('/account')
  return { ok: true, message }
}

export async function addContractPrice(input: { contractorId: string; sku: string; price: string; minQuantity: string; validUntil: string; note?: string }): Promise<ContractActionResult> {
  const admin = await requireAdmin()
  const contractorId = String(input?.contractorId ?? '')
  if (!validIds(contractorId)) return { ok: false, error: 'Unknown account' }
  const sku = String(input.sku ?? '').trim().slice(0, 64)
  if (!sku) return { ok: false, error: 'Enter a SKU' }
  let price: number, minQty: number, validUntil: string | null
  try {
    price = parsePriceCents(input.price, { fromDollars: true })
    minQty = parseMinQty(input.minQuantity)
    validUntil = parseValidUntil(input.validUntil)
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const [product] = await adminProductsByIdsOrSkus({ skus: [sku] })
  if (!product) return { ok: false, error: `No catalog product with SKU “${sku}”` }
  const label = `${product.xpose_sku} at ${formatPrice(price)}${minQty > 1 ? ` for ${minQty}+` : ''}`
  if (admin.demo || isDemoMode()) return { ok: true, demo: true, message: `Demo mode: would add ${label}. ${DEMO_NOTE}` }
  try {
    await adminUpsertContractPrices([{
      contractor_id: contractorId,
      product_id: product.id,
      sku: product.xpose_sku,
      unit_price_cents: price,
      min_quantity: minQty,
      valid_until: validUntil,
      source_quote_id: null,
      note: String(input.note ?? '').trim().slice(0, 500) || 'Added by hand',
      created_by: admin.email,
    }])
  } catch (e) {
    console.error('addContractPrice', e)
    return { ok: false, error: 'Could not save. Is migration 0008_contract_prices.sql applied?' }
  }
  return done(contractorId, `Saved ${label}`)
}

export async function updateContractPrice(input: { contractorId: string; id: string; price: string; minQuantity: string; validUntil: string }): Promise<ContractActionResult> {
  const admin = await requireAdmin()
  const contractorId = String(input?.contractorId ?? '')
  const id = String(input?.id ?? '')
  if (!validIds(contractorId, id)) return { ok: false, error: 'Unknown contract price' }
  let price: number, minQty: number, validUntil: string | null
  try {
    price = parsePriceCents(input.price, { fromDollars: true })
    minQty = parseMinQty(input.minQuantity)
    validUntil = parseValidUntil(input.validUntil)
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  if (admin.demo || isDemoMode()) return { ok: true, demo: true, message: `Demo mode: would update to ${formatPrice(price)}${minQty > 1 ? ` for ${minQty}+` : ''}. ${DEMO_NOTE}` }
  try {
    await adminUpdateContractPrice(id, contractorId, { unit_price_cents: price, min_quantity: minQty, valid_until: validUntil })
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  return done(contractorId, 'Contract price updated')
}

export async function deleteContractPrice(input: { contractorId: string; id: string }): Promise<ContractActionResult> {
  const admin = await requireAdmin()
  const contractorId = String(input?.contractorId ?? '')
  const id = String(input?.id ?? '')
  if (!validIds(contractorId, id)) return { ok: false, error: 'Unknown contract price' }
  if (admin.demo || isDemoMode()) return { ok: true, demo: true, message: `Demo mode: would delete this contract price. ${DEMO_NOTE}` }
  try {
    await adminDeleteContractPrice(id, contractorId)
  } catch (e) {
    console.error('deleteContractPrice', e)
    return { ok: false, error: 'Could not delete the contract price' }
  }
  return done(contractorId, 'Contract price deleted')
}
