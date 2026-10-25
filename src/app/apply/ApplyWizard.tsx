'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight, FileUp, Loader2, Mail, Pencil, X, AlertTriangle, PartyPopper } from 'lucide-react'
import {
  BUSINESS_TYPES, VOLUME_OPTIONS, US_STATES, CERT_ACCEPT, CERT_MAX_BYTES,
  validateAccountStep, validateBusinessStep, validateTaxStep,
  type ApplicationInput, type FieldErrors,
} from '@/lib/wholesale'

export type WizardMode = 'new' | 'complete' | 'reapply' | 'existing'

type StepId = 'account' | 'business' | 'tax' | 'review'
const STEP_LABELS: Record<StepId, string> = {
  account: 'Account',
  business: 'Business',
  tax: 'Tax exemption',
  review: 'Review',
}
const FIELD_STEP: Partial<Record<keyof FieldErrors, StepId>> = {
  email: 'account', password: 'account', confirm: 'account',
  contact_name: 'business', company_name: 'business', business_type: 'business', years_in_business: 'business',
  service_area: 'business', est_monthly_volume: 'business', website: 'business', phone: 'business',
  certificate: 'tax', resale_cert_state: 'tax', tax_id: 'tax', agree: 'review',
}

const inputCls = (err?: string) =>
  `w-full border rounded-lg px-3.5 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 ${
    err ? 'border-red-400' : 'border-slate-300'
  }`

function Field({
  id, label, error, hint, required, children,
}: { id: string; label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1">
        {label} {required ? <span className="text-orange-600" aria-hidden>*</span> : <span className="text-slate-400 font-normal">(optional)</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-slate-500 mt-1">{hint}</p>}
      {error && <p id={`${id}-error`} className="text-xs text-red-600 mt-1" role="alert">{error}</p>}
    </div>
  )
}

function fmtBytes(n: number) {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`
}

export function ApplyWizard({
  mode, prefill, rejectionReason,
}: { mode: WizardMode; prefill: ApplicationInput; rejectionReason: string | null }) {
  const steps: StepId[] = mode === 'new' ? ['account', 'business', 'tax', 'review'] : ['business', 'tax', 'review']
  const [stepIdx, setStepIdx] = useState(0)
  const [v, setV] = useState<ApplicationInput>(prefill)
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<null | { needsConfirmation: boolean; warning?: string; demo?: boolean }>(null)
  const [dragOver, setDragOver] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const firstRender = useRef(true)
  const step = steps[stepIdx]

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    headingRef.current?.focus()
  }, [stepIdx])

  const set = <K extends keyof ApplicationInput>(k: K, val: ApplicationInput[K]) => {
    setV((prev) => ({ ...prev, [k]: val }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const fileMeta = file ? { size: file.size, type: file.type } : null
  const validateStep = (s: StepId): FieldErrors =>
    s === 'account' ? validateAccountStep(v)
      : s === 'business' ? validateBusinessStep(v)
        : s === 'tax' ? validateTaxStep(v, fileMeta)
          : v.agree ? {} : { agree: 'Please confirm the information is accurate.' }

  const clean = (e: FieldErrors) => Object.fromEntries(Object.entries(e).filter(([, x]) => x)) as FieldErrors

  const next = () => {
    const e = clean(validateStep(step))
    setErrors(e)
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0]
      document.getElementById(`f-${first}`)?.focus()
      return
    }
    setStepIdx((i) => Math.min(i + 1, steps.length - 1))
  }
  const back = () => { setErrors({}); setStepIdx((i) => Math.max(i - 1, 0)) }
  const goTo = (s: StepId) => { setErrors({}); setStepIdx(steps.indexOf(s)) }

  const pickFile = (f: File | null | undefined) => {
    if (!f) return
    setFile(f)
    const e = validateTaxStep({ ...v, resale_cert_state: v.resale_cert_state || 'MO' }, { size: f.size, type: f.type })
    setErrors((prev) => ({ ...prev, certificate: e.certificate }))
  }

  const submit = async () => {
    // Re-validate every step before sending
    const all = clean(steps.reduce<FieldErrors>((acc, s) => ({ ...acc, ...validateStep(s) }), {}))
    if (Object.keys(all).length) {
      setErrors(all)
      const firstStep = steps.find((s) => Object.keys(all).some((k) => FIELD_STEP[k as keyof FieldErrors] === s))
      if (firstStep) setStepIdx(steps.indexOf(firstStep))
      return
    }
    setSubmitting(true)
    setFormError('')
    const fd = new FormData()
    for (const [k, val] of Object.entries(v)) fd.append(k, typeof val === 'boolean' ? String(val) : val)
    if (file) fd.append('certificate', file)
    fd.append('fax', (document.getElementById('f-fax') as HTMLInputElement | null)?.value ?? '')
    try {
      const res = await fetch('/apply/submit', { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({ ok: false, error: 'Unexpected server response.' }))
      if (!res.ok || !json.ok) {
        setFormError(json.error ?? 'Something went wrong. Please try again.')
        if (json.errors) {
          const e = clean(json.errors as FieldErrors)
          setErrors(e)
          const firstStep = steps.find((s) => Object.keys(e).some((k) => FIELD_STEP[k as keyof FieldErrors] === s))
          if (firstStep) setStepIdx(steps.indexOf(firstStep))
        }
      } else {
        setDone({ needsConfirmation: !!json.needsConfirmation, warning: json.warning, demo: json.demo })
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch {
      setFormError('Network error. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 text-center" role="status">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center">
          {done.needsConfirmation ? <Mail className="w-7 h-7 text-emerald-600" aria-hidden /> : <PartyPopper className="w-7 h-7 text-emerald-600" aria-hidden />}
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Application submitted</h2>
        <p className="text-slate-600 max-w-md mx-auto mb-2">
          Thanks, {v.contact_name.split(' ')[0] || 'there'}. We&apos;ll review {v.company_name || 'your application'} and email you at{' '}
          <strong className="text-slate-900">{v.email}</strong> when a decision is made.
        </p>
        {done.needsConfirmation && (
          <p className="text-slate-600 max-w-md mx-auto mb-2">
            First, please <strong>confirm your email</strong> using the link we just sent so you can sign in.
          </p>
        )}
        {done.warning && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 max-w-md mx-auto my-4">{done.warning}</p>
        )}
        {done.demo && <p className="text-xs text-slate-400 mb-2">(Demo mode — nothing was saved.)</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link href={done.needsConfirmation ? '/account/login' : '/account'} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
            {done.needsConfirmation ? 'Go to sign in' : 'Go to my account'}
          </Link>
          <Link href="/products" className="border-2 border-slate-200 hover:border-orange-400 text-slate-700 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
            Keep shopping
          </Link>
        </div>
      </div>
    )
  }

  const err = (k: keyof FieldErrors) => errors[k]
  const aria = (k: keyof FieldErrors, hint = false) => ({
    id: `f-${k}`,
    'aria-invalid': !!err(k) || undefined,
    'aria-describedby': err(k) ? `f-${k}-error` : hint ? `f-${k}-hint` : undefined,
  })

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      {/* Stepper */}
      <ol className="flex border-b border-slate-100 px-2 sm:px-4" aria-label="Application steps">
        {steps.map((s, i) => {
          const state = i < stepIdx ? 'done' : i === stepIdx ? 'current' : 'todo'
          return (
            <li key={s} className="flex-1 min-w-0" aria-current={state === 'current' ? 'step' : undefined}>
              <button
                type="button"
                onClick={() => i < stepIdx && goTo(s)}
                disabled={i >= stepIdx}
                className={`w-full flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-4 text-xs sm:text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  state === 'current' ? 'border-orange-500 text-slate-900' : state === 'done' ? 'border-transparent text-slate-600 hover:text-orange-600' : 'border-transparent text-slate-400'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                  state === 'done' ? 'bg-emerald-500 text-white' : state === 'current' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {state === 'done' ? <Check className="w-3.5 h-3.5" aria-hidden /> : i + 1}
                </span>
                <span className="truncate">{STEP_LABELS[s]}</span>
                <span className="sr-only">{state === 'done' ? '(completed)' : state === 'current' ? '(current step)' : ''}</span>
              </button>
            </li>
          )
        })}
      </ol>

      <form
        noValidate
        onSubmit={(e) => { e.preventDefault(); if (step === 'review') void submit(); else next() }}
        className="p-5 sm:p-8"
      >
        {/* Honeypot (hidden from people and assistive tech) */}
        <div className="hidden" aria-hidden>
          <label htmlFor="f-fax">Fax</label>
          <input id="f-fax" name="fax" tabIndex={-1} autoComplete="off" />
        </div>

        {mode === 'reapply' && stepIdx === 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-bold mb-1">Re-applying</p>
            {rejectionReason ? <p>Previous decision: {rejectionReason}</p> : <p>Update your details below and resubmit.</p>}
          </div>
        )}

        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-black text-slate-900 mb-1 focus:outline-none">
          {step === 'account' && 'Create your login'}
          {step === 'business' && 'Tell us about your business'}
          {step === 'tax' && 'Tax exemption'}
          {step === 'review' && 'Review and submit'}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Step {stepIdx + 1} of {steps.length}
          {step === 'account' && ' · You will use this email and password to sign in.'}
          {step === 'business' && ' · Helps us set the right pricing and terms.'}
          {step === 'tax' && ' · Optional. Skip it if you pay sales tax.'}
          {step === 'review' && ' · Check everything looks right.'}
        </p>

        {step === 'account' && (
          <div className="space-y-4">
            <Field id="f-email" label="Work email" error={err('email')} required>
              <input {...aria('email')} type="email" autoComplete="email" value={v.email}
                onChange={(e) => set('email', e.target.value)} className={inputCls(err('email'))} placeholder="you@company.com" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field id="f-password" label="Password" error={err('password')} hint="8+ characters, with a letter and a number." required>
                <input {...aria('password', true)} type="password" autoComplete="new-password" value={v.password}
                  onChange={(e) => set('password', e.target.value)} className={inputCls(err('password'))} />
              </Field>
              <Field id="f-confirm" label="Confirm password" error={err('confirm')} required>
                <input {...aria('confirm')} type="password" autoComplete="new-password" value={v.confirm}
                  onChange={(e) => set('confirm', e.target.value)} className={inputCls(err('confirm'))} />
              </Field>
            </div>
          </div>
        )}

        {step === 'business' && (
          <div className="space-y-4">
            {mode !== 'new' && (
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">Signed in as <strong>{v.email}</strong></p>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <Field id="f-contact_name" label="Your name" error={err('contact_name')} required>
                <input {...aria('contact_name')} autoComplete="name" value={v.contact_name}
                  onChange={(e) => set('contact_name', e.target.value)} className={inputCls(err('contact_name'))} placeholder="Jane Smith" />
              </Field>
              <Field id="f-company_name" label="Company name" error={err('company_name')} required>
                <input {...aria('company_name')} autoComplete="organization" value={v.company_name}
                  onChange={(e) => set('company_name', e.target.value)} className={inputCls(err('company_name'))} placeholder="Smith Roofing LLC" />
              </Field>
              <Field id="f-business_type" label="Business type" error={err('business_type')} required>
                <select {...aria('business_type')} value={v.business_type}
                  onChange={(e) => set('business_type', e.target.value)} className={inputCls(err('business_type'))}>
                  <option value="">Select…</option>
                  {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field id="f-years_in_business" label="Years in business" error={err('years_in_business')} required>
                <input {...aria('years_in_business')} inputMode="numeric" value={v.years_in_business}
                  onChange={(e) => set('years_in_business', e.target.value.replace(/\D/g, '').slice(0, 3))}
                  className={inputCls(err('years_in_business'))} placeholder="e.g. 8" />
              </Field>
              <Field id="f-service_area" label="Service area" error={err('service_area')} required>
                <input {...aria('service_area')} value={v.service_area}
                  onChange={(e) => set('service_area', e.target.value)} className={inputCls(err('service_area'))} placeholder="Kansas City metro" />
              </Field>
              <Field id="f-est_monthly_volume" label="Est. monthly tarp spend" error={err('est_monthly_volume')} required>
                <select {...aria('est_monthly_volume')} value={v.est_monthly_volume}
                  onChange={(e) => set('est_monthly_volume', e.target.value)} className={inputCls(err('est_monthly_volume'))}>
                  <option value="">Select…</option>
                  {VOLUME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field id="f-phone" label="Business phone" error={err('phone')} required>
                <input {...aria('phone')} type="tel" autoComplete="tel" value={v.phone}
                  onChange={(e) => set('phone', e.target.value)} className={inputCls(err('phone'))} placeholder="(816) 555-0100" />
              </Field>
              <Field id="f-website" label="Website" error={err('website')}>
                <input {...aria('website')} type="url" inputMode="url" autoComplete="url" value={v.website}
                  onChange={(e) => set('website', e.target.value)} className={inputCls(err('website'))} placeholder="smithroofing.com" />
              </Field>
            </div>
          </div>
        )}

        {step === 'tax' && (
          <div className="space-y-5">
            <p className="text-sm text-slate-600">
              If your business buys for resale or is tax-exempt, upload your resale or exemption certificate.
              Our team verifies it before tax-exempt purchasing is turned on. You can also add it later from your account.
            </p>
            <div>
              <span className="block text-sm font-semibold text-slate-700 mb-1">
                Certificate file <span className="text-slate-400 font-normal">(optional)</span>
              </span>
              {file ? (
                <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${err('certificate') ? 'border-red-300 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
                  <FileUp className="w-5 h-5 text-slate-500 flex-shrink-0" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{fmtBytes(file.size)}</p>
                  </div>
                  <button type="button" onClick={() => { setFile(null); setErrors((e) => ({ ...e, certificate: undefined, resale_cert_state: undefined })); if (fileRef.current) fileRef.current.value = '' }}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:text-red-600" aria-label="Remove file">
                    <X className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="f-certificate"
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0]) }}
                  className={`flex flex-col items-center justify-center text-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-orange-400/40 ${
                    dragOver ? 'border-orange-400 bg-orange-50' : err('certificate') ? 'border-red-300' : 'border-slate-300 hover:border-orange-400 hover:bg-orange-50/40'
                  }`}
                >
                  <FileUp className="w-7 h-7 text-orange-500" aria-hidden />
                  <span className="text-sm font-semibold text-slate-800">Drop a file here or <span className="text-orange-600 underline">browse</span></span>
                  <span className="text-xs text-slate-500">PDF, JPG or PNG · up to {CERT_MAX_BYTES / 1024 / 1024} MB</span>
                </label>
              )}
              <input
                ref={fileRef} id="f-certificate" type="file" accept={CERT_ACCEPT} className="sr-only"
                aria-invalid={!!err('certificate') || undefined}
                aria-describedby={err('certificate') ? 'f-certificate-error' : undefined}
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              {err('certificate') && <p id="f-certificate-error" className="text-xs text-red-600 mt-1" role="alert">{err('certificate')}</p>}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field id="f-resale_cert_state" label="Issuing state" error={err('resale_cert_state')} required={!!file}>
                <select {...aria('resale_cert_state')} value={v.resale_cert_state}
                  onChange={(e) => set('resale_cert_state', e.target.value)} className={inputCls(err('resale_cert_state'))}>
                  <option value="">Select state…</option>
                  {US_STATES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                </select>
              </Field>
              <Field id="f-tax_id" label="Resale / exemption number" error={err('tax_id')}>
                <input {...aria('tax_id')} value={v.tax_id} maxLength={40}
                  onChange={(e) => set('tax_id', e.target.value)} className={inputCls(err('tax_id'))} />
              </Field>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            {([
              ...(mode === 'new' ? [['account', 'Account', [['Email', v.email], ['Password', '••••••••']]] as const] : []),
              ['business', 'Business', [
                ['Name', v.contact_name], ['Company', v.company_name], ['Business type', v.business_type],
                ['Years in business', v.years_in_business], ['Service area', v.service_area],
                ['Est. monthly spend', v.est_monthly_volume], ['Phone', v.phone], ['Website', v.website || '—'],
              ]] as const,
              ['tax', 'Tax exemption', [
                ['Certificate', file ? `${file.name} (${fmtBytes(file.size)})` : 'Not provided'],
                ['Issuing state', US_STATES.find(([c]) => c === v.resale_cert_state)?.[1] ?? '—'],
                ['Number', v.tax_id || '—'],
              ]] as const,
            ] as const).map(([id, title, rows]) => (
              <div key={id} className="rounded-xl border border-slate-200">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                  <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                  <button type="button" onClick={() => goTo(id as StepId)} className="text-xs font-semibold text-orange-600 hover:underline inline-flex items-center gap-1">
                    <Pencil className="w-3 h-3" aria-hidden /> Edit <span className="sr-only">{title}</span>
                  </button>
                </div>
                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 px-4 py-3 text-sm">
                  {rows.map(([k, val]) => (
                    <div key={k} className="flex justify-between sm:block gap-3">
                      <dt className="text-slate-500 text-xs">{k}</dt>
                      <dd className="font-medium text-slate-900 break-words text-right sm:text-left">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
            <div>
              <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
                <input
                  id="f-agree" type="checkbox" checked={v.agree} onChange={(e) => set('agree', e.target.checked)}
                  aria-invalid={!!err('agree') || undefined} aria-describedby={err('agree') ? 'f-agree-error' : undefined}
                  className="mt-0.5 w-4 h-4 accent-orange-500"
                />
                <span>
                  I confirm this information is accurate and agree to the{' '}
                  <Link href="/terms" className="text-orange-600 hover:underline" target="_blank">terms of sale</Link>.
                  Pricing, terms and tax exemption take effect only after approval.
                </span>
              </label>
              {err('agree') && <p id="f-agree-error" className="text-xs text-red-600 mt-1" role="alert">{err('agree')}</p>}
            </div>
          </div>
        )}

        {formError && (
          <p className="mt-6 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden /> {formError}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          {stepIdx > 0 ? (
            <button type="button" onClick={back} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2.5 rounded-lg">
              <ChevronLeft className="w-4 h-4" aria-hidden /> Back
            </button>
          ) : <span />}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-sm shadow-orange-500/20"
          >
            {step === 'review' ? (
              submitting ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Submitting…</> : 'Submit application'
            ) : step === 'tax' && !file && !v.tax_id && !v.resale_cert_state ? (
              <>Skip for now <ChevronRight className="w-4 h-4" aria-hidden /></>
            ) : (
              <>Continue <ChevronRight className="w-4 h-4" aria-hidden /></>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
