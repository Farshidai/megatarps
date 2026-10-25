'use client'

import { useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="space-y-2">
      <input readOnly value={url} aria-label="Customer quote link" onFocus={(e) => e.currentTarget.select()}
        className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-600" />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={async () => {
            try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* ignore */ }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold border border-slate-300 rounded-lg px-3 py-1.5 hover:border-orange-400"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <a href={`${url}?preview=1`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-xs font-semibold border border-slate-300 rounded-lg px-3 py-1.5 hover:border-orange-400">
          <ExternalLink className="w-3.5 h-3.5" aria-hidden /> Customer view
        </a>
      </div>
    </div>
  )
}
