// DEMO MODE sample wholesale applications (one of each status) so QA can click
// through /account and /admin/accounts without a database.
import type { WholesaleProfile } from '@/lib/wholesale'

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

export const DEMO_APPLICATIONS: WholesaleProfile[] = [
  {
    id: 'demo-0000-0000-0000-000000000001',
    company_name: 'Prairie View Farms',
    contact_name: 'Dana Whitfield',
    email: 'dana@prairieviewfarms.example',
    phone: '(785) 555-0142',
    business_type: 'Farm / ranch',
    service_area: 'Northeast Kansas',
    tax_exempt: false,
    tax_id: null,
    jobsite_addresses: [],
    notes: null,
    created_at: daysAgo(1),
    account_status: 'pending',
    wholesale_discount_percent: 0,
    payment_terms: 'prepaid',
    credit_limit_cents: null,
    resale_certificate_path: 'demo-0000-0000-0000-000000000001/ks-ag-exemption.pdf',
    resale_cert_state: 'KS',
    years_in_business: 22,
    est_monthly_volume: '$1,000 – $5,000',
    website: 'https://prairieviewfarms.example',
    approved_at: null,
    approved_by: null,
    rejection_reason: null,
  },
  {
    id: 'demo-0000-0000-0000-000000000002',
    company_name: 'Heartland Roofing & Exteriors',
    contact_name: 'Marcus Reed',
    email: 'marcus@heartlandroofing.example',
    phone: '(816) 555-0187',
    business_type: 'Roofing contractor',
    service_area: 'Kansas City metro (MO & KS)',
    tax_exempt: true,
    tax_id: 'MO-RS-48213',
    jobsite_addresses: [
      { id: 'j1', label: 'Shop / yard', line1: '1400 SE Hamblen Rd', city: "Lee's Summit", state: 'MO', zip: '64081' },
      { id: 'j2', label: 'Oak Ridge HOA re-roof', line1: '220 NW Oak Ridge Dr', city: 'Blue Springs', state: 'MO', zip: '64014', notes: 'Gate code at site trailer' },
    ],
    notes: null,
    created_at: daysAgo(18),
    account_status: 'approved',
    wholesale_discount_percent: 8,
    payment_terms: 'net30',
    credit_limit_cents: 2_500_000,
    resale_certificate_path: 'demo-0000-0000-0000-000000000002/mo-resale.pdf',
    resale_cert_state: 'MO',
    years_in_business: 11,
    est_monthly_volume: '$5,000 – $20,000',
    website: 'https://heartlandroofing.example',
    approved_at: daysAgo(16),
    approved_by: 'admin@megatarps.com',
    rejection_reason: null,
  },
  {
    id: 'demo-0000-0000-0000-000000000003',
    company_name: 'QuickFlip Supply',
    contact_name: 'Jordan Lee',
    email: 'jordan@quickflip.example',
    phone: '(913) 555-0119',
    business_type: 'Distributor / reseller',
    service_area: 'Online only',
    tax_exempt: false,
    tax_id: null,
    jobsite_addresses: [],
    notes: null,
    created_at: daysAgo(9),
    account_status: 'rejected',
    wholesale_discount_percent: 0,
    payment_terms: 'prepaid',
    credit_limit_cents: null,
    resale_certificate_path: null,
    resale_cert_state: null,
    years_in_business: 0,
    est_monthly_volume: 'Under $1,000',
    website: null,
    approved_at: null,
    approved_by: 'admin@megatarps.com',
    rejection_reason:
      'We could not verify a resale certificate or business registration. Please re-apply with a valid resale certificate and business website or EIN.',
  },
]

export function demoApplicationByStatus(status: string): WholesaleProfile | null {
  return DEMO_APPLICATIONS.find((a) => a.account_status === status) ?? null
}

export function demoApplicationById(id: string): WholesaleProfile | null {
  return DEMO_APPLICATIONS.find((a) => a.id === id) ?? null
}
