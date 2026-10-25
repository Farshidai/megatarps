import { site, SITE_URL } from '@/lib/site'

type Json = Record<string, unknown>

/** Renders a JSON-LD <script>. `<` is escaped so content can never close the tag. */
export function JsonLd({ data }: { data: Json | Json[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

export function organizationJsonLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: site.name,
    legalName: site.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}/icon`,
    description: site.description,
    email: site.email,
    telephone: site.phoneE164,
    areaServed: site.serviceArea.map((s) => ({ '@type': 'State', name: s })),
    address: { '@type': 'PostalAddress', addressLocality: 'Kansas City', addressRegion: site.region, addressCountry: site.country },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        telephone: site.phoneE164,
        email: site.email,
        areaServed: 'US',
        availableLanguage: ['English'],
        hoursAvailable: site.hoursSchema.map((h) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: h.days,
          opens: h.opens,
          closes: h.closes,
        })),
      },
    ],
    ...(site.sameAs.length ? { sameAs: site.sameAs } : {}),
  }
}

export function websiteJsonLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: site.name,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en-US',
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  }
}
