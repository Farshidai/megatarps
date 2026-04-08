import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
  const form = await request.formData()
  const email = form.get('email') as string

  if (!email) redirect('/account/settings')

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/account/settings?reset=1`,
  })

  redirect('/account/settings?reset=sent')
}
