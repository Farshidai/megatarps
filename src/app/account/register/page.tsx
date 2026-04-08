'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', company: '', email: '', password: '', confirm: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name, company: form.company },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // If email confirmation is required (depends on Supabase settings)
    if (data.user && !data.session) {
      setSuccess(true)
    } else {
      router.push('/account')
      router.refresh()
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Check your email</h2>
          <p className="text-slate-500 text-sm mb-6">
            We sent a confirmation link to <strong>{form.email}</strong>.
            Click it to activate your account.
          </p>
          <a href="/account/login" className="text-orange-600 font-semibold hover:underline text-sm">
            Back to sign in
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-black text-orange-500">MegaTarps</a>
          <p className="text-slate-500 mt-2 text-sm">Create a contractor account</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Company</label>
                <input
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                  placeholder="Smith Roofing"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                placeholder="john@smithroofing.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password *</label>
              <input
                required
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm Password *</label>
              <input
                required
                type="password"
                value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <a href="/account/login" className="text-orange-600 font-semibold hover:underline">
              Sign in
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Accounts give you order history and saved quotes.
          Guest checkout is always available.
        </p>
      </div>
    </div>
  )
}
