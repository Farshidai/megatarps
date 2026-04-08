'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account/settings?reset=1`,
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-black text-orange-500">MegaTarps</a>
          <p className="text-slate-500 mt-2 text-sm">Reset your password</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-3">📬</div>
              <p className="font-bold text-slate-900 mb-2">Check your inbox</p>
              <p className="text-sm text-slate-500">
                If <strong>{email}</strong> has an account, you&apos;ll receive a reset link shortly.
              </p>
              <a href="/account/login" className="mt-5 inline-block text-orange-600 font-semibold hover:underline text-sm">
                Back to sign in
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email address</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                  placeholder="you@company.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <div className="text-center">
                <a href="/account/login" className="text-sm text-slate-500 hover:text-orange-600">
                  Back to sign in
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
