import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgePercent, CalendarClock, FileCheck2, Headset, CheckCircle2, Clock } from 'lucide-react'
import { getCurrentAccount } from '@/lib/accounts'
import { ApplyWizard, type WizardMode } from './ApplyWizard'
import { EMPTY_APPLICATION, type ApplicationInput } from '@/lib/wholesale'

export const metadata: Metadata = {
  title: 'Apply for a Wholesale Account',
  description:
    'Open a MegaTarps wholesale account: tier pricing on case and pallet quantities, net terms for qualified buyers, tax-exempt purchasing and a dedicated account rep.',
}

const BENEFITS = [
  {
    icon: BadgePercent,
    title: 'Wholesale tier pricing',
    body: 'Volume pricing on case and pallet quantities, plus an account discount set for your business once approved.',
  },
  {
    icon: CalendarClock,
    title: 'Net terms for qualified buyers',
    body: 'Net 15 or Net 30 terms are available to approved accounts, subject to a credit review.',
  },
  {
    icon: FileCheck2,
    title: 'Tax-exempt purchasing',
    body: 'Upload a valid resale or exemption certificate and qualifying orders are processed tax-exempt.',
  },
  {
    icon: Headset,
    title: 'A dedicated account rep',
    body: 'One point of contact for quotes, reorders, jobsite deliveries and special orders.',
  },
]

export default async function ApplyPage() {
  const { user, profile, demo } = await getCurrentAccount()

  let mode: WizardMode = 'new'
  if (user && !profile) mode = 'complete'
  else if (profile?.account_status === 'rejected') mode = 'reapply'
  else if (profile) mode = 'existing'

  const prefill: ApplicationInput = profile
    ? {
        ...EMPTY_APPLICATION,
        email: profile.email,
        contact_name: profile.contact_name ?? '',
        company_name: profile.company_name ?? '',
        business_type: profile.business_type ?? '',
        years_in_business: profile.years_in_business != null ? String(profile.years_in_business) : '',
        service_area: profile.service_area ?? '',
        est_monthly_volume: profile.est_monthly_volume ?? '',
        website: profile.website ?? '',
        phone: profile.phone ?? '',
        resale_cert_state: profile.resale_cert_state ?? '',
        tax_id: profile.tax_id ?? '',
      }
    : { ...EMPTY_APPLICATION, email: user?.email ?? '' }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14">
        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 lg:gap-12 items-start">
          {/* Benefits */}
          <section
            aria-labelledby="apply-benefits"
            className="order-2 lg:order-1 relative overflow-hidden rounded-2xl bg-slate-950 text-white p-6 sm:p-8 lg:sticky lg:top-28"
          >
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-orange-500/15 blur-3xl" aria-hidden />
            <div className="relative">
              <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-orange-300 bg-white/[0.06] ring-1 ring-white/10 rounded-full px-3 py-1 mb-5">
                Wholesale program
              </p>
              <h1 id="apply-benefits" className="text-3xl sm:text-4xl font-black leading-tight tracking-tight mb-3">
                Open a wholesale account
              </h1>
              <p className="text-slate-300 mb-7 leading-relaxed">
                For contractors, roofers, farms, warehouses and resellers who buy tarps by the case or the pallet.
              </p>
              <ul className="space-y-5">
                {BENEFITS.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-orange-500/15 ring-1 ring-orange-400/30 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-orange-300" aria-hidden />
                    </span>
                    <div>
                      <p className="font-bold">{title}</p>
                      <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-white/10 text-sm text-slate-400 space-y-2">
                <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-500" aria-hidden /> Takes about 3 minutes. Free to apply.</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-500" aria-hidden /> You can keep shopping at standard pricing while we review.</p>
              </div>
            </div>
          </section>

          {/* Wizard */}
          <section aria-label="Wholesale application form" className="order-1 lg:order-2">
            <div className="lg:hidden mb-5">
              <p className="text-[11px] font-black uppercase tracking-wider text-orange-600">Wholesale program</p>
              <p className="text-2xl font-black text-slate-900 leading-tight">Apply for a wholesale account</p>
              <p className="text-sm text-slate-500">Tier pricing, net terms for qualified buyers, tax-exempt purchasing. Details below.</p>
            </div>
            {demo && (
              <p className="mb-4 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Demo mode: the application is validated, but nothing is saved and no emails are sent.
              </p>
            )}
            {mode === 'existing' && profile ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <h2 className="text-xl font-black text-slate-900 mb-2">
                  {profile.account_status === 'approved' ? 'Your wholesale account is active' : 'Your application is under review'}
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                  {profile.account_status === 'approved'
                    ? `${profile.company_name} is approved for wholesale pricing.`
                    : `We have ${profile.company_name}'s application on file and will email you when it's reviewed.`}
                </p>
                <Link href="/account" className="inline-flex bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
                  Go to my account
                </Link>
              </div>
            ) : (
              <ApplyWizard mode={mode} prefill={prefill} rejectionReason={profile?.rejection_reason ?? null} />
            )}
            {mode === 'new' && (
              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{' '}
                <Link href="/account/login?redirect=/apply" className="text-orange-600 font-semibold hover:underline">Sign in</Link>
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
