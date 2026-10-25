const STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full capitalize ${STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  )
}
