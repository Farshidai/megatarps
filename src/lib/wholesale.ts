// Shared (client + server safe) wholesale-account constants, types and validation.
// No server-only imports here: the /apply wizard and settings forms import this too.

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'
export type PaymentTerms = 'prepaid' | 'net15' | 'net30'

export interface JobsiteAddress {
  id: string
  label: string
  line1: string
  line2?: string
  city: string
  state: string
  zip: string
  notes?: string
}

/** contractor_profiles row after migration 0003 */
export interface WholesaleProfile {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string | null
  business_type: string | null
  service_area: string | null
  tax_exempt: boolean
  tax_id: string | null
  jobsite_addresses: JobsiteAddress[] | null
  notes: string | null
  created_at: string
  account_status: ApplicationStatus
  wholesale_discount_percent: number
  payment_terms: PaymentTerms
  credit_limit_cents: number | null
  resale_certificate_path: string | null
  resale_cert_state: string | null
  years_in_business: number | null
  est_monthly_volume: string | null
  website: string | null
  approved_at: string | null
  approved_by: string | null
  rejection_reason: string | null
  updated_at?: string | null
}

export const BUSINESS_TYPES = [
  'Roofing contractor',
  'General contractor',
  'Specialty / trade contractor',
  'Farm / ranch',
  'Distributor / reseller',
  'Warehouse / logistics',
  'Landscaping',
  'Municipality / government',
  'Other',
] as const

export const VOLUME_OPTIONS = [
  'Under $1,000',
  '$1,000 – $5,000',
  '$5,000 – $20,000',
  '$20,000 – $50,000',
  '$50,000+',
] as const

export const PAYMENT_TERMS: { value: PaymentTerms; label: string }[] = [
  { value: 'prepaid', label: 'Prepaid (card / ACH at order)' },
  { value: 'net15', label: 'Net 15' },
  { value: 'net30', label: 'Net 30' },
]

export function paymentTermsLabel(t: string | null | undefined): string {
  return PAYMENT_TERMS.find((p) => p.value === t)?.label ?? 'Prepaid'
}

export const US_STATES: [string, string][] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'],
  ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'],
  ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'],
  ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'], ['SD', 'South Dakota'],
  ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'],
  ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
]
const STATE_CODES = new Set(US_STATES.map(([c]) => c))

export const CERT_MAX_BYTES = 10 * 1024 * 1024
export const CERT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const
export const CERT_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

/** Fields of the wholesale application (step 1–3, minus the file). */
export interface ApplicationInput {
  email: string
  password: string
  confirm: string
  contact_name: string
  company_name: string
  business_type: string
  years_in_business: string
  service_area: string
  est_monthly_volume: string
  website: string
  phone: string
  resale_cert_state: string
  tax_id: string
  agree: boolean
}

export const EMPTY_APPLICATION: ApplicationInput = {
  email: '', password: '', confirm: '', contact_name: '', company_name: '', business_type: '',
  years_in_business: '', service_area: '', est_monthly_volume: '', website: '', phone: '',
  resale_cert_state: '', tax_id: '', agree: false,
}

export type FieldErrors = Partial<Record<keyof ApplicationInput | 'certificate', string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^[0-9+().\-\s]{7,20}$/

export function validateAccountStep(v: ApplicationInput): FieldErrors {
  const e: FieldErrors = {}
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address.'
  if (v.password.length < 8) e.password = 'Use at least 8 characters.'
  else if (!/[A-Za-z]/.test(v.password) || !/[0-9]/.test(v.password)) e.password = 'Include at least one letter and one number.'
  if (v.confirm !== v.password) e.confirm = 'Passwords do not match.'
  return e
}

export function validateBusinessStep(v: ApplicationInput): FieldErrors {
  const e: FieldErrors = {}
  if (v.contact_name.trim().length < 2) e.contact_name = 'Enter your name.'
  if (v.company_name.trim().length < 2) e.company_name = 'Enter your company name.'
  if (!(BUSINESS_TYPES as readonly string[]).includes(v.business_type)) e.business_type = 'Choose a business type.'
  const y = v.years_in_business.trim()
  if (y === '' || !/^\d{1,3}$/.test(y) || Number(y) > 200) e.years_in_business = 'Enter years in business (0 if new).'
  if (v.service_area.trim().length < 2) e.service_area = 'Tell us where you work (e.g. Kansas City metro).'
  if (!(VOLUME_OPTIONS as readonly string[]).includes(v.est_monthly_volume)) e.est_monthly_volume = 'Choose an estimate.'
  if (!PHONE_RE.test(v.phone.trim()) || v.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a 10-digit phone number.'
  if (v.website.trim() && !/^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(v.website.trim())) e.website = 'Enter a valid website or leave blank.'
  return e
}

export function validateTaxStep(v: ApplicationInput, file: { size: number; type: string } | null): FieldErrors {
  const e: FieldErrors = {}
  if (file) {
    if (!(CERT_TYPES as readonly string[]).includes(file.type)) e.certificate = 'Upload a PDF, JPG or PNG file.'
    else if (file.size > CERT_MAX_BYTES) e.certificate = 'File is larger than 10 MB.'
    else if (file.size === 0) e.certificate = 'That file is empty.'
    if (!STATE_CODES.has(v.resale_cert_state)) e.resale_cert_state = 'Choose the state that issued the certificate.'
  } else if (v.resale_cert_state && !STATE_CODES.has(v.resale_cert_state)) {
    e.resale_cert_state = 'Choose a valid state.'
  }
  if (v.tax_id.length > 40) e.tax_id = 'Too long.'
  return e
}

export function validateApplication(
  v: ApplicationInput,
  file: { size: number; type: string } | null,
  opts: { requireAccount: boolean },
): FieldErrors {
  const e: FieldErrors = {
    ...(opts.requireAccount ? validateAccountStep(v) : {}),
    ...validateBusinessStep(v),
    ...validateTaxStep(v, file),
  }
  if (!v.agree) e.agree = 'Please confirm the information is accurate.'
  return e
}

export function normalizeWebsite(w: string): string | null {
  const t = w.trim()
  if (!t) return null
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

export function isStateCode(s: string): boolean {
  return STATE_CODES.has(s)
}

export function escapeHtml(s: string | number | null | undefined): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function formatCents(c: number | null | undefined): string {
  if (c == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(c / 100)
}
