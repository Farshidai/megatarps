'use client'

import { useId, useState } from 'react'
import { Mail, CheckCircle, Loader2 } from 'lucide-react'

type Status = 'idle' | 'sending' | 'done' | 'error'

/** Email capture block. Posts to /api/newsletter. `variant="dark"` for navy sections. */
export function NewsletterSignup({
  source = 'homepage',
  variant = 'light',
  title = 'Stock alerts and pallet pricing, by email',
  blurb = 'New sizes, seasonal pallet buys before storm and freeze season, and practical tarp guides. A few emails a month at most. Unsubscribe anytime.',
}: {
  source?: 'homepage' | 'resources' | 'footer' | 'article' | 'calculator'
  variant?: 'light' | 'dark'
  title?: string
  blurb?: string
}) {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const id = useId()
  const dark = variant === 'dark'

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())
    setStatus('sending')
    setMessage('')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...data, source }),
      })
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (res.ok && json.ok) {
        setStatus('done')
        form.reset()
      } else {
        setStatus('error')
        setMessage(json.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 lg:p-10 grid lg:grid-cols-[1fr_minmax(0,460px)] gap-6 lg:gap-10 items-center ${
        dark ? 'bg-slate-900 ring-1 ring-white/10 text-white' : 'bg-slate-50 ring-1 ring-slate-200 text-slate-900'
      }`}
    >
      <div>
        <p className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] mb-2 ${dark ? 'text-orange-400' : 'text-orange-600'}`}>
          <Mail className="w-4 h-4" aria-hidden="true" /> Newsletter
        </p>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h2>
        <p className={`mt-2 leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{blurb}</p>
      </div>

      {status === 'done' ? (
        <p role="status" className={`flex items-center gap-2 font-bold ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>
          <CheckCircle className="w-5 h-5" aria-hidden="true" /> You&apos;re on the list. Thanks!
        </p>
      ) : (
        <form onSubmit={onSubmit} className="w-full">
          <div className="flex flex-col sm:flex-row gap-3">
            <label htmlFor={`${id}-email`} className="sr-only">Work email</label>
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              className={`flex-1 min-w-0 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                dark ? 'bg-white/10 ring-1 ring-white/20 text-white placeholder:text-slate-400' : 'bg-white ring-1 ring-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />
            {/* Honeypot: hidden from people and assistive tech */}
            <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
              <label htmlFor={`${id}-website`}>Website</label>
              <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              {status === 'sending' && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              Subscribe
            </button>
          </div>
          <p className={`mt-2 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            We never sell your address. See our <a href="/privacy" className="underline hover:text-orange-500">privacy policy</a>.
          </p>
          {status === 'error' && (
            <p role="alert" className={`mt-2 text-sm font-semibold ${dark ? 'text-red-300' : 'text-red-600'}`}>{message}</p>
          )}
        </form>
      )}
    </div>
  )
}
