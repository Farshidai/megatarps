// CONTRACT (shared by Cart team + Quotes team). Do not change shape without updating both.
// The cart lives in localStorage under CART_STORAGE_KEY. Prices are NEVER stored here —
// they are always recomputed from src/lib/pricing.ts (client for display, server for checkout).
export const CART_STORAGE_KEY = 'megatarps_cart_v1'

export interface CartItem {
  sku: string // products.xpose_sku
  product_id: string
  slug: string
  name: string
  image?: string
  quantity: number
  /** true when the product has no online price — this line must go through a quote */
  quote_only: boolean
}

export interface CartState {
  items: CartItem[]
  updated_at: string
}
