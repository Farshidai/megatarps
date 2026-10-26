// DEMO MODE sample rows for /admin/orders (no database). Server-only usage.
import { demoProducts } from '@/lib/demo'

export interface AdminOrderRow {
  id: string
  order_number: string
  created_at: string
  status: string
  payment_status: string | null
  payment_method: string | null
  total_cents: number
  tracking_number: string | null
  xpose_invoice_ref: string | null
  shipping_address: { name?: string; city?: string; state?: string } | null
  items: Array<{ sku: string; name: string; quantity: number }>
}

export function demoAdminOrders(now = Date.now()): AdminOrderRow[] {
  const p = demoProducts.filter((x) => x.active && x.retail_price_cents > 0 && !(Number((x as { pack_quantity?: number | null }).pack_quantity) > 1))
  const h = 3600_000
  const mk = (i: number, hoursAgo: number, status: string, payment_status: string, method: string, qty: number, name: string, city: string): AdminOrderRow => {
    const prod = p[(i * 7) % p.length]
    return {
      id: `demo-order-${i}`,
      order_number: `MO-DEMO-${1040 + i}`,
      created_at: new Date(now - hoursAgo * h).toISOString(),
      status,
      payment_status,
      payment_method: method,
      total_cents: prod.retail_price_cents * qty + 4500,
      tracking_number: status === 'shipped' ? '1Z999AA10123456784' : null,
      xpose_invoice_ref: null,
      shipping_address: { name, city, state: 'MO' },
      items: [{ sku: prod.xpose_sku, name: prod.name, quantity: qty }],
    }
  }
  return [
    mk(1, 2, 'processing', 'paid', 'card', 4, 'Ridgeline Roofing', "Lee's Summit"),
    mk(2, 5, 'pending', 'pending', 'card', 2, 'Guest checkout', 'Kansas City'),
    mk(3, 30, 'pending', 'processing', 'us_bank_account', 12, 'Prairie Farms Co-op', 'Olathe'),
    mk(4, 50, 'processing', 'invoiced', 'net30', 42, 'Summit GC', 'Overland Park'),
    mk(5, 72, 'pending', 'pending', 'card', 1, 'Guest checkout', 'Independence'),
    mk(6, 96, 'cancelled', 'expired', 'card', 3, 'Guest checkout', 'Blue Springs'),
    mk(7, 140, 'shipped', 'paid', 'card', 8, 'Metro Restoration', 'Raytown'),
  ]
}
