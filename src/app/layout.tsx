import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ChatWidget } from '@/components/chat/ChatWidget'

export const metadata: Metadata = {
  title: {
    default: 'MegaTarps — Heavy-Duty Tarps for Contractors & Industry',
    template: '%s | MegaTarps',
  },
  description:
    'Wholesale and retail heavy-duty tarps for construction, roofing, agriculture, and industry. 5-mil to 20-mil poly tarps, canvas, mesh, fire retardant. Bulk pricing available.',
  keywords: [
    'heavy duty tarps',
    'wholesale tarps',
    'contractor tarps',
    'roofing tarps',
    'bulk tarps',
    'poly tarps',
    '16 mil tarp',
    '20 mil tarp',
    'fire retardant tarp',
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://megatarps.com'),
  openGraph: {
    type: 'website',
    siteName: 'MegaTarps',
    locale: 'en_US',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatWidget />
      </body>
    </html>
  )
}
