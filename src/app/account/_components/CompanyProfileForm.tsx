'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { updateCompanyProfile, type ActionState } from '../settings/actions'
import { BUSINESS_TYPES, VOLUME_OPTIONS, type WholesaleProfile } from '@/lib/wholesale'

const cls = (err?: string) =>
  `w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 ${err ? 'border-red-400' : 'border-slate-300'}`

export function CompanyProfileForm({ profile }: { profile: WholesaleProfile }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateCompanyProfile, { ok: false, message: '' })
  const e = state.errors ?? {}
  const f = (name: string, label: string, input: React.ReactNode) => (
    <div>
      <label htmlFor={`cp-${name}`} className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {input}
      {e[name] && <p id={`cp-${name}-error`} className="text-xs text-red-600 mt-1">{e[name]}</p>}
    </div>
  )
  const a = (name: string) => ({
    id: `cp-${name}`, name, 'aria-invalid': !!e[name] || undefined,
    'aria-describedby': e[name] ? `cp-${name}-error` : undefined, className: cls(e[name]),
  })

  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="grid sm:grid-cols-2 gap-4">
        {f('company_name', 'Company name', <input {...a('company_name')} defaultValue={profile.company_name} autoComplete="organization" />)}
        {f('contact_name', 'Contact name', <input {...a('contact_name')} defaultValue={profile.contact_name} autoComplete="name" />)}
        {f('phone', 'Phone', <input {...a('phone')} type="tel" defaultValue={profile.phone ?? ''} autoComplete="tel" />)}
        {f('website', 'Website', <input {...a('website')} defaultValue={profile.website ?? ''} placeholder="example.com" />)}
        {f('business_type', 'Business type', (
          <select {...a('business_type')} defaultValue={profile.business_type ?? ''}>
            <option value="">Select…</option>
            {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        ))}
        {f('years_in_business', 'Years in business', <input {...a('years_in_business')} inputMode="numeric" defaultValue={profile.years_in_business ?? ''} />)}
        {f('service_area', 'Service area', <input {...a('service_area')} defaultValue={profile.service_area ?? ''} />)}
        {f('est_monthly_volume', 'Est. monthly tarp spend', (
          <select {...a('est_monthly_volume')} defaultValue={profile.est_monthly_volume ?? ''}>
            <option value="">Select…</option>
            {VOLUME_OPTIONS.map((t) => <option key={t}>{t}</option>)}
          </select>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Email: <strong>{profile.email}</strong>. Pricing, payment terms, credit limit and tax status are set by our team.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors">
          {pending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />} Save changes
        </button>
        {state.message && (
          <p role="status" className={`text-sm ${state.ok ? 'text-emerald-700' : 'text-red-600'}`}>{state.message}</p>
        )}
      </div>
    </form>
  )
}
