import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ChatWidget } from '@/components/chat/ChatWidget'
import { HideOnAdmin } from '@/components/layout/HideOnAdmin'
import { JsonLd, organizationJsonLd, websiteJsonLd } from '@/components/seo/JsonLd'
import { site, SITE_URL } from '@/lib/site'

// Note: no site-wide `alternates.canonical` here on purpose. A canonical set in the
// root layout would be inherited by every page that doesn't override it, pointing
// them all at the homepage. Pages set their own canonical.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Wholesale Heavy-Duty Tarps by the Case & Pallet | MegaTarps',
    template: '%s | MegaTarps',
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.legalName, url: SITE_URL }],
  creator: site.legalName,
  publisher: site.legalName,
  category: 'business',
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: 'website',
    siteName: site.name,
    locale: 'en_US',
    url: SITE_URL,
    title: 'MegaTarps: wholesale heavy-duty tarps for contractors',
    description:
      'The right mil, the right size, by the pallet. Case and pallet pricing on 5–20 mil poly, canvas, mesh and fire-retardant tarps, with LTL freight across the Midwest.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MegaTarps: wholesale heavy-duty tarps for contractors',
    description: 'Case and pallet pricing on 5–20 mil tarps. Kansas City based, Midwest LTL freight.',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-orange-500 focus:text-white focus:font-bold focus:px-4 focus:py-2 focus:rounded-lg"
        >
          Skip to content
        </a>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <HideOnAdmin><Navbar /></HideOnAdmin>
        <main id="main" className="flex-1">{children}</main>
        <HideOnAdmin><Footer /></HideOnAdmin>
        <HideOnAdmin><ChatWidget /></HideOnAdmin>
      </body>
    </html>
  )
}
