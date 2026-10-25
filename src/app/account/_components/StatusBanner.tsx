import Link from 'next/link'
import { Clock, BadgeCheck, XCircle, FileWarning, ArrowRight } from 'lucide-react'
import { formatCents, paymentTermsLabel, type WholesaleProfile } from '@/lib/wholesale'

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

export function StatusBanner({ profile }: { profile: WholesaleProfile | null }) {
  if (!profile) {
    return (
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <FileWarning className="w-8 h-8 text-orange-500 flex-shrink-0" aria-hidden />
        <div className="flex-1">
          <h2 className="font-black text-slate-900">Finish your wholesale application</h2>
          <p className="text-sm text-slate-600">Add your business details to unlock wholesale pricing, net terms and tax-exempt purchasing.</p>
        </div>
        <Link href="/apply" className="inline-flex items-center justify-center gap-1 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
          Complete application <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      </div>
    )
  }

  if (profile.account_status === 'approved') {
    const items = [
      { label: 'Wholesale discount', value: `${Number(profile.wholesale_discount_percent)}%`, note: 'on top of volume tiers' },
      { label: 'Payment terms', value: paymentTermsLabel(profile.payment_terms).replace(/ \(.*\)/, '') },
      { label: 'Credit limit', value: profile.credit_limit_cents ? formatCents(profile.credit_limit_cents) : '—' },
      { label: 'Tax exempt', value: profile.tax_exempt ? `Yes${profile.resale_cert_state ? ` (${profile.resale_cert_state})` : ''}` : 'No' },
    ]
    return (
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-5">
          <BadgeCheck className="w-7 h-7 text-emerald-600 flex-shrink-0" aria-hidden />
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Approved wholesale account</p>
            <h2 className="font-black text-slate-900 text-lg">{profile.company_name}</h2>
            <p className="text-sm text-slate-600">Your pricing is applied automatically when you&apos;re signed in. Approved {fmtDate(profile.approved_at)}.</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((i) => (
            <div key={i.label} className="bg-white rounded-lg border border-emerald-100 px-4 py-3">
              <dt className="text-xs text-slate-500">{i.label}</dt>
              <dd className="text-lg font-black text-slate-900">{i.value}</dd>
              {i.note && <dd className="text-[11px] text-slate-400">{i.note}</dd>}
            </div>
          ))}
        </dl>
      </div>
    )
  }

  if (profile.account_status === 'rejected') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <XCircle className="w-7 h-7 text-red-600 flex-shrink-0" aria-hidden />
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-wider text-red-700">Application not approved</p>
            <h2 className="font-black text-slate-900 text-lg">{profile.company_name}</h2>
            {profile.rejection_reason && (
              <p className="mt-2 text-sm text-slate-700 bg-white/70 border-l-4 border-red-300 rounded px-3 py-2">
                <span className="font-semibold">Reason: </span>{profile.rejection_reason}
              </p>
            )}
            <p className="text-sm text-slate-600 mt-3">You can still order at standard pricing. Update your details and re-apply at any time.</p>
            <Link href="/apply" className="mt-4 inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Update &amp; re-apply <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Clock className="w-7 h-7 text-amber-600 flex-shrink-0" aria-hidden />
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-wider text-amber-700">Pending review</p>
          <h2 className="font-black text-slate-900 text-lg">{profile.company_name}</h2>
          <p className="text-sm text-slate-700">
            Submitted {fmtDate(profile.created_at)}. Our team is reviewing your application and will email{' '}
            <strong>{profile.email}</strong> when a decision is made. Until then, standard volume pricing applies.
          </p>
          {!profile.resale_certificate_path && (
            <p className="text-sm text-slate-700 mt-3">
              Buying tax-exempt?{' '}
              <Link href="/account/settings#certificate" className="text-orange-700 font-semibold hover:underline">Upload your resale certificate</Link>{' '}
              to include it in the review.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
