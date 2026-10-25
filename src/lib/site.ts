// Company info used across the site (header/footer, contact page, JSON-LD, emails).
// One place to change it.
//
// ⚠️ PLACEHOLDERS: Farshid must confirm every value marked `CONFIRM` before launch.
// Email and phone are confirmed by Farshid (Oct 2026). Each can also be
// overridden with an env var (NEXT_PUBLIC_CONTACT_PHONE, etc.) without a code change.
// No street address is published on purpose; add one only if you want walk-in or
// will-call pickup and a Google Business Profile.

// Static `process.env.NEXT_PUBLIC_*` reads so Next inlines them in client bundles too.
const env = (value: string | undefined, fallback: string) => (value && value.trim() ? value.trim() : fallback)

export const SITE_URL = 'https://megatarps.com'

export const site = {
  name: 'MegaTarps',
  legalName: 'Mega Innovation Group LLC',
  url: SITE_URL,
  tagline: "The contractor's tarp supplier",
  positioning: 'The right mil, the right size, by the pallet.',
  description:
    'Wholesale heavy-duty tarps for contractors, roofers, farms and warehouses. 5 to 20 mil poly, canvas, mesh, clear vinyl and fire-retardant tarps with case and pallet pricing and LTL freight across the Midwest. Kansas City based.',

  // Confirmed by Farshid (Oct 2026): main sales phone. Display and E.164 forms must match.
  phoneDisplay: env(process.env.NEXT_PUBLIC_CONTACT_PHONE, '(913) 313-2691'),
  phoneE164: env(process.env.NEXT_PUBLIC_CONTACT_PHONE_E164, '+19133132691'),
  // Confirmed by Farshid (Oct 2026): public contact email, used on contact, footer, policies and JSON-LD.
  email: env(process.env.NEXT_PUBLIC_CONTACT_EMAIL, 'mfirooz@megatarps.com'),
  // CONFIRM: business hours.
  hours: 'Mon–Fri, 8:00 AM – 5:00 PM Central',
  hoursSchema: [{ days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '17:00' }],
  // CONFIRM: quote/email response-time promise (stated as a goal, not a guarantee).
  responseTime: 'We aim to reply within one business day.',

  city: 'Kansas City metro',
  region: 'MO',
  country: 'US',
  baseLocation: 'Kansas City metro area',
  // CONFIRM: states you actively serve by LTL (used in Organization JSON-LD areaServed).
  serviceArea: ['Missouri', 'Kansas', 'Iowa', 'Nebraska', 'Oklahoma', 'Arkansas', 'Illinois'],
  serviceAreaSummary: 'Kansas City metro and the Midwest, with LTL freight nationwide on request',

  // CONFIRM: add real profile URLs (LinkedIn, Facebook, Google Business Profile) when they exist.
  sameAs: [] as string[],
} as const

export function telHref(): string {
  return `tel:${site.phoneE164}`
}

export function mailHref(subject?: string): string {
  return `mailto:${site.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`
}

/** Jobs used by the "Shop by job" tiles and `/products?job=` (Team A supports the param). */
export const JOBS = [
  { slug: 'roofing', label: 'Roofing', blurb: 'Storm dry-in and roof cover. 12–16 mil, sewn-in rope edge.', image: '/images/hero-jobsite.webp' },
  { slug: 'construction', label: 'Construction', blurb: 'Site cover, debris, material storage. 10–16 mil.', image: '/images/category-construction.webp' },
  { slug: 'agriculture', label: 'Agriculture', blurb: 'Hay, grain and equipment cover. UV-treated 12–20 mil.', image: '/images/category-agriculture.webp' },
  { slug: 'warehouse', label: 'Warehouse', blurb: 'Pallet, rack and dust cover. 7–10 mil by the case.', image: '/images/category-industrial.webp' },
  { slug: 'scaffolding', label: 'Scaffolding', blurb: 'Enclosures and wind screens. Fire-retardant, mesh, clear.', image: '/images/category-general.webp' },
] as const

export type JobSlug = (typeof JOBS)[number]['slug']
