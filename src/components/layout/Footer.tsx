import Link from 'next/link'
import { Phone, Mail, MapPin, Clock, ArrowRight } from 'lucide-react'
import { site, telHref, mailHref, JOBS } from '@/lib/site'
import { CATEGORY_LABELS } from '@/lib/utils'
import { ARTICLES, CALCULATOR } from '@/app/resources/_content'

const linkCls = 'hover:text-orange-400 focus-visible:outline-none focus-visible:text-orange-400 focus-visible:underline'

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>

      {/* Wholesale band */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-white font-black text-xl tracking-tight">Buying for a crew, farm or warehouse?</p>
            <p className="text-slate-400 text-sm mt-1">Tier pricing, tax-exempt purchasing and net terms for qualified buyers.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/apply" className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors">
              Open a wholesale account <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link href="/bulk-quote" className="inline-flex items-center justify-center ring-1 ring-slate-600 hover:ring-slate-400 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors">
              Request a pallet quote
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand + contact */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 w-fit" aria-label="MegaTarps home">
              <span className="bg-orange-500 text-white font-black text-lg px-3 py-1 rounded">MEGA</span>
              <span className="text-white font-bold text-xl">TARPS</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-5 max-w-xs">
              {site.tagline}. {site.positioning} Wholesale heavy-duty tarps from the {site.baseLocation}.
            </p>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-400 flex-shrink-0" aria-hidden="true" />
                <a href={telHref()} className={linkCls}>{site.phoneDisplay}</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-orange-400 flex-shrink-0" aria-hidden="true" />
                <a href={mailHref()} className={linkCls}>{site.email}</a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" aria-hidden="true" />
                <span className="text-slate-400">{site.hours}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span className="text-slate-400">{site.serviceAreaSummary}</span>
              </li>
            </ul>
          </div>

          {/* Shop */}
          <nav aria-label="Shop by category">
            <h3 className="text-white font-semibold mb-4">Categories</h3>
            <ul className="space-y-2 text-sm">
              {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
                <li key={slug}><Link href={`/products/${slug}`} className={linkCls}>{label}</Link></li>
              ))}
              <li><Link href="/products?type=fire-retardant" className={linkCls}>Fire-Retardant</Link></li>
              <li><Link href="/products" className={linkCls}>All tarps</Link></li>
            </ul>
          </nav>

          <nav aria-label="Shop by job">
            <h3 className="text-white font-semibold mb-4">Shop by job</h3>
            <ul className="space-y-2 text-sm">
              {JOBS.map((j) => (
                <li key={j.slug}><Link href={`/products?job=${j.slug}`} className={linkCls}>{j.label}</Link></li>
              ))}
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Resources">
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={CALCULATOR.path} className={linkCls}>{CALCULATOR.title}</Link></li>
              {ARTICLES.slice(0, 4).map((a) => (
                <li key={a.slug}><Link href={`/resources/${a.slug}`} className={linkCls}>{a.shortTitle}</Link></li>
              ))}
              <li><Link href="/resources" className={linkCls}>All guides</Link></li>
            </ul>
          </nav>

          {/* Company & policies */}
          <nav aria-label="Company and policies">
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/apply" className={linkCls}>Wholesale application</Link></li>
              <li><Link href="/account" className={linkCls}>Account login</Link></li>
              <li><Link href="/about" className={linkCls}>About</Link></li>
              <li><Link href="/contact" className={linkCls}>Contact</Link></li>
              <li><Link href="/shipping" className={linkCls}>Shipping &amp; freight</Link></li>
              <li><Link href="/returns" className={linkCls}>Returns</Link></li>
            </ul>
          </nav>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} {site.legalName}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-300">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-300">Terms</Link>
            <Link href="/shipping" className="hover:text-slate-300">Shipping</Link>
            <Link href="/returns" className="hover:text-slate-300">Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
