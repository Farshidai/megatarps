'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Metadata } from 'next'

// Note: metadata must be in a server component wrapper — put it in layout or use title tag
export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (authError) {
      setError('Invalid email or password.')
      setLoading(false)
    } else {
      router.push('/account')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-black text-orange-500">MegaTarps</a>
          <p className="text-slate-500 mt-2 text-sm">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <a href="/account/forgot-password" className="text-xs text-orange-600 hover:underline">Forgot password?</a>
              </div>
              <input
                required
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
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
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{' '}
            <a href="/account/register" className="text-orange-600 font-semibold hover:underline">
              Create one
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          No account needed for{' '}
          <a href="/bulk-quote" className="text-orange-600 hover:underline">bulk quote requests</a>
        </p>
      </div>
    </div>
  )
}
