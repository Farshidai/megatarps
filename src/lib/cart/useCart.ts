'use client'

// useCart(): the cart hook used by every cart surface.
// It reads a module-level external store (./store) via useSyncExternalStore, so it works
// anywhere in the tree without a wrapping provider, renders the empty cart on the server
// and during hydration, then switches to localStorage — no hydration mismatch — and
// stays in sync across tabs through the `storage` event.
import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { CartItem } from './types'
import {
  addItems,
  clearCart,
  drawerStore,
  getServerSnapshot,
  getSnapshot,
  removeItem,
  removeWhere,
  setQuantity,
  subscribe,
  type NewCartItem,
} from './store'

const noopSubscribe = () => () => {}

/** false during SSR and the hydration render, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false)
}

export function useCart() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const isOpen = useSyncExternalStore(drawerStore.subscribe, drawerStore.get, drawerStore.getServer)
  const hydrated = useHydrated()

  const openDrawer = useCallback(() => drawerStore.set(true), [])
  const closeDrawer = useCallback(() => drawerStore.set(false), [])

  return useMemo(() => {
    const items: CartItem[] = state.items
    return {
      items,
      hydrated,
      /** total units across all lines */
      count: items.reduce((s, i) => s + i.quantity, 0),
      lineCount: items.length,
      pricedItems: items.filter((i) => !i.quote_only),
      quoteItems: items.filter((i) => i.quote_only),
      addItem: (item: NewCartItem) => addItems([item]),
      addItems,
      setQuantity,
      removeItem,
      removeWhere,
      clear: clearCart,
      isOpen,
      openDrawer,
      closeDrawer,
    }
  }, [state, hydrated, isOpen, openDrawer, closeDrawer])
}

export type UseCart = ReturnType<typeof useCart>
