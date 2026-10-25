// Client-side cart store backed by localStorage (CART_STORAGE_KEY).
// Implemented as an external store for React's useSyncExternalStore, which gives us:
//  - SSR safety: the server snapshot is always the empty cart, and React re-renders
//    with the real localStorage value after hydration (no hydration mismatch).
//  - Cross-tab sync: the browser `storage` event notifies every subscriber.
// Prices are never stored here; see src/lib/cart/types.ts.
import { CART_STORAGE_KEY, type CartItem, type CartState } from './types'
import { MAX_CART_LINES, MAX_LINE_QUANTITY } from './constants'

export const EMPTY_CART: CartState = Object.freeze({ items: [], updated_at: '' }) as CartState

type Listener = () => void
const listeners = new Set<Listener>()

let cachedRaw: string | null | undefined
let cachedState: CartState = EMPTY_CART

export function clampQuantity(q: unknown): number {
  const n = Math.floor(Number(q))
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(n, MAX_LINE_QUANTITY)
}

function sanitize(value: unknown): CartState {
  if (!value || typeof value !== 'object') return EMPTY_CART
  const v = value as Partial<CartState>
  if (!Array.isArray(v.items)) return EMPTY_CART
  const items: CartItem[] = []
  for (const raw of v.items) {
    if (!raw || typeof raw !== 'object') continue
    const i = raw as Partial<CartItem>
    if (typeof i.sku !== 'string' || !i.sku) continue
    items.push({
      sku: i.sku,
      product_id: String(i.product_id ?? ''),
      slug: String(i.slug ?? ''),
      name: String(i.name ?? i.sku),
      image: typeof i.image === 'string' ? i.image : undefined,
      quantity: clampQuantity(i.quantity),
      quote_only: Boolean(i.quote_only),
    })
  }
  return { items: items.slice(0, MAX_CART_LINES), updated_at: String(v.updated_at ?? '') }
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(CART_STORAGE_KEY)
  } catch {
    return null
  }
}

export function getSnapshot(): CartState {
  const raw = readRaw()
  if (raw === cachedRaw) return cachedState
  cachedRaw = raw
  try {
    cachedState = raw ? sanitize(JSON.parse(raw)) : EMPTY_CART
  } catch {
    cachedState = EMPTY_CART
  }
  return cachedState
}

export function getServerSnapshot(): CartState {
  return EMPTY_CART
}

function emit() {
  for (const l of listeners) l()
}

function onStorage(e: StorageEvent) {
  if (e.key === null || e.key === CART_STORAGE_KEY) emit()
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  if (listeners.size === 1 && typeof window !== 'undefined') window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && typeof window !== 'undefined') window.removeEventListener('storage', onStorage)
  }
}

function write(items: CartItem[]) {
  const state: CartState = { items: items.slice(0, MAX_CART_LINES), updated_at: new Date().toISOString() }
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage full / disabled: keep going in memory for this page view
    cachedRaw = JSON.stringify(state)
    cachedState = state
  }
  emit()
}

export type NewCartItem = Omit<CartItem, 'quantity'> & { quantity?: number }

/** Adds lines, merging quantities into existing lines with the same SKU. */
export function addItems(newItems: NewCartItem[]) {
  const items = [...getSnapshot().items]
  for (const n of newItems) {
    const qty = clampQuantity(n.quantity ?? 1)
    const idx = items.findIndex((i) => i.sku === n.sku)
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...n, quantity: clampQuantity(items[idx].quantity + qty) }
    } else {
      items.push({ ...n, quantity: qty })
    }
  }
  write(items)
}

export function setQuantity(sku: string, quantity: number) {
  write(getSnapshot().items.map((i) => (i.sku === sku ? { ...i, quantity: clampQuantity(quantity) } : i)))
}

export function removeItem(sku: string) {
  write(getSnapshot().items.filter((i) => i.sku !== sku))
}

export function removeWhere(pred: (i: CartItem) => boolean) {
  write(getSnapshot().items.filter((i) => !pred(i)))
}

export function clearCart() {
  write([])
}

// ---- drawer open state (same-tab only) ----
let drawerOpen = false
const drawerListeners = new Set<Listener>()
export const drawerStore = {
  subscribe(l: Listener) {
    drawerListeners.add(l)
    return () => drawerListeners.delete(l)
  },
  get: () => drawerOpen,
  getServer: () => false,
  set(open: boolean) {
    if (drawerOpen === open) return
    drawerOpen = open
    for (const l of drawerListeners) l()
  },
}
