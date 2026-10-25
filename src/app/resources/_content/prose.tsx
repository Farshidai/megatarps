// Small typed building blocks for article bodies. Styling lives here so the
// articles stay plain content (no typography plugin needed).
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Info, AlertTriangle } from 'lucide-react'

export function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-28 text-2xl font-black text-slate-900 tracking-tight mt-12 mb-4">
      {children}
    </h2>
  )
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-bold text-slate-900 mt-8 mb-3">{children}</h3>
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-slate-700 leading-relaxed mb-5">{children}</p>
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-6 space-y-2 text-slate-700 leading-relaxed mb-5 marker:text-orange-500">{children}</ul>
}

export function OL({ children }: { children: ReactNode }) {
  return <ol className="list-decimal pl-6 space-y-2 text-slate-700 leading-relaxed mb-5 marker:font-bold marker:text-orange-600">{children}</ol>
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-orange-700 underline decoration-orange-300 underline-offset-2 hover:decoration-orange-600">
      {children}
    </Link>
  )
}

export function Table({ head, rows, caption }: { head: string[]; rows: ReactNode[][]; caption?: string }) {
  return (
    <div className="my-6 overflow-x-auto rounded-xl ring-1 ring-slate-200">
      <table className="w-full text-sm text-left">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-slate-900 text-white">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-bold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
              {r.map((c, j) =>
                j === 0 ? (
                  <th key={j} scope="row" className="px-4 py-3 font-bold text-slate-900 align-top whitespace-nowrap">{c}</th>
                ) : (
                  <td key={j} className="px-4 py-3 text-slate-700 align-top">{c}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Callout({ tone = 'tip', title, children }: { tone?: 'tip' | 'warn'; title: string; children: ReactNode }) {
  const warn = tone === 'warn'
  const Icon = warn ? AlertTriangle : Info
  return (
    <aside
      className={`my-6 rounded-xl p-5 ring-1 ${warn ? 'bg-amber-50 ring-amber-200' : 'bg-orange-50 ring-orange-200'}`}
    >
      <p className={`flex items-center gap-2 font-bold mb-2 ${warn ? 'text-amber-900' : 'text-orange-900'}`}>
        <Icon className="w-4 h-4" aria-hidden="true" /> {title}
      </p>
      <div className={`text-sm leading-relaxed ${warn ? 'text-amber-900' : 'text-orange-950'}`}>{children}</div>
    </aside>
  )
}
