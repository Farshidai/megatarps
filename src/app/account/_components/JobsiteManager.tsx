'use client'

import { useActionState, useState } from 'react'
import { MapPin, Plus, Trash2, Loader2 } from 'lucide-react'
import { addJobsite, removeJobsite, type ActionState } from '../settings/actions'
import { US_STATES, type JobsiteAddress } from '@/lib/wholesale'

const cls = (err?: string) =>
  `w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 ${err ? 'border-red-400' : 'border-slate-300'}`

export function JobsiteManager({ sites, demo }: { sites: JobsiteAddress[]; demo: boolean }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const res = await addJobsite(prev, fd)
    if (res.ok && !demo) setOpen(false) // unmounts (and so clears) the form
    return res
  }, { ok: false, message: '' })
  const e = state.errors ?? {}

  const field = (name: string, label: string, el: React.ReactNode, span = '') => (
    <div className={span}>
      <label htmlFor={`js-${name}`} className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {el}
      {e[name] && <p id={`js-${name}-error`} className="text-xs text-red-600 mt-1">{e[name]}</p>}
    </div>
  )
  const a = (name: string) => ({
    id: `js-${name}`, name, 'aria-invalid': !!e[name] || undefined,
    'aria-describedby': e[name] ? `js-${name}-error` : undefined, className: cls(e[name]),
  })

  return (
    <div className="space-y-4">
      {sites.length === 0 ? (
        <p className="text-sm text-slate-500">No saved jobsites yet. Save delivery addresses you ship to often.</p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {sites.map((s) => (
            <li key={s.id} className="rounded-lg border border-slate-200 p-4 flex gap-3">
              <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" aria-hidden />
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-bold text-slate-900">{s.label}</p>
                <p className="text-slate-600">{s.line1}{s.line2 ? `, ${s.line2}` : ''}</p>
                <p className="text-slate-600">{s.city}, {s.state} {s.zip}</p>
                {s.notes && <p className="text-xs text-slate-400 mt-1">{s.notes}</p>}
              </div>
              <form action={removeJobsite}>
                <input type="hidden" name="id" value={s.id} />
                <button type="submit" className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50" aria-label={`Remove ${s.label}`}
                  title={demo ? 'Demo mode: not saved' : 'Remove'}>
                  <Trash2 className="w-4 h-4" aria-hidden />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {!open ? (
        <button type="button" onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700">
          <Plus className="w-4 h-4" aria-hidden /> Add a jobsite
        </button>
      ) : (
        <form action={action} noValidate className="rounded-lg border border-slate-200 bg-slate-50 p-4 grid sm:grid-cols-6 gap-3">
          {field('label', 'Jobsite name', <input {...a('label')} placeholder="e.g. Oak Ridge re-roof" />, 'sm:col-span-6')}
          {field('line1', 'Street address', <input {...a('line1')} autoComplete="address-line1" />, 'sm:col-span-4')}
          {field('line2', 'Suite / unit', <input {...a('line2')} autoComplete="address-line2" />, 'sm:col-span-2')}
          {field('city', 'City', <input {...a('city')} autoComplete="address-level2" />, 'sm:col-span-3')}
          {field('state', 'State', (
            <select {...a('state')} defaultValue="">
              <option value="">—</option>
              {US_STATES.map(([c]) => <option key={c} value={c}>{c}</option>)}
            </select>
          ), 'sm:col-span-1')}
          {field('zip', 'ZIP', <input {...a('zip')} inputMode="numeric" autoComplete="postal-code" />, 'sm:col-span-2')}
          {field('notes', 'Delivery notes', <input {...a('notes')} placeholder="Gate code, forklift on site, etc." />, 'sm:col-span-6')}
          <div className="sm:col-span-6 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={pending}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-sm px-4 py-2 rounded-lg">
              {pending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />} Save jobsite
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-500 hover:text-slate-800">Cancel</button>
            {state.message && <p role="status" className={`text-sm ${state.ok ? 'text-emerald-700' : 'text-red-600'}`}>{state.message}</p>}
          </div>
        </form>
      )}
    </div>
  )
}
