import Link from 'next/link'
import type { ReactNode } from 'react'
import { JsonLd, breadcrumbJsonLd } from './JsonLd'

/** Shared layout for legal / policy pages (terms, privacy, shipping, returns). */
export function PolicyPage({
  title,
  path,
  updated,
  intro,
  children,
}: {
  title: string
  path: string
  updated: string
  intro?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="bg-white">
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: title, path }])} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span className="text-slate-900" aria-current="page">{title}</span>
        </nav>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">{title}</h1>
        <p className="text-slate-500 text-sm mb-8">Last updated: {updated}</p>
        {intro && <div className="text-slate-700 leading-relaxed mb-8">{intro}</div>}
        <div className="space-y-9 text-slate-700 text-[15px] leading-relaxed [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:mb-3 [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-2 [&_ul]:space-y-1.5 [&_a]:text-orange-700 [&_a]:font-semibold [&_a:hover]:underline">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Visibly highlighted placeholder for terms that are not yet confirmed
 * (warranty, fees, time limits). Search the codebase for <Placeholder to find them all.
 */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <mark className="bg-amber-100 text-amber-900 rounded px-1 py-0.5 font-semibold" title="Placeholder: to be confirmed">
      [To be confirmed: {children}]
    </mark>
  )
}
