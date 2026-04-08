export interface ProductLine {
  id: string
  name: string
  thickness_mil: number | null
  material: string
  weave_count: string | null
  weight_oz_per_sqyd: number | null
  grommet_type: string
  grommet_spacing_inches: number
  uv_resistant: boolean
  waterproof: boolean
  mildew_resistant: boolean
  fire_retardant: boolean
  reinforced_corners: boolean
  sewn_in_rope: boolean
  description: string | null
}

export interface Product {
  id: string
  xpose_sku: string
  mega_sku: string | null
  name: string
  slug: string
  product_line_id: string | null
  product_line?: ProductLine
  categories: string[]
  tarp_type: string
  thickness_mil: number | null
  width_ft: number
  length_ft: number
  coverage_sqft: number
  color: string
  color_hex: string | null
  retail_price_cents: number
  cost_price_cents?: number // admin only
  units_per_half_pallet: number | null
  units_per_full_pallet: number | null
  image_urls: string[]
  active: boolean
  in_stock: boolean
  created_at: string
  updated_at: string
}

export interface ContractorProfile {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string | null
  business_type: string | null
  service_area: string | null
  tax_exempt: boolean
  tax_id: string | null
  default_shipping_address: ShippingAddress | null
  jobsite_addresses: ShippingAddress[]
  preferred_products: string[]
  notes: string | null
  created_at: string
}

export interface ShippingAddress {
  name: string
  company?: string
  line1: string
  line2?: string
  city: string
  state: string
  zip: string
  country: string
}

export interface QuoteItem {
  product_id: string
  sku: string
  name: string
  quantity: number
  unit_price_cents: number
  line_total: number
}

export interface Quote {
  id: string
  quote_number: string
  contractor_id: string | null
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  guest_company: string | null
  items: QuoteItem[]
  subtotal_cents: number | null
  shipping_estimate_cents: number | null
  total_cents: number | null
  status: 'pending' | 'quoted' | 'accepted' | 'ordered' | 'shipped' | 'delivered'
  project_type: string | null
  project_location: string | null
  timeline: string | null
  special_requirements: string | null
  ai_conversation_id: string | null
  ai_recommended: boolean
  quoted_by: string | null
  quoted_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  contractor?: ContractorProfile
}

export interface Order {
  id: string
  order_number: string
  quote_id: string | null
  contractor_id: string | null
  items: QuoteItem[]
  subtotal_cents: number
  shipping_cents: number
  tax_cents: number
  total_cents: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered'
  xpose_invoice_ref: string | null
  tracking_number: string | null
  shipped_at: string | null
  delivered_at: string | null
  shipping_address: ShippingAddress
  shipping_method: string | null
  payment_method: string | null
  payment_status: string
  stripe_payment_id: string | null
  created_at: string
  contractor?: ContractorProfile
}

export interface PricingRule {
  id: string
  tarp_type: string | null
  thickness_mil: number | null
  min_quantity: number
  max_quantity: number | null
  margin_percent: number | null
  discount_from_retail_percent: number | null
  flat_markup_cents: number | null
  priority: number
  active: boolean
  created_at: string
}

export interface ChatSession {
  id: string
  contractor_id: string | null
  session_token: string
  identified_needs: Record<string, unknown> | null
  recommended_products: Array<{ product_id: string; reason: string }> | null
  converted_to_rfq: boolean
  quote_id: string | null
  page_url: string | null
  created_at: string
  ended_at: string | null
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  products_referenced: string[] | null
  created_at: string
}

export type Category =
  | 'construction-roofing'
  | 'agriculture-farming'
  | 'industrial-warehouse'
  | 'general-purpose'

export type TarpType =
  | 'poly'
  | 'canvas'
  | 'clear-vinyl'
  | 'mesh'
  | 'fire-retardant'

export interface RFQFormData {
  // Contact
  name: string
  email: string
  phone: string
  company: string
  // Project
  project_type: string
  project_location: string
  timeline: string
  special_requirements: string
  // Items
  items: Array<{
    product_id?: string
    sku?: string
    description: string
    quantity: number
  }>
  // Shipping
  shipping_address: ShippingAddress
}
