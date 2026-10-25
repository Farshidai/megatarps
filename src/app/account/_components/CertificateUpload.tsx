'use client'

import { useState } from 'react'
import { FileUp, Loader2 } from 'lucide-react'
import { CERT_ACCEPT, CERT_MAX_BYTES, CERT_TYPES, US_STATES } from '@/lib/wholesale'

export function CertificateUpload({ currentState }: { currentState: string | null }) {
  const [file, setFile] = useState<File | null>(null)
  const [st, setSt] = useState(currentState ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (!file) return setMsg({ ok: false, text: 'Choose a file to upload.' })
    if (!(CERT_TYPES as readonly string[]).includes(file.type)) return setMsg({ ok: false, text: 'Upload a PDF, JPG or PNG file.' })
    if (file.size > CERT_MAX_BYTES) return setMsg({ ok: false, text: 'File is larger than 10 MB.' })
    if (!st) return setMsg({ ok: false, text: 'Choose the issuing state.' })
    setBusy(true)
    const fd = new FormData()
    fd.append('certificate', file)
    fd.append('resale_cert_state', st)
    try {
      const res = await fetch('/account/settings/certificate', { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({ ok: false, error: 'Unexpected response.' }))
      setMsg({ ok: !!json.ok, text: json.ok ? json.message : json.error })
      if (json.ok && !json.demo) setTimeout(() => window.location.reload(), 900)
    } catch {
      setMsg({ ok: false, text: 'Network error. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid sm:grid-cols-[1fr_10rem_auto] gap-3 items-end" noValidate>
      <div>
        <label htmlFor="cert-file" className="block text-xs font-semibold text-slate-600 mb-1">Certificate (PDF, JPG or PNG, max 10 MB)</label>
        <label className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white cursor-pointer hover:border-orange-400 focus-within:ring-2 focus-within:ring-orange-400/40">
          <FileUp className="w-4 h-4 text-orange-500 flex-shrink-0" aria-hidden />
          <span className="truncate text-slate-600">{file ? file.name : 'Choose file…'}</span>
          <input id="cert-file" type="file" accept={CERT_ACCEPT} className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
      </div>
      <div>
        <label htmlFor="cert-state" className="block text-xs font-semibold text-slate-600 mb-1">Issuing state</label>
        <select id="cert-state" value={st} onChange={(e) => setSt(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400">
          <option value="">Select…</option>
          {US_STATES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
        </select>
      </div>
      <button type="submit" disabled={busy}
        className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold text-sm px-4 py-2 rounded-lg">
        {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />} Upload
      </button>
      {msg && <p role="status" className={`sm:col-span-3 text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>}
    </form>
  )
}
