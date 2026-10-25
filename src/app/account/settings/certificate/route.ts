// POST /account/settings/certificate — signed-in contractor re-uploads a resale certificate.
// Uses the visitor's own Supabase session, so Storage RLS (own folder only) and the
// contractor_profiles guard trigger both apply.
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo'
import { sendEmail, adminNotificationEmail } from '@/lib/email/send'
import { adminCertificateUploadedEmail } from '@/lib/email/account-emails'
import { CERT_BUCKET, certificateObjectPath, sniffCertificate } from '@/lib/certificates'
import { CERT_MAX_BYTES, CERT_TYPES, isStateCode } from '@/lib/wholesale'

export const runtime = 'nodejs'

const fail = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status })

export async function POST(req: NextRequest) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return fail(400, 'Could not read the upload.')
  }
  const file = form.get('certificate')
  const state = String(form.get('resale_cert_state') ?? '')
  if (!(file instanceof File) || file.size === 0) return fail(422, 'Choose a file to upload.')
  if (!(CERT_TYPES as readonly string[]).includes(file.type)) return fail(422, 'Upload a PDF, JPG or PNG file.')
  if (file.size > CERT_MAX_BYTES) return fail(422, 'File is larger than 10 MB.')
  if (!isStateCode(state)) return fail(422, 'Choose the issuing state.')
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!sniffCertificate(bytes, file.type)) return fail(422, "That file doesn't look like a valid PDF, JPG or PNG.")

  if (isDemoMode()) return NextResponse.json({ ok: true, demo: true, message: 'Demo mode: file validated, but not stored.' })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail(401, 'Please sign in again.')

  const { data: profile } = await supabase
    .from('contractor_profiles')
    .select('id, company_name, contact_name, email')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) return fail(404, 'Complete your wholesale application first.')

  const path = certificateObjectPath(user.id, file.name)
  const { error: upErr } = await supabase.storage.from(CERT_BUCKET).upload(path, bytes, { contentType: file.type, upsert: false })
  if (upErr) {
    console.error('certificate upload', upErr)
    return fail(500, 'Upload failed. Please try again.')
  }
  const { error } = await supabase
    .from('contractor_profiles')
    .update({ resale_certificate_path: path, resale_cert_state: state })
    .eq('id', user.id)
  if (error) {
    console.error('certificate profile update', error)
    return fail(500, 'Uploaded, but we could not attach it to your profile. Please contact us.')
  }

  await sendEmail({ to: adminNotificationEmail(), ...adminCertificateUploadedEmail({ ...profile, resale_cert_state: state }) })
  return NextResponse.json({ ok: true, message: 'Certificate uploaded. Our team will review it.' })
}
