import Link from 'next/link'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { FileCheck2 } from 'lucide-react'
import { getCurrentAccount, DEMO_ACCOUNT_COOKIE } from '@/lib/accounts'
import { paymentTermsLabel, formatCents } from '@/lib/wholesale'
import { CompanyProfileForm } from '../_components/CompanyProfileForm'
import { JobsiteManager } from '../_components/JobsiteManager'
import { CertificateUpload } from '../_components/CertificateUpload'
import { DemoAccountSwitcher } from '../_components/DemoAccountSwitcher'

export const metadata: Metadata = { title: 'Account Settings' }

const card = 'bg-white rounded-xl border border-slate-200 p-5 sm:p-6'

export default async function AccountSettingsPage() {
  const { user, profile, demo } = await getCurrentAccount()
  const demoState = demo ? (await cookies()).get(DEMO_ACCOUNT_COOKIE)?.value ?? 'guest' : ''

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-4">
        {demo && <DemoAccountSwitcher current={demoState} back="/account/settings" />}
        <div className={`${card} text-center`}>
          <h1 className="text-xl font-black text-slate-900 mb-2">Account settings</h1>
          <p className="text-slate-500 mb-4">Sign in to manage your account.</p>
          <Link href="/account/login?redirect=/account/settings" className="text-orange-600 font-semibold hover:underline">Sign in →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {demo && <DemoAccountSwitcher current={demoState} back="/account/settings" />}
      <h1 className="text-2xl font-black text-slate-900">Account settings</h1>

      {/* Account terms (read-only) */}
      <section className={card} aria-labelledby="terms-h">
        <h2 id="terms-h" className="font-bold text-slate-900 mb-4">Account</h2>
        <dl className="grid sm:grid-cols-2 gap-x-8 text-sm">
          {[
            ['Email', user.email ?? '—'],
            ['Member since', user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'],
            ['Wholesale status', profile ? profile.account_status[0].toUpperCase() + profile.account_status.slice(1) : 'No application'],
            ...(profile?.account_status === 'approved'
              ? [
                  ['Wholesale discount', `${Number(profile.wholesale_discount_percent)}%`],
                  ['Payment terms', paymentTermsLabel(profile.payment_terms)],
                  ['Credit limit', profile.credit_limit_cents ? formatCents(profile.credit_limit_cents) : '—'],
                  ['Tax exempt', profile.tax_exempt ? 'Yes' : 'No'],
                ]
              : []),
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <dt className="text-slate-500">{k}</dt>
              <dd className="font-medium text-slate-900 text-right">{v}</dd>
            </div>
          ))}
        </dl>
        {!profile && (
          <p className="text-sm text-slate-600 mt-4">
            <Link href="/apply" className="text-orange-600 font-semibold hover:underline">Complete your wholesale application</Link> to unlock wholesale pricing.
          </p>
        )}
      </section>

      {profile && (
        <>
          <section className={card} aria-labelledby="company-h">
            <h2 id="company-h" className="font-bold text-slate-900 mb-4">Company profile</h2>
            <CompanyProfileForm profile={profile} />
          </section>

          <section className={card} aria-labelledby="jobsites-h">
            <h2 id="jobsites-h" className="font-bold text-slate-900 mb-1">Saved jobsites</h2>
            <p className="text-sm text-slate-500 mb-4">Delivery addresses you ship to often.</p>
            <JobsiteManager sites={profile.jobsite_addresses ?? []} demo={demo} />
          </section>

          <section id="certificate" className={`${card} scroll-mt-28`} aria-labelledby="cert-h">
            <h2 id="cert-h" className="font-bold text-slate-900 mb-1">Resale / tax-exempt certificate</h2>
            {profile.resale_certificate_path ? (
              <p className="text-sm text-slate-600 mb-4 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" aria-hidden />
                Certificate on file{profile.resale_cert_state ? ` (${profile.resale_cert_state})` : ''}.
                {profile.tax_exempt ? ' Tax-exempt purchasing is active.' : ' Awaiting verification by our team.'}
              </p>
            ) : (
              <p className="text-sm text-slate-500 mb-4">No certificate on file. Upload one to request tax-exempt purchasing.</p>
            )}
            <p className="text-xs text-slate-500 mb-3">Uploading a new certificate replaces the one on file and notifies our team for review.</p>
            <CertificateUpload currentState={profile.resale_cert_state} />
          </section>
        </>
      )}

      <section className={card} aria-labelledby="security-h">
        <h2 id="security-h" className="font-bold text-slate-900 mb-3">Security</h2>
        <p className="text-sm text-slate-500 mb-4">We&apos;ll email you a link to reset your password.</p>
        <form action="/api/auth/reset-password" method="POST">
          <input type="hidden" name="email" value={user.email ?? ''} />
          <button type="submit"
            className="border border-slate-300 text-slate-700 hover:border-orange-400 hover:text-orange-600 font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
            Send reset link
          </button>
        </form>
      </section>

      <section className={card}>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className="text-red-600 hover:text-red-700 font-semibold text-sm hover:underline">
            Sign out
          </button>
        </form>
      </section>
    </div>
  )
}
