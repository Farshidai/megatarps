// POST /apply/submit — multipart wholesale application.
// Creates the auth user (or reuses the signed-in one for re-applications), writes the
// contractor_profiles row as `pending` with the service role, stores the optional
// resale certificate in the private `resale-certificates` bucket, and emails
// the applicant + admin. All validation is repeated here (never trust the browser).
import { rateLimit } from '@/lib/rate-limit'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/admin'
import { getCurrentAccount } from '@/lib/accounts'
import { isDemoMode } from '@/lib/demo'
import { sendEmail, adminNotificationEmail } from '@/lib/email/send'
import { applicantReceivedEmail, adminNewApplicationEmail } from '@/lib/email/account-emails'
import {
  EMPTY_APPLICATION, normalizeWebsite, validateApplication,
  type ApplicationInput, type FieldErrors,
} from '@/lib/wholesale'
import { certificateObjectPath, sniffCertificate } from '@/lib/certificates'

export const runtime = 'nodejs'

type Mode = 'new' | 'complete' | 'reapply' | 'existing'

function readInput(form: FormData): ApplicationInput {
  const s = (k: keyof ApplicationInput) => String(form.get(k) ?? '').slice(0, 500)
  return {
    ...EMPTY_APPLICATION,
    email: s('email').trim().toLowerCase(),
    password: String(form.get('password') ?? ''),
    confirm: String(form.get('confirm') ?? ''),
    contact_name: s('contact_name').trim(),
    company_name: s('company_name').trim(),
    business_type: s('business_type'),
    years_in_business: s('years_in_business').trim(),
    service_area: s('service_area').trim(),
    est_monthly_volume: s('est_monthly_volume'),
    website: s('website').trim(),
    phone: s('phone').trim(),
    resale_cert_state: s('resale_cert_state'),
    tax_id: s('tax_id').trim(),
    agree: form.get('agree') === 'on' || form.get('agree') === 'true',
  }
}

const fail = (status: number, error: string, errors?: FieldErrors) =>
  NextResponse.json({ ok: false, error, errors }, { status })

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'apply')
  if (limited) return limited
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return fail(400, 'Could not read the form. Please try again.')
  }

  // Honeypot: bots fill hidden fields. Pretend success, do nothing.
  if (String(form.get('fax') ?? '').trim()) return NextResponse.json({ ok: true, needsConfirmation: true })

  const v = readInput(form)
  const raw = form.get('certificate')
  const file = raw instanceof File && raw.size > 0 ? raw : null

  const account = await getCurrentAccount()
  const mode: Mode = !account.user
    ? 'new'
    : !account.profile
      ? 'complete'
      : account.profile.account_status === 'rejected'
        ? 'reapply'
        : 'existing'

  if (mode === 'existing') {
    return fail(409, 'You already have a wholesale account application on file.')
  }
  if (mode !== 'new') v.email = account.user?.email ?? v.email

  const errors = validateApplication(v, file ? { size: file.size, type: file.type } : null, {
    requireAccount: mode === 'new',
  })
  let bytes: Uint8Array | null = null
  if (file && !errors.certificate) {
    bytes = new Uint8Array(await file.arrayBuffer())
    if (!sniffCertificate(bytes, file.type)) errors.certificate = "That file doesn't look like a valid PDF, JPG or PNG."
  }
  if (Object.keys(errors).length) return fail(422, 'Please fix the highlighted fields.', errors)

  const profileFields = {
    company_name: v.company_name,
    contact_name: v.contact_name,
    email: v.email,
    phone: v.phone,
    business_type: v.business_type,
    service_area: v.service_area,
    years_in_business: Number(v.years_in_business),
    est_monthly_volume: v.est_monthly_volume,
    website: normalizeWebsite(v.website),
    tax_id: v.tax_id || null,
    resale_cert_state: file ? v.resale_cert_state : v.resale_cert_state || null,
  }

  // ── DEMO MODE: validate + log emails, persist nothing ──────────────────────
  if (isDemoMode()) {
    const demoProfile = { id: 'demo-new-application', ...profileFields }
    await Promise.all([
      sendEmail({ to: v.email, ...applicantReceivedEmail(demoProfile) }),
      sendEmail({ to: adminNotificationEmail(), ...adminNewApplicationEmail(demoProfile, !!file, mode === 'reapply') }),
    ])
    return NextResponse.json({ ok: true, demo: true, needsConfirmation: mode === 'new', mode })
  }

  let service
  try {
    service = createServiceClient()
  } catch (e) {
    console.error(e)
    return fail(500, 'Applications are temporarily unavailable. Please call or email us.')
  }

  let userId = account.user?.id ?? ''
  let needsConfirmation = false

  // ── 1. Auth user ───────────────────────────────────────────────────────────
  if (mode === 'new') {
    const supabase = await createClient()
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
    const { data, error } = await supabase.auth.signUp({
      email: v.email,
      password: v.password,
      options: {
        emailRedirectTo: `${origin}/account`,
        data: { full_name: v.contact_name, company: v.company_name },
      },
    })
    if (error) {
      const exists = /already|registered|exists/i.test(error.message)
      return fail(exists ? 409 : 400, exists ? 'An account with this email already exists.' : error.message,
        { email: exists ? 'This email already has an account — sign in to continue.' : error.message })
    }
    // Supabase returns a user with no identities when the email is already registered
    if (!data.user || (data.user.identities && data.user.identities.length === 0)) {
      return fail(409, 'An account with this email already exists.', {
        email: 'This email already has an account — sign in to continue.',
      })
    }
    userId = data.user.id
    needsConfirmation = !data.session
  }

  // ── 2. Profile row (service role; status forced to pending) ────────────────
  const reset = {
    account_status: 'pending',
    wholesale_discount_percent: 0,
    payment_terms: 'prepaid',
    credit_limit_cents: null,
    tax_exempt: false,
    approved_at: null,
    approved_by: null,
    rejection_reason: null,
  }
  const { error: profileError } =
    mode === 'reapply'
      ? await service.from('contractor_profiles').update({ ...profileFields, ...reset }).eq('id', userId)
      : await service.from('contractor_profiles').insert({ id: userId, ...profileFields, ...reset })

  if (profileError) {
    console.error('Profile write failed', profileError)
    if (mode === 'new') await service.auth.admin.deleteUser(userId).catch(() => undefined)
    return fail(500, 'We could not save your application. Please try again.')
  }

  // ── 3. Certificate (optional) ──────────────────────────────────────────────
  let warning: string | undefined
  let hasCert = false
  if (file && bytes) {
    const path = certificateObjectPath(userId, file.name)
    const { error: upErr } = await service.storage
      .from('resale-certificates')
      .upload(path, bytes, { contentType: file.type, upsert: false })
    if (upErr) {
      console.error('Certificate upload failed', upErr)
      warning = 'Your application was submitted, but the certificate upload failed. Please re-upload it from Account Settings.'
    } else {
      hasCert = true
      await service.from('contractor_profiles')
        .update({ resale_certificate_path: path, resale_cert_state: v.resale_cert_state })
        .eq('id', userId)
    }
  }

  // ── 4. Emails (best effort) ────────────────────────────────────────────────
  const p = { id: userId, ...profileFields }
  await Promise.all([
    sendEmail({ to: v.email, ...applicantReceivedEmail(p) }),
    sendEmail({ to: adminNotificationEmail(), ...adminNewApplicationEmail(p, hasCert, mode === 'reapply') }),
  ])

  return NextResponse.json({ ok: true, needsConfirmation, warning, mode })
}
