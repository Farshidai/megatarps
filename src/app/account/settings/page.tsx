import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Account Settings' }

export default async function AccountSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-slate-500 mb-4">Sign in to manage your account.</p>
        <a href="/account/login" className="text-orange-600 font-semibold hover:underline">Sign In →</a>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('contractor_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-black text-slate-900">Account Settings</h1>

      {/* Account info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Account Info</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Email</span>
            <span className="font-medium text-slate-900">{user.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Account created</span>
            <span className="font-medium text-slate-900">
              {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Company profile */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Company Profile</h2>
        {profile ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Company</span>
              <span className="font-medium text-slate-900">{profile.company_name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Contact</span>
              <span className="font-medium text-slate-900">{profile.contact_name}</span>
            </div>
            {profile.phone && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Phone</span>
                <span className="font-medium text-slate-900">{profile.phone}</span>
              </div>
            )}
            {profile.business_type && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Business type</span>
                <span className="font-medium text-slate-900">{profile.business_type}</span>
              </div>
            )}
            {profile.tax_exempt && (
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Tax exempt</span>
                <span className="font-semibold text-green-600">Yes{profile.tax_id ? ` — ${profile.tax_id}` : ''}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No company profile on file. Contact us at{' '}
            <a href="mailto:orders@megatarps.com" className="text-orange-600 hover:underline">
              orders@megatarps.com
            </a>{' '}
            to set up a contractor account.
          </p>
        )}
      </div>

      {/* Password reset */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-3">Security</h2>
        <p className="text-sm text-slate-500 mb-4">
          Use the button below to receive a password reset link by email.
        </p>
        <form action="/api/auth/reset-password" method="POST">
          <input type="hidden" name="email" value={user.email ?? ''} />
          <button type="submit"
            className="border border-slate-300 text-slate-700 hover:border-orange-400 hover:text-orange-600 font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
            Send Reset Link
          </button>
        </form>
      </div>

      {/* Sign out */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form action="/api/auth/signout" method="POST">
          <button type="submit"
            className="text-red-600 hover:text-red-700 font-semibold text-sm hover:underline">
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}
